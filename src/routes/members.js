import { Router } from 'express';
import { requireAuth, requirePermission } from '../middlewares/auth.js';
import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcryptjs';

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

  // Super admin can see all members, others only see their organization
  const where = {
    ...(user.role.permissions.includes('*') 
      ? {} // Super admin sees all organizations
      : { organizationId: req.user.orgId } // Regular users see only their org
    ),
    ...(q
      ? {
          OR: [
            { fullName: { contains: q, mode: 'insensitive' } },
            { phoneNumber: { contains: q, mode: 'insensitive' } },
          ],
        }
      : {}),
  };

  const query = {
    where,
    select: { 
      id: true, 
      fullName: true, 
      phoneNumber: true, 
      photoUrl: true,
      role: { select: { name: true } },
      ...(user.role.permissions.includes('*') 
        ? { organization: { select: { name: true, type: true } } } // Include org info for super admin
        : {}
      )
    },
    orderBy: { createdAt: 'desc' },
    take: limit + 1,
    ...(cursor ? { cursor: { id: cursor }, skip: 1 } : {}),
  };

  // Get total count for pagination info
  const totalCount = await prisma.user.count({ where });
  
  const users = await prisma.user.findMany(query);
  const hasMore = users.length > limit;
  const items = users.slice(0, limit).map(u => ({ 
    id: u.id, 
    fullName: u.fullName, 
    phoneNumber: u.phoneNumber, 
    photoUrl: u.photoUrl,
    role: u.role.name,
    ...(user.role.permissions.includes('*') && u.organization
      ? { organization: u.organization }
      : {}
    )
  }));
  const nextCursor = hasMore ? items[items.length - 1]?.id : null;
  return res.json({ items, nextCursor, totalCount });
});

router.post('/', requireAuth, requirePermission('members.write'), async (req, res) => {
  const { fullName, phoneNumber, password, roleId, photoUrl } = req.body;
  if (!fullName || !phoneNumber || !roleId) return res.status(400).json({ message: 'Invalid payload' });
  // Ensure role belongs to requester's organization
  const role = await prisma.role.findFirst({ where: { id: roleId, organizationId: req.user.orgId } });
  if (!role) return res.status(400).json({ message: 'Invalid role' });
  
  // Generate a default password if none provided
  const defaultPassword = password || 'Welcome123!';
  const passwordHash = await bcrypt.hash(defaultPassword, 10);
  
  const user = await prisma.user.create({ 
    data: { 
      fullName, 
      phoneNumber, 
      passwordHash, 
      photoUrl: photoUrl || null,
      organizationId: req.user.orgId, 
      roleId 
    } 
  });
  return res.status(201).json({ id: user.id });
});

router.put('/:id', requireAuth, requirePermission('members.write'), async (req, res) => {
  const { id } = req.params;
  const { fullName, roleId, photoUrl } = req.body;
  console.log('[PUT /api/members/:id] id=', id, 'payload=', { fullName, roleId, photoUrl });
  // Determine if requester is super admin
  const requester = await prisma.user.findUnique({ where: { id: req.user.sub }, include: { role: true } });
  const isSuper = requester?.role?.permissions?.includes('*');
  const user = await prisma.user.findFirst({ where: isSuper ? { id } : { id, organizationId: req.user.orgId } });
  if (!user) return res.status(404).json({ message: 'Not found' });
  if (roleId) {
    const role = await prisma.role.findFirst({ where: isSuper ? { id: roleId } : { id: roleId, organizationId: req.user.orgId } });
    if (!role) return res.status(400).json({ message: 'Invalid role' });
  }
  const updated = await prisma.user.update({ 
    where: { id }, 
    data: { 
      fullName: fullName ?? user.fullName, 
      roleId: roleId ?? user.roleId,
      photoUrl: photoUrl !== undefined ? photoUrl : user.photoUrl
    } 
  });
  console.log('[PUT /api/members/:id] updated=', updated.id);
  return res.json({ id: updated.id });
});

router.delete('/:id', requireAuth, requirePermission('members.write'), async (req, res) => {
  const { id } = req.params;
  const requester = await prisma.user.findUnique({ where: { id: req.user.sub }, include: { role: true } });
  const isSuper = requester?.role?.permissions?.includes('*');
  const user = await prisma.user.findFirst({ where: isSuper ? { id } : { id, organizationId: req.user.orgId } });
  if (!user) return res.status(404).json({ message: 'Not found' });
  await prisma.user.delete({ where: { id } });
  return res.status(204).send();
});


