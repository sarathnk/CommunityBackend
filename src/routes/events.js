import { Router } from 'express';
import { requireAuth, requirePermission } from '../middlewares/auth.js';
import { prisma } from '../lib/prisma.js';

export const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const q = String(req.query.q || '').trim();
  const limit = Math.min(Math.max(parseInt(String(req.query.limit || '20')) || 20, 1), 100);
  const cursor = req.query.cursor ? String(req.query.cursor) : undefined;

  const organizationId = req.user.organizationId || req.user.orgId;
  if (!organizationId) {
    return res.status(401).json({ message: 'User organization not found' });
  }

  const where = {
    organizationId: organizationId,
    ...(q ? { OR: [{ title: { contains: q, mode: 'insensitive' } }, { location: { contains: q, mode: 'insensitive' } }] } : {}),
  };

  const query = {
    where,
    orderBy: { startDate: 'asc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  };

  const events = await prisma.event.findMany(query);
  const hasMore = events.length > limit;
  const items = events.slice(0, limit);
  const nextCursor = hasMore ? items[items.length - 1]?.id : null;
  return res.json({ items, nextCursor });
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


