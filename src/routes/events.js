import { Router } from 'express';
import { requireAuth, requirePermission } from '../middlewares/auth.js';
import { prisma } from '../lib/prisma.js';

export const router = Router();

router.get('/', requireAuth, requirePermission('events.read'), async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const limit = Math.min(Math.max(parseInt(String(req.query.limit || '20')) || 20, 1), 100);

    // Accept opaque cursor (base64 JSON { id })
    let cursorId;
    if (req.query.cursor) {
      try {
        const decoded = Buffer.from(String(req.query.cursor), 'base64').toString('utf8');
        const parsed = JSON.parse(decoded);
        cursorId = typeof parsed?.id === 'string' ? parsed.id : undefined;
      } catch (_) {
        // Ignore invalid cursor; treat as no cursor
        cursorId = undefined;
      }
    }

    // Accept organizationId (required). Keep backward compatibility with communityId if provided.
    const requestedOrganizationId = (req.query.organizationId || req.query.communityId)
      ? String(req.query.organizationId || req.query.communityId).trim()
      : null;

    // Load requester and role to determine super admin
    const requester = await prisma.user.findUnique({ where: { id: req.user.sub }, include: { role: true } });
    if (!requester) return res.status(401).json({ message: 'User not found' });

    const tokenOrgId = req.user.organizationId || req.user.orgId || null;
    const isSuperAdmin = Array.isArray(requester.role?.permissions) && requester.role.permissions.includes('*');

    let organizationId = requestedOrganizationId || tokenOrgId || null;

    // Validate organization scoping
    if (requestedOrganizationId && tokenOrgId && !isSuperAdmin && requestedOrganizationId !== tokenOrgId) {
      return res.status(403).json({ message: 'User not permitted to access organizationId' });
    }

    if (!organizationId) {
      return res.status(400).json({ message: 'Missing or invalid organizationId' });
    }

    // Build where clause with search across title/description/location
    const where = {
      organizationId,
      ...(q
        ? {
            OR: [
              { title: { contains: q, mode: 'insensitive' } },
              { description: { contains: q, mode: 'insensitive' } },
              { location: { contains: q, mode: 'insensitive' } },
            ],
          }
        : {}),
    };

    const query = {
      where,
      orderBy: [
        { startDate: 'desc' },
        { id: 'desc' }, // stable tiebreaker
      ],
      take: limit + 1,
      ...(cursorId ? { cursor: { id: cursorId }, skip: 1 } : {}),
      select: {
        id: true,
        title: true,
        description: true,
        location: true,
        startDate: true,
        endDate: true,
        imageUrl: true,
        attendeesCount: true,
        organizerId: true,
        organizerName: true,
        createdAt: true,
      },
    };

    const events = await prisma.event.findMany(query);
    const hasMore = events.length > limit;
    const sliced = events.slice(0, limit);

    // Calculate income and expenses for each event from approved records
    const items = await Promise.all(sliced.map(async (e) => {
      // Get approved income for this event
      const approvedIncomes = await prisma.income.aggregate({
        where: {
          eventId: e.id,
          approveStatus: 'Approved',
        },
        _sum: {
          amount: true,
        },
      });

      // Get approved expenses for this event
      const approvedExpenses = await prisma.expense.aggregate({
        where: {
          eventId: e.id,
          approveStatus: 'Approved',
        },
        _sum: {
          amount: true,
        },
      });

      return {
        id: e.id,
        title: e.title,
        description: e.description,
        location: e.location,
        startDate: e.startDate,
        endDate: e.endDate,
        imageUrl: e.imageUrl,
        attendeesCount: e.attendeesCount,
        organizerId: e.organizerId,
        organizerName: e.organizerName,
        createdAt: e.createdAt,
        income: approvedIncomes._sum.amount || 0,
        expenses: approvedExpenses._sum.amount || 0,
      };
    }));

    const nextCursor = hasMore && sliced.length
      ? Buffer.from(JSON.stringify({ id: sliced[sliced.length - 1].id }), 'utf8').toString('base64')
      : null;

    return res.json({ items, nextCursor });
  } catch (err) {
    console.error('[GET /api/events] Error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.post('/', requireAuth, requirePermission('events.write'), async (req, res) => {
  const { title, description, location, startDate, endDate, imageUrl } = req.body;
  if (!title || !description || !location || !startDate || !endDate) {
    return res.status(400).json({ message: 'Invalid payload' });
  }
  const evt = await prisma.event.create({
    data: {
      title,
      description,
      location,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      imageUrl,
      organizerId: req.user.sub,
      organizerName: 'Admin',
      organizationId: req.user.organizationId || req.user.orgId,
    },
  });
  return res.status(201).json(evt);
});


