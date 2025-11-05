import { Router } from 'express';
import { requireAuth, requirePermission } from '../middlewares/auth.js';
import { prisma } from '../lib/prisma.js';

export const router = Router();

// GET /api/expense - List all expense records with pagination and filtering
router.get('/', requireAuth, async (req, res) => {
  try {
    // Extract and validate query parameters
    const q = String(req.query.q || '').trim();
    const limit = Math.min(Math.max(parseInt(String(req.query.limit || '20')) || 20, 1), 100);
    const cursor = req.query.cursor ? parseInt(String(req.query.cursor)) : undefined;
    const eventId = req.query.eventId ? String(req.query.eventId) : undefined;
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
      ...(approveStatus ? { approveStatus } : {}),
      ...(q ? {
        OR: [
          { billNumber: { contains: q, mode: 'insensitive' } },
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
    const list = await prisma.expense.findMany(query);

    // Calculate pagination
    const hasMore = list.length > limit;
    const items = list.slice(0, limit);
    const nextCursor = hasMore ? items[items.length - 1]?.id : null;

    return res.json({ items, nextCursor });
  } catch (error) {
    console.error('[GET /api/expense] Error:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
});

// GET /api/expense/stats - Get expense statistics
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

    // Get total expense (only approved)
    const approvedExpense = await prisma.expense.aggregate({
      where: {
        ...where,
        approveStatus: 'Approved',
      },
      _sum: {
        amount: true,
      },
      _count: true,
    });

    // Get pending expense
    const pendingExpense = await prisma.expense.aggregate({
      where: {
        ...where,
        approveStatus: 'Pending',
      },
      _sum: {
        amount: true,
      },
      _count: true,
    });

    // Get declined expense
    const declinedExpense = await prisma.expense.aggregate({
      where: {
        ...where,
        approveStatus: 'Declined',
      },
      _sum: {
        amount: true,
      },
      _count: true,
    });

    return res.json({
      approvedExpense: {
        total: approvedExpense._sum.amount || 0,
        count: approvedExpense._count,
      },
      pendingExpense: {
        total: pendingExpense._sum.amount || 0,
        count: pendingExpense._count,
      },
      declinedExpense: {
        total: declinedExpense._sum.amount || 0,
        count: declinedExpense._count,
      },
    });
  } catch (error) {
    console.error('[GET /api/expense/stats] Error:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
});

// GET /api/expense/:id - Get single expense record by ID
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const expenseId = parseInt(id);

    if (isNaN(expenseId)) {
      return res.status(400).json({ message: 'Invalid expense ID' });
    }

    const organizationId = req.user.organizationId || req.user.orgId;
    if (!organizationId) {
      return res.status(401).json({ message: 'User organization not found' });
    }

    // Find expense record in user's organization
    const expense = await prisma.expense.findFirst({
      where: {
        id: expenseId,
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

    if (!expense) {
      return res.status(404).json({ message: 'Expense record not found' });
    }

    return res.json(expense);
  } catch (error) {
    console.error('[GET /api/expense/:id] Error:', error);
    return res.status(500).json({
      message: 'Server error',
      error: error.message
    });
  }
});

// POST /api/expense - Create new expense record
router.post('/', requireAuth, requirePermission('expense.write'), async (req, res) => {
  try {
    const {
      billPic,
      billNumber,
      amount,
      description,
      eventId,
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
    const validApproveStatuses = ['Approved', 'Declined', 'Pending'];

    const finalApproveStatus = approveStatus || 'Pending';

    if (!validApproveStatuses.includes(finalApproveStatus)) {
      return res.status(400).json({
        message: `Invalid approveStatus. Must be one of: ${validApproveStatuses.join(', ')}`
      });
    }

    // Create expense record
    const expense = await prisma.expense.create({
      data: {
        billPic: billPic || null,
        billNumber: billNumber || null,
        amount: numAmount,
        description: description || null,
        eventId,
        organizationId,
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

    return res.status(201).json(expense);
  } catch (error) {
    console.error('[POST /api/expense] Error:', error);

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

// PUT /api/expense/:id - Update expense record
router.put('/:id', requireAuth, requirePermission('expense.write'), async (req, res) => {
  try {
    const { id } = req.params;
    const expenseId = parseInt(id);

    if (isNaN(expenseId)) {
      return res.status(400).json({ message: 'Invalid expense ID' });
    }

    const {
      billPic,
      billNumber,
      amount,
      description,
      eventId,
      approveStatus,
      date,
      time,
    } = req.body;

    // Get organization context
    const organizationId = req.user.organizationId || req.user.orgId;
    if (!organizationId) {
      return res.status(401).json({ message: 'User organization not found' });
    }

    // Find existing expense record
    const existingExpense = await prisma.expense.findFirst({
      where: {
        id: expenseId,
        organizationId: organizationId,
      },
    });

    if (!existingExpense) {
      return res.status(404).json({ message: 'Expense record not found' });
    }

    // Validate amount if provided
    let finalAmount = existingExpense.amount;
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
    let finalEventId = existingExpense.eventId;
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
    const validApproveStatuses = ['Approved', 'Declined', 'Pending'];

    const finalApproveStatus = approveStatus !== undefined ? approveStatus : existingExpense.approveStatus;

    if (!validApproveStatuses.includes(finalApproveStatus)) {
      return res.status(400).json({
        message: `Invalid approveStatus. Must be one of: ${validApproveStatuses.join(', ')}`
      });
    }

    // Build update data
    const updateData = {
      billPic: billPic !== undefined ? billPic : existingExpense.billPic,
      billNumber: billNumber !== undefined ? billNumber : existingExpense.billNumber,
      amount: finalAmount,
      description: description !== undefined ? description : existingExpense.description,
      eventId: finalEventId,
      approveStatus: finalApproveStatus,
      date: date !== undefined ? new Date(date) : existingExpense.date,
      time: time !== undefined ? new Date(`1970-01-01T${time}`) : existingExpense.time,
    };

    // Update expense record
    const updated = await prisma.expense.update({
      where: { id: expenseId },
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
    console.error('[PUT /api/expense/:id] Error:', error);

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

// PATCH /api/expense/:id/approve - Approve or decline expense record
router.patch('/:id/approve', requireAuth, requirePermission('expense.write'), async (req, res) => {
  try {
    const { id } = req.params;
    const expenseId = parseInt(id);

    if (isNaN(expenseId)) {
      return res.status(400).json({ message: 'Invalid expense ID' });
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

    // Find existing expense record
    const existingExpense = await prisma.expense.findFirst({
      where: {
        id: expenseId,
        organizationId: organizationId,
      },
    });

    if (!existingExpense) {
      return res.status(404).json({ message: 'Expense record not found' });
    }

    // Update approval status and approver
    const updated = await prisma.expense.update({
      where: { id: expenseId },
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
    console.error('[PATCH /api/expense/:id/approve] Error:', error);

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

// DELETE /api/expense/:id - Delete expense record
router.delete('/:id', requireAuth, requirePermission('expense.write'), async (req, res) => {
  try {
    const { id } = req.params;
    const expenseId = parseInt(id);

    if (isNaN(expenseId)) {
      return res.status(400).json({ message: 'Invalid expense ID' });
    }

    // Get organization context
    const organizationId = req.user.organizationId || req.user.orgId;
    if (!organizationId) {
      return res.status(401).json({ message: 'User organization not found' });
    }

    // Find existing expense record
    const existingExpense = await prisma.expense.findFirst({
      where: {
        id: expenseId,
        organizationId: organizationId,
      },
    });

    if (!existingExpense) {
      return res.status(404).json({ message: 'Expense record not found' });
    }

    // Delete expense record
    await prisma.expense.delete({
      where: { id: expenseId },
    });

    return res.status(204).send();
  } catch (error) {
    console.error('[DELETE /api/expense/:id] Error:', error);

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
