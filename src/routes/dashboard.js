import express from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { PrismaClient } from '@prisma/client';

const router = express.Router();
const prisma = new PrismaClient();

// GET /api/dashboard - Get dashboard statistics
router.get('/', async (req, res) => {
  try {
    // For testing, use the Tech Community Hub organization ID
    const userId = 'cmgvnntie000jv7vw9cteyx1n';
    const organizationId = 'cmgvnnsu30007v7vw7gf4oca9';

    console.log('Dashboard API: Fetching dashboard data for user:', userId, 'org:', organizationId);
    
    // First, let's check if the organization exists
    const orgCheck = await prisma.organization.findFirst({
      where: { id: organizationId },
      select: { id: true, name: true }
    });
    console.log('Dashboard API: Organization check result:', orgCheck);
    
    if (!orgCheck) {
      console.log('Dashboard API: Organization not found in database for ID:', organizationId);
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Get organization details
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        themeColor: true,
        place: true,
      },
    });

    if (!organization) {
      console.log('Dashboard API: Organization not found');
      return res.status(404).json({ error: 'Organization not found' });
    }

    // Get member count
    const memberCount = await prisma.user.count({
      where: { organizationId: organizationId },
    });

    // Get events count (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const eventsCount = await prisma.event.count({
      where: {
        organizationId: organizationId,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Get announcements count (last 30 days)
    const announcementsCount = await prisma.announcement.count({
      where: {
        organizationId: organizationId,
        createdAt: {
          gte: thirtyDaysAgo,
        },
      },
    });

    // Get active members count (users who logged in within last 7 days)
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

    const activeMembersCount = await prisma.user.count({
      where: {
        organizationId: organizationId,
        lastLoginAt: {
          gte: sevenDaysAgo,
        },
      },
    });

    // Get recent events for financial overview
    let recentEvents = [];
    try {
      recentEvents = await prisma.event.findMany({
        where: {
          organizationId: organizationId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        take: 4,
        select: {
          id: true,
          title: true,
          createdAt: true,
          // Add financial fields when available
          budget: true,
          actualCost: true,
        },
      });
    } catch (error) {
      console.log('Dashboard API: Events query failed, using mock data:', error.message);
      recentEvents = [];
    }

    // Calculate financial data from real event data
    const financialData = recentEvents.length > 0 ? recentEvents.map((event) => ({
      eventName: event.title,
      income: event.budget || 0, // Use budget as income
      expenses: event.actualCost || 0, // Use actualCost as expenses
    })) : [
      // Fallback mock data if no events exist
      { eventName: 'Town Hall', income: 1800, expenses: 1000 },
      { eventName: 'Cleanup', income: 700, expenses: 300 },
      { eventName: 'Social', income: 2700, expenses: 2000 },
      { eventName: 'Gala', income: 3800, expenses: 3000 },
    ];

    // Get upcoming meetings (mock data for now)
    const upcomingMeetings = [
      {
        id: '1',
        title: 'Board Meeting',
        date: 'Oct 12, 2025',
        time: '10:00 AM',
        type: 'Virtual',
        attendees: 12,
        color: '#3B82F6',
      },
      {
        id: '2',
        title: 'Community Planning Session',
        date: 'Oct 15, 2025',
        time: '2:00 PM',
        type: 'In-Person',
        attendees: 25,
        color: '#10B981',
      },
    ];

    const dashboardData = {
      organization: {
        id: organization.id,
        name: organization.name,
        themeColor: organization.themeColor,
        place: organization.place,
      },
      stats: {
        members: memberCount,
        events: eventsCount,
        announcements: announcementsCount,
        activeMembers: activeMembersCount,
      },
      financialOverview: financialData,
      upcomingMeetings: upcomingMeetings,
      lastUpdated: new Date().toISOString(),
    };

    console.log('Dashboard API: Dashboard data fetched successfully');
    console.log('Dashboard API: Stats:', dashboardData.stats);

    res.json({
      success: true,
      data: dashboardData,
    });
  } catch (error) {
    console.error('Dashboard API: Error fetching dashboard data:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch dashboard data',
    });
  }
});

