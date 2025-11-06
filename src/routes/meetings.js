import { Router } from 'express';
import { requireAuth, requirePermission } from '../middlewares/auth.js';
import { prisma } from '../lib/prisma.js';

export const router = Router();

// GET /api/meetings
router.get('/', requireAuth, requirePermission('events.read'), async (req, res) => {
  try {
    const q = String(req.query.q || '').trim();
    const limit = Math.min(Math.max(parseInt(String(req.query.limit || '20')) || 20, 1), 100);

    // Opaque cursor: base64(JSON { id })
    let cursorId;
    if (req.query.cursor) {
      try {
        const decoded = Buffer.from(String(req.query.cursor), 'base64').toString('utf8');
        const parsed = JSON.parse(decoded);
        cursorId = typeof parsed?.id === 'string' ? parsed.id : undefined;
      } catch (_) {
        cursorId = undefined;
      }
    }

    // organizationId is required (back-compat communityId)
    const requestedOrganizationId = (req.query.organizationId || req.query.communityId)
      ? String(req.query.organizationId || req.query.communityId).trim()
      : null;

    // requester & permissions
    const requester = await prisma.user.findUnique({ where: { id: req.user.sub }, include: { role: true } });
    if (!requester) return res.status(401).json({ message: 'Unauthorized' });

    const tokenOrgId = req.user.organizationId || req.user.orgId || null;
    const isSuperAdmin = Array.isArray(requester.role?.permissions) && requester.role.permissions.includes('*');

    const organizationId = requestedOrganizationId || tokenOrgId || null;

    if (requestedOrganizationId && tokenOrgId && !isSuperAdmin && requestedOrganizationId !== tokenOrgId) {
      return res.status(403).json({ message: 'Forbidden (organization out of scope)' });
    }
    if (!organizationId) {
      return res.status(400).json({ message: 'Missing/invalid organizationId' });
    }

    // NOTE: Meetings share the Event storage model
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

    const events = await prisma.event.findMany({
      where,
      orderBy: [
        { startDate: 'desc' },
        { id: 'desc' },
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
        attendeesCount: true,
        createdAt: true,
      },
    });

    const hasMore = events.length > limit;
    const items = events.slice(0, limit);
    const nextCursor = hasMore && items.length
      ? Buffer.from(JSON.stringify({ id: items[items.length - 1].id }), 'utf8').toString('base64')
      : null;

    return res.json({ items, nextCursor });
  } catch (err) {
    console.error('[GET /api/meetings] Error:', err);
    return res.status(500).json({ message: 'Server error' });
  }
});


