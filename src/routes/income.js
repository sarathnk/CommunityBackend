import { Router } from 'express';
import { requireAuth, requirePermission } from '../middlewares/auth.js';
import { prisma } from '../lib/prisma.js';

export const router = Router();

// GET /api/income - List all income records with pagination and filtering
router.get('/', requireAuth, async (req, res) => {
  try {
    // Extract and validate query parameters
    const q = String(req.query.q || '').trim();
    const limit = Math.min(Math.max(parseInt(String(req.query.limit || '20')) || 20, 1), 100);
    const cursor = req.query.cursor ? parseInt(String(req.query.cursor)) : undefined;
    const eventId = req.query.eventId ? String(req.query.eventId) : undefined;
    const paidStatus = req.query.paidStatus ? String(req.query.paidStatus) : undefined;
    const approveStatus = req.query.approveStatus ? String(req.query.approveStatus) : undefined;

    // Get user's organization context
    const organizationId = req.user.organizationId || req.user.orgId;
    if (!organizationId) {
      return res.status(401).json({ message: 'User organization not found' });
    }

    // Build where clause with filters
    const where = {
      organizationId: organizationId,
      ...(eventId ? { eventId } : {}),
      ...(paidStatus ? { paidStatus } : {}),
      ...(approveStatus ? { approveStatus } : {}),
      ...(q ? {
        OR: [
          { receiptNumber: { contains: q, mode: 'insensitive' } },
          { event: { title: { contains: q, mode: 'insensitive' } } },
        ]
      } : {}),
    };

    // Build query with pagination
    const query = {
      where,
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
          }
        },
        organization: {
          select: {
            id: true,
            name: true,
          }
        },
      },
      orderBy: { date: 'desc' },
      take: limit + 1,
      ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
    };

    // Execute query
    const list = await prisma.income.findMany(query);

    // Calculate pagination
    const hasMore = list.length > limit;
    const items = list.slice(0, limit);
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    return res.json({ items, nextCursor });
  } catch (error) {
    console.error('[GET /api/income] Error:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
});

// GET /api/income/stats - Get income statistics
router.get('/stats', requireAuth, async (req, res) => {
  try {
    const organizationId = req.user.organizationId || req.user.orgId;
    if (!organizationId) {
      return res.status(401).json({ message: 'User organization not found' });
    }

    const eventId = req.query.eventId ? String(req.query.eventId) : undefined;

    const where = {
      organizationId: organizationId,
      ...(eventId ? { eventId } : {}),
    };

    // Get total income (only approved)
    const approvedIncome = await prisma.income.aggregate({
      where: {
        ...where,
        approveStatus: 'Approved',
      },
      _sum: {
        amount: true,
      },
      _count: true,
    });

    // Get pending income
    const pendingIncome = await prisma.income.aggregate({
      where: {
        ...where,
        approveStatus: 'Pending',
      },
      _sum: {
        amount: true,
      },
      _count: true,
    });

    // Get paid vs unpaid
    const paidCount = await prisma.income.count({
      where: {
        ...where,
        paidStatus: 'Paid',
      },
    });

    const unpaidCount = await prisma.income.count({
      where: {
        ...where,
        paidStatus: 'Pending',
      },
    });

    return res.json({
      approvedIncome: {
        total: approvedIncome._sum.amount || 0,
        count: approvedIncome._count,
      },
      pendingIncome: {
        total: pendingIncome._sum.amount || 0,
        count: pendingIncome._count,
      },
      paidCount,
      unpaidCount,
    });
  } catch (error) {
    console.error('[GET /api/income/stats] Error:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
});

// GET /api/income/:id - Get single income record by ID
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const incomeId = parseInt(id);

    if (isNaN(incomeId)) {
      return res.status(400).json({ message: 'Invalid income ID' });
    }

    const organizationId = req.user.organizationId || req.user.orgId;
    if (!organizationId) {
      return res.status(401).json({ message: 'User organization not found' });
    }

    // Find income record in user's organization
    const income = await prisma.income.findFirst({
      where: {
        id: incomeId,
        organizationId: organizationId,
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
            startDate: true,
            location: true,
          }
        },
        organization: {
          select: {
            id: true,
            name: true,
          }
        },
      },
    });

    if (!income) {
      return res.status(404).json({ message: 'Income record not found' });
    }

    return res.json(income);
  } catch (error) {
    console.error('[GET /api/income/:id] Error:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
});

