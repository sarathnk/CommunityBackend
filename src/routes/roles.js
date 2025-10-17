import { Router } from 'express';
import { requireAuth, requirePermission } from '../middlewares/auth.js';
import { prisma } from '../lib/prisma.js';

export const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const q = String(req.query.q || '').trim();
  const limit = Math.min(Math.max(parseInt(String(req.query.limit || '20')) || 20, 1), 100);
  const cursor = req.query.cursor ? String(req.query.cursor) : undefined;

  // Get user's role to check if they're super admin
  const user = await prisma.user.findUnique({ 
    where: { id: req.user.sub }, 
    include: { role: true } 
  });
  
  if (!user) return res.status(401).json({ message: 'User not found' });

  // Super admin can see all roles, others only see their organization
  const where = {
    ...(user.role.permissions.includes('*') 
      ? {} // Super admin sees all organizations
      : { organizationId: req.user.orgId } // Regular users see only their org
    ),
    ...(q ? { OR: [{ name: { contains: q, mode: 'insensitive' } }, { description: { contains: q, mode: 'insensitive' } }] } : {}),
  };

  const query = {
    where,
    select: {
      id: true,
      name: true,
      description: true,
      permissions: true,
      isDefault: true,
      color: true,
      createdAt: true,
      ...(user.role.permissions.includes('*') 
        ? { organization: { select: { name: true, type: true } } } // Include org info for super admin
        : {}
      )
    },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  };

  const roles = await prisma.role.findMany(query);
  const hasMore = roles.length > limit;
  const items = roles.slice(0, limit);
  const nextCursor = hasMore ? items[items.length - 1]?.id : null;
  return res.json({ items, nextCursor });
});

router.post('/', requireAuth, requirePermission('roles.write'), async (req, res) => {
  const { name, description, permissions, color } = req.body;
  if (!name) return res.status(400).json({ message: 'Name required' });
  const role = await prisma.role.create({ data: { name, description: description || '', permissions: permissions || [], color: color || null, organizationId: req.user.orgId } });
  return res.status(201).json(role);
});

router.put('/:id', requireAuth, requirePermission('roles.write'), async (req, res) => {
  const { id } = req.params;
  const { name, description, permissions, color } = req.body;
  const role = await prisma.role.findFirst({ where: { id, organizationId: req.user.orgId } });
  if (!role) return res.status(404).json({ message: 'Not found' });
  const updated = await prisma.role.update({ where: { id }, data: { name: name ?? role.name, description: description ?? role.description, permissions: permissions ?? role.permissions, color: color ?? role.color } });
  return res.json(updated);
});

router.delete('/:id', requireAuth, requirePermission('roles.write'), async (req, res) => {
  const { id } = req.params;
  const role = await prisma.role.findFirst({ where: { id, organizationId: req.user.orgId } });
  if (!role) return res.status(404).json({ message: 'Not found' });
  await prisma.user.updateMany({ where: { roleId: id }, data: { roleId: undefined } });
  await prisma.role.delete({ where: { id } });
  return res.status(204).send();
});


