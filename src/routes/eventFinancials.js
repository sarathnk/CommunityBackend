import express from 'express';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middlewares/auth.js';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/event-financials - Get all events with financial data
router.get('/', requireAuth, async (req, res) => {
  try {
    console.log('Event Financials API: Fetching events with financial data');

    // Use authenticated user's organization
    const organizationId = req.user.organizationId || req.user.orgId;
    if (!organizationId) {
      return res.status(401).json({ message: 'User organization not found' });
    }

    // Get all events (we'll calculate financials from income/expense records)
    const events = await prisma.event.findMany({
      where: {
        organizationId: organizationId,
      },
      select: {
        id: true,
        title: true,
        startDate: true,
        budget: true,
        actualCost: true,
        attendeesCount: true,
        description: true,
        location: true,
      },
      orderBy: {
        startDate: 'desc',
      },
    });

    console.log(`Event Financials API: Found ${events.length} events with financial data`);

    // Transform events to include calculated financial data from approved records
    const eventsWithFinancials = await Promise.all(events.map(async (event) => {
      // Get approved income for this event
      const approvedIncomes = await prisma.income.aggregate({
        where: {
          eventId: event.id,
          approveStatus: 'Approved',
        },
        _sum: {
          amount: true,
        },
        _count: true,
      });

      // Get approved expenses for this event
      const approvedExpenses = await prisma.expense.aggregate({
        where: {
          eventId: event.id,
          approveStatus: 'Approved',
        },
        _sum: {
          amount: true,
        },
        _count: true,
      });

      const income = approvedIncomes._sum.amount || 0;
      const expenses = approvedExpenses._sum.amount || 0;

      // Get income breakdown by category (if you have categories)
      // For now, using aggregated data
      const incomeBreakdown = [
        {
          category: 'Total Approved Income',
          amount: Math.round(income),
          percentage: 100.0,
        },
      ];

      const expenseBreakdown = [
        {
          category: 'Total Approved Expenses',
          amount: Math.round(expenses),
          percentage: 100.0,
        },
      ];

      return {
        id: event.id,
        name: event.title,
        date: new Date(event.startDate).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        }),
        income: income,
        expenses: expenses,
        incomeBreakdown: incomeBreakdown,
        expenseBreakdown: expenseBreakdown,
        attendeesCount: event.attendeesCount,
        description: event.description,
        location: event.location,
      };
    }));

    res.json({
      success: true,
      data: eventsWithFinancials,
    });

  } catch (error) {
    console.error('Event Financials API: Error fetching events:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch event financial data',
    });
  }
});

// GET /api/event-financials/:eventId - Get financial data for a specific event
router.get('/:eventId', requireAuth, async (req, res) => {
  try {
    const { eventId } = req.params;
    console.log('Event Financials API: Fetching financial data for event:', eventId);

    // Use authenticated user's organization
    const organizationId = req.user.organizationId || req.user.orgId;
    if (!organizationId) {
      return res.status(401).json({ message: 'User organization not found' });
    }

    const event = await prisma.event.findFirst({
      where: {
        id: eventId,
        organizationId: organizationId,
      },
      select: {
        id: true,
        title: true,
        startDate: true,
        budget: true,
        actualCost: true,
        attendeesCount: true,
        description: true,
        location: true,
      },
    });

    if (!event) {
      return res.status(404).json({
        success: false,
        error: 'Event not found or no financial data available',
      });
    }

    // Get approved income for this event
    const approvedIncomes = await prisma.income.aggregate({
      where: {
        eventId: event.id,
        approveStatus: 'Approved',
      },
      _sum: {
        amount: true,
      },
      _count: true,
    });

    // Get approved expenses for this event
    const approvedExpenses = await prisma.expense.aggregate({
      where: {
        eventId: event.id,
        approveStatus: 'Approved',
      },
      _sum: {
        amount: true,
      },
      _count: true,
    });

    const income = approvedIncomes._sum.amount || 0;
    const expenses = approvedExpenses._sum.amount || 0;

    // Get income breakdown by category
    const incomeBreakdown = [
      {
        category: 'Total Approved Income',
        amount: Math.round(income),
        percentage: 100.0,
      },
    ];

    const expenseBreakdown = [
      {
        category: 'Total Approved Expenses',
        amount: Math.round(expenses),
        percentage: 100.0,
      },
    ];

    const eventFinancials = {
      id: event.id,
      name: event.title,
      date: new Date(event.startDate).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
      income: income,
      expenses: expenses,
      incomeBreakdown: incomeBreakdown,
      expenseBreakdown: expenseBreakdown,
      attendeesCount: event.attendeesCount,
      description: event.description,
      location: event.location,
    };

    res.json({
      success: true,
      data: eventFinancials,
    });

  } catch (error) {
    console.error('Event Financials API: Error fetching event financial data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch event financial data',
    });
  }
});

export default router;