// POST /api/income - Create new income record
router.post('/', requireAuth, requirePermission('income.write'), async (req, res) => {
  try {
    const {
      receiptPic,
      receiptNumber,
      amount,
      description,
      eventId,
      paidStatus,
      approveStatus,
      date,
      time,
    } = req.body;

    // Validate required fields
    if (!amount || !eventId || !date || !time) {
      return res.status(400).json({
        message: 'Invalid payload: amount, eventId, date, and time are required'
      });
    }

    // Validate amount is positive
    const numAmount = parseFloat(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({
        message: 'Amount must be a positive number'
      });
    }

    // Get organization context
    const organizationId = req.user.organizationId || req.user.orgId;
    if (!organizationId) {
      return res.status(401).json({ message: 'User organization not found' });
    }

    // Verify event exists and belongs to user's organization
    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        organizationId: organizationId,
      },
    });

    if (!event) {
      return res.status(400).json({
        message: 'Invalid event: Event not found or does not belong to your organization'
      });
    }

    // Validate enum values
    const validPaidStatuses = ['Pending', 'Paid'];
    const validApproveStatuses = ['Approved', 'Declined', 'Pending'];

    const finalPaidStatus = paidStatus || 'Pending';
    const finalApproveStatus = approveStatus || 'Pending';

    if (!validPaidStatuses.includes(finalPaidStatus)) {
      return res.status(400).json({
        message: `Invalid paidStatus. Must be one of: ${validPaidStatuses.join(', ')}`
      });
    }

    if (!validApproveStatuses.includes(finalApproveStatus)) {
      return res.status(400).json({
        message: `Invalid approveStatus. Must be one of: ${validApproveStatuses.join(', ')}`
      });
    }

    // Create income record
    const income = await prisma.income.create({
      data: {
        receiptPic: receiptPic || null,
        receiptNumber: receiptNumber || null,
        amount: numAmount,
        description: description || null,
        eventId,
        organizationId,
        paidStatus: finalPaidStatus,
        approveStatus: finalApproveStatus,
        approvePersonId: null,
        date: new Date(date),
        time: new Date(`1970-01-01T${time}`),
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
          }
        },
      },
    });

    return res.status(201).json(income);
  } catch (error) {
    console.error('[POST /api/income] Error:', error);

    // Handle Prisma-specific errors
    if (error.code && error.code.startsWith('P')) {
      return res.status(400).json({
        message: 'Database error',
        error: error.message
      });
    }

    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
});

// PUT /api/income/:id - Update income record
router.put('/:id', requireAuth, requirePermission('income.write'), async (req, res) => {
  try {
    const { id } = req.params;
    const incomeId = parseInt(id);

    if (isNaN(incomeId)) {
      return res.status(400).json({ message: 'Invalid income ID' });
    }

    const {
      receiptPic,
      receiptNumber,
      amount,
      description,
      eventId,
      paidStatus,
      approveStatus,
      date,
      time,
    } = req.body;

    // Get organization context
    const organizationId = req.user.organizationId || req.user.orgId;
    if (!organizationId) {
      return res.status(401).json({ message: 'User organization not found' });
    }

    // Find existing income record
    const existingIncome = await prisma.income.findFirst({
      where: {
        id: incomeId,
        organizationId: organizationId,
      },
    });

    if (!existingIncome) {
      return res.status(404).json({ message: 'Income record not found' });
    }

    // Validate amount if provided
    let finalAmount = existingIncome.amount;
    if (amount !== undefined) {
      const numAmount = parseFloat(amount);
      if (isNaN(numAmount) || numAmount <= 0) {
        return res.status(400).json({
          message: 'Amount must be a positive number'
        });
      }
      finalAmount = numAmount;
    }

    // Verify event if provided
    let finalEventId = existingIncome.eventId;
    if (eventId !== undefined) {
      const event = await prisma.event.findFirst({
        where: {
          id: eventId,
          organizationId: organizationId,
        },
      });

      if (!event) {
        return res.status(400).json({
          message: 'Invalid event: Event not found or does not belong to your organization'
        });
      }
      finalEventId = eventId;
    }

    // Validate enum values if provided
    const validPaidStatuses = ['Pending', 'Paid'];
    const validApproveStatuses = ['Approved', 'Declined', 'Pending'];

    const finalPaidStatus = paidStatus !== undefined ? paidStatus : existingIncome.paidStatus;
    const finalApproveStatus = approveStatus !== undefined ? approveStatus : existingIncome.approveStatus;

    if (!validPaidStatuses.includes(finalPaidStatus)) {
      return res.status(400).json({
        message: `Invalid paidStatus. Must be one of: ${validPaidStatuses.join(', ')}`
      });
    }

    if (!validApproveStatuses.includes(finalApproveStatus)) {
      return res.status(400).json({
        message: `Invalid approveStatus. Must be one of: ${validApproveStatuses.join(', ')}`
      });
    }

    // Build update data
    const updateData = {
      receiptPic: receiptPic !== undefined ? receiptPic : existingIncome.receiptPic,
      receiptNumber: receiptNumber !== undefined ? receiptNumber : existingIncome.receiptNumber,
      amount: finalAmount,
      description: description !== undefined ? description : existingIncome.description,
      eventId: finalEventId,
      paidStatus: finalPaidStatus,
      approveStatus: finalApproveStatus,
      date: date !== undefined ? new Date(date) : existingIncome.date,
      time: time !== undefined ? new Date(`1970-01-01T${time}`) : existingIncome.time,
    };

    // Update income record
    const updated = await prisma.income.update({
      where: { id: incomeId },
      data: updateData,
      include: {
        event: {
          select: {
            id: true,
            title: true,
          }
        },
      },
    });

    return res.json(updated);
  } catch (error) {
    console.error('[PUT /api/income/:id] Error:', error);

    // Handle Prisma-specific errors
    if (error.code && error.code.startsWith('P')) {
      return res.status(400).json({
        message: 'Database error',
        error: error.message
      });
    }

    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
});

// PATCH /api/income/:id/approve - Approve or decline income record
router.patch('/:id/approve', requireAuth, requirePermission('income.write'), async (req, res) => {
  try {
    const { id } = req.params;
    const incomeId = parseInt(id);

    if (isNaN(incomeId)) {
      return res.status(400).json({ message: 'Invalid income ID' });
    }

    const { approveStatus } = req.body;

    // Validate approve status
    const validApproveStatuses = ['Approved', 'Declined', 'Pending'];
    if (!approveStatus || !validApproveStatuses.includes(approveStatus)) {
      return res.status(400).json({
        message: `Invalid approveStatus. Must be one of: ${validApproveStatuses.join(', ')}`
      });
    }

    // Get organization context
    const organizationId = req.user.organizationId || req.user.orgId;
    if (!organizationId) {
      return res.status(401).json({ message: 'User organization not found' });
    }

    // Find existing income record
    const existingIncome = await prisma.income.findFirst({
      where: {
        id: incomeId,
        organizationId: organizationId,
      },
    });

    if (!existingIncome) {
      return res.status(404).json({ message: 'Income record not found' });
    }

    // Update approval status and approver
    const updated = await prisma.income.update({
      where: { id: incomeId },
      data: {
        approveStatus,
        approvePersonId: req.user.sub,
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
          }
        },
      },
    });

    return res.json(updated);
  } catch (error) {
    console.error('[PATCH /api/income/:id/approve] Error:', error);

    // Handle Prisma-specific errors
    if (error.code && error.code.startsWith('P')) {
      return res.status(400).json({
        message: 'Database error',
        error: error.message
      });
    }

    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
});