// Test endpoint for attendees (temporary for development)
router.get('/test-attendees/:eventId', async (req, res) => {
  try {
    const { eventId } = req.params;
    
    // Mock attendees data for testing
    const mockAttendees = [
      {
        id: '1',
        name: 'Sarah Johnson',
        email: 'sarah@community.com',
        phone: '+1 (555) 123-4567',
        status: 'confirmed',
        joinedDate: '2025-10-05T00:00:00.000Z',
      },
      {
        id: '2',
        name: 'Alex Rivera',
        email: 'alex@community.com',
        phone: '+1 (555) 345-6789',
        status: 'pending',
        joinedDate: '2025-10-08T00:00:00.000Z',
      },
      {
        id: '3',
        name: 'Jamie Lee',
        email: 'jamie@community.com',
        phone: '+1 (555) 456-7890',
        status: 'confirmed',
        joinedDate: '2025-10-07T00:00:00.000Z',
      },
      {
        id: '4',
        name: 'Taylor Kim',
        email: 'taylor@community.com',
        phone: '+1 (555) 567-8901',
        status: 'declined',
        joinedDate: '2025-10-09T00:00:00.000Z',
      },
      {
        id: '5',
        name: 'Jordan Smith',
        email: 'jordan@community.com',
        phone: '+1 (555) 678-9012',
        status: 'confirmed',
        joinedDate: '2025-10-06T00:00:00.000Z',
      },
      {
        id: '6',
        name: 'Casey Brown',
        email: 'casey@community.com',
        phone: '+1 (555) 789-0123',
        status: 'pending',
        joinedDate: '2025-10-10T00:00:00.000Z',
      },
    ];

    res.json({
      success: true,
      attendees: mockAttendees,
    });
  } catch (error) {
    console.error('Test attendees API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch test attendees',
    });
  }
});

// Test endpoint for updating attendee status (temporary for development)
router.put('/test-attendees/:eventId/:attendeeId/status', async (req, res) => {
  try {
    const { eventId, attendeeId } = req.params;
    const { status } = req.body;
    
    console.log(`Test API: Updating attendee ${attendeeId} status to ${status} for event ${eventId}`);
    
    // Simulate a successful update
    res.json({
      success: true,
      message: `Attendee ${attendeeId} status updated to ${status}`,
      data: {
        attendeeId,
        eventId,
        status,
        updatedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Test attendee status update API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to update attendee status',
    });
  }
});

// Test endpoint for removing attendee (temporary for development)
router.delete('/test-attendees/:eventId/:attendeeId', async (req, res) => {
  try {
    const { eventId, attendeeId } = req.params;
    
    console.log(`Test API: Removing attendee ${attendeeId} from event ${eventId}`);
    
    // Simulate a successful removal
    res.json({
      success: true,
      message: `Attendee ${attendeeId} removed from event ${eventId}`,
      data: {
        attendeeId,
        eventId,
        removedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Test attendee removal API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to remove attendee',
    });
  }
});

// Debug endpoint to test organization lookup (public for testing)
router.get('/debug-org', async (req, res) => {
  try {
    const organizationId = 'cmgvnnsu30007v7vw7gf4oca9'; // Tech Community Hub ID
    console.log('Debug: Looking up organization ID:', organizationId);
    
    const org = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { id: true, name: true, type: true }
    });
    
    console.log('Debug: Organization found:', org);
    
    res.json({
      success: true,
      organizationId: organizationId,
      organization: org
    });
  } catch (error) {
    console.error('Debug org lookup error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Test endpoint for authentication (temporary for development)
router.post('/test-login', async (req, res) => {
  try {
    console.log('Test API: Test login called');
    
    // Return a mock successful login response
    res.json({
      success: true,
      message: 'Test login successful',
      data: {
        token: 'test-token-12345',
        user: {
          id: 'test-user-123',
          fullName: 'Test User',
          email: 'test@community.com',
          phone: '+1234567890',
          role: 'Admin',
          photoUrl: null,
        },
        organization: {
          id: 'cmgq2aw8o0000v74kdwj2bvm1',
          name: 'Super Admin Organization',
          type: 'System',
          themeColor: '#FF6B35',
          description: 'System-wide super admin organization with full access',
          logoUrl: null,
          place: null,
        },
        permissions: ['read', 'write', 'admin'],
      },
    });
  } catch (error) {
    console.error('Test login API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to login',
    });
  }
});

// Test endpoint for /me (temporary for development)
router.get('/test-me', async (req, res) => {
  try {
    console.log('Test API: Test /me called');
    
    // Return mock user data
    res.json({
      success: true,
      data: {
        id: 'test-user-123',
        fullName: 'Test User',
        email: 'test@community.com',
        phone: '+1234567890',
        role: 'Admin',
        photoUrl: null,
        organization: {
          id: 'cmgq2aw8o0000v74kdwj2bvm1',
          name: 'Super Admin Organization',
          type: 'System',
          themeColor: '#FF6B35',
          description: 'System-wide super admin organization with full access',
          logoUrl: null,
          place: null,
        },
        permissions: ['read', 'write', 'admin'],
      },
    });
  } catch (error) {
    console.error('Test /me API error:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get user data',
    });
  }
});

export default router;
