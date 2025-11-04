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

    // Get events with financial data
    const events = await prisma.event.findMany({
      where: {
        organizationId: organizationId,
        budget: { not: null },
        actualCost: { not: null },
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

    // Transform events to include calculated financial data
    const eventsWithFinancials = events.map(event => {
      const income = event.budget || 0;
      const expenses = event.actualCost || 0;
      const net = income - expenses;
      const profitMargin = income > 0 ? ((net / income) * 100) : 0;

      // Generate sample breakdown data (in a real app, this would come from separate tables)
      const incomeBreakdown = [
        {
          category: 'Member Contributions',
          amount: Math.round(income * 0.7),
          percentage: 70.0,
        },
        {
          category: 'Sponsor Donations',
          amount: Math.round(income * 0.3),
          percentage: 30.0,
        },
      ];

      const expenseBreakdown = [
        {
          category: 'Venue',
          amount: Math.round(expenses * 0.4),
          percentage: 40.0,
        },
        {
          category: 'Catering',
          amount: Math.round(expenses * 0.3),
          percentage: 30.0,
        },
        {
          category: 'Equipment',
          amount: Math.round(expenses * 0.2),
          percentage: 20.0,
        },
        {
          category: 'Marketing',
          amount: Math.round(expenses * 0.1),
          percentage: 10.0,
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
        net: net,
        profitMargin: Math.round(profitMargin * 10) / 10, // Round to 1 decimal place
        incomeBreakdown: incomeBreakdown,
        expenseBreakdown: expenseBreakdown,
        attendeesCount: event.attendeesCount,
        description: event.description,
        location: event.location,
      };
    });

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
        budget: { not: null },
        actualCost: { not: null },
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

    const income = event.budget || 0;
    const expenses = event.actualCost || 0;
    const net = income - expenses;
    const profitMargin = income > 0 ? ((net / income) * 100) : 0;

    // Generate sample breakdown data
    const incomeBreakdown = [
      {
        category: 'Member Contributions',
        amount: Math.round(income * 0.7),
        percentage: 70.0,
      },
      {
        category: 'Sponsor Donations',
        amount: Math.round(income * 0.3),
        percentage: 30.0,
      },
    ];

    const expenseBreakdown = [
      {
        category: 'Venue',
        amount: Math.round(expenses * 0.4),
        percentage: 40.0,
      },
      {
        category: 'Catering',
        amount: Math.round(expenses * 0.3),
        percentage: 30.0,
      },
      {
        category: 'Equipment',
        amount: Math.round(expenses * 0.2),
        percentage: 20.0,
      },
      {
        category: 'Marketing',
        amount: Math.round(expenses * 0.1),
        percentage: 10.0,
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
      net: net,
      profitMargin: Math.round(profitMargin * 10) / 10,
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