// PATCH /api/income/:id/paid - Mark income as paid or pending
router.patch('/:id/paid', requireAuth, requirePermission('income.write'), async (req, res) => {
  try {
    const { id } = req.params;
    const incomeId = parseInt(id);

    if (isNaN(incomeId)) {
      return res.status(400).json({ message: 'Invalid income ID' });
    }

    const { paidStatus } = req.body;

    // Validate paid status
    const validPaidStatuses = ['Pending', 'Paid'];
    if (!paidStatus || !validPaidStatuses.includes(paidStatus)) {
      return res.status(400).json({
        message: `Invalid paidStatus. Must be one of: ${validPaidStatuses.join(', ')}`
      });
    }

    // Get organization context
    const organizationId = req.user.organizationId || req.user.orgId;
    if (!organizationId) {
      return res.status(401).json({ message: 'User organization not found' });
    }

    // Find existing income record
    const existingIncome = await prisma.income.findFirst({
      where: {
        id: incomeId,
        organizationId: organizationId,
      },
    });

    if (!existingIncome) {
      return res.status(404).json({ message: 'Income record not found' });
    }

    // Update paid status
    const updated = await prisma.income.update({
      where: { id: incomeId },
      data: {
        paidStatus,
      },
      include: {
        event: {
          select: {
            id: true,
            title: true,
          }
        },
      },
    });

    return res.json(updated);
  } catch (error) {
    console.error('[PATCH /api/income/:id/paid] Error:', error);

    // Handle Prisma-specific errors
    if (error.code && error.code.startsWith('P')) {
      return res.status(400).json({
        message: 'Database error',
        error: error.message
      });
    }

    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
});

// DELETE /api/income/:id - Delete income record
router.delete('/:id', requireAuth, requirePermission('income.write'), async (req, res) => {
  try {
    const { id } = req.params;
    const incomeId = parseInt(id);

    if (isNaN(incomeId)) {
      return res.status(400).json({ message: 'Invalid income ID' });
    }

    // Get organization context
    const organizationId = req.user.organizationId || req.user.orgId;
    if (!organizationId) {
      return res.status(401).json({ message: 'User organization not found' });
    }

    // Find existing income record
    const existingIncome = await prisma.income.findFirst({
      where: {
        id: incomeId,
        organizationId: organizationId,
      },
    });

    if (!existingIncome) {
      return res.status(404).json({ message: 'Income record not found' });
    }

    // Delete income record
    await prisma.income.delete({
      where: { id: incomeId },
    });

    return res.status(204).send();
  } catch (error) {
    console.error('[DELETE /api/income/:id] Error:', error);

    // Handle Prisma-specific errors
    if (error.code && error.code.startsWith('P')) {
      return res.status(400).json({
        message: 'Database error',
        error: error.message
      });
    }

    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
});
