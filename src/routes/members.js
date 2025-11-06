import { Router } from 'express';
import { requireAuth, requirePermission } from '../middlewares/auth.js';
import { prisma } from '../lib/prisma.js';
import bcrypt from 'bcryptjs';

export const router = Router();

router.get('/', requireAuth, requirePermission('members.read'), async (req, res) => {
  const q = String(req.query.q || '').trim();
  const limit = Math.min(Math.max(parseInt(String(req.query.limit || '20')) || 20, 1), 100);
  const cursor = req.query.cursor ? String(req.query.cursor) : undefined;
  const requestedCommunityId = req.query.communityId ? String(req.query.communityId).trim() : null;

  // Get requester with role to evaluate permissions/scope
  const requester = await prisma.user.findUnique({ 
    where: { id: req.user.sub }, 
    include: { role: true } 
  });
  if (!requester) return res.status(401).json({ message: 'User not found' });

  const tokenOrgId = req.user.organizationId || req.user.orgId || null;
  const isSuperAdmin = requester.role.permissions?.includes('*');

  // Resolve effective community (organization) ID
  let communityId = requestedCommunityId || tokenOrgId || null;

  // If token is org-scoped, verify requested community matches
  if (requestedCommunityId && tokenOrgId && !isSuperAdmin && requestedCommunityId !== tokenOrgId) {
    return res.status(403).json({ message: 'Forbidden: communityId does not match your scope' });
  }

  // Enforce single-community scoping. If super admin has no default org and no communityId provided, require it.
  if (!communityId) {
    return res.status(400).json({ message: 'communityId is required' });
  }

  // Build where clause: always scoped to the resolved community
  const where = {
    organizationId: communityId,
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
  }));
  const nextCursor = hasMore ? items[items.length - 1]?.id : null;
  return res.json({ items, nextCursor, totalCount });
});

router.post('/', requireAuth, requirePermission('members.write'), async (req, res) => {
  try {
    const { fullName, phoneNumber, password, roleId, photoUrl } = req.body;
    
    // Validate required fields
    if (!fullName || !phoneNumber || !roleId) {
      return res.status(400).json({ message: 'Invalid payload: fullName, phoneNumber, and roleId are required' });
    }

    const organizationId = req.user.organizationId || req.user.orgId;
    if (!organizationId) {
      return res.status(401).json({ message: 'User organization not found' });
    }

    // Normalize phone number (ensure it has +91 prefix if Indian number)
    let normalizedPhone = phoneNumber.trim();
    if (normalizedPhone.startsWith('91') && !normalizedPhone.startsWith('+91')) {
      normalizedPhone = '+' + normalizedPhone;
    } else if (!normalizedPhone.startsWith('+')) {
      normalizedPhone = '+91' + normalizedPhone;
    }

    // Check if phone number already exists
    const existingUser = await prisma.user.findUnique({
      where: { phoneNumber: normalizedPhone }
    });

    if (existingUser) {
      return res.status(400).json({ 
        message: 'User with this phone number already exists',
        phoneNumber: normalizedPhone
      });
    }

    // Ensure role belongs to requester's organization
    const role = await prisma.role.findFirst({ 
      where: { id: roleId, organizationId: organizationId } 
    });
    
    if (!role) {
      return res.status(400).json({ 
        message: 'Invalid role: role does not belong to your organization',
        roleId: roleId,
        organizationId: organizationId
      });
    }
    
    // Generate a default password if none provided
    const defaultPassword = password || 'Welcome123!';
    const passwordHash = await bcrypt.hash(defaultPassword, 10);
    
    // Create the user
    const user = await prisma.user.create({ 
      data: { 
        fullName: fullName.trim(), 
        phoneNumber: normalizedPhone, 
        passwordHash, 
        photoUrl: photoUrl || null,
        organizationId: organizationId, 
        roleId 
      } 
    });

    return res.status(201).json({ 
      id: user.id,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber
    });
  } catch (error) {
    console.error('[POST /api/members] Error:', error);
    
    // Handle Prisma unique constraint violations
    if (error.code === 'P2002') {
      return res.status(400).json({ 
        message: 'User with this phone number already exists',
        error: error.meta?.target 
      });
    }
    
    // Handle other Prisma errors
    if (error.code && error.code.startsWith('P')) {
      return res.status(400).json({ 
        message: 'Database error occurred',
        error: error.message 
      });
    }
    
    // Generic error
    return res.status(500).json({ 
      message: 'Server error occurred while creating member',
      error: error.message 
    });
  }
});

router.put('/:id', requireAuth, requirePermission('members.write'), async (req, res) => {
  const { id } = req.params;
  const { fullName, roleId, photoUrl } = req.body;
  console.log('[PUT /api/members/:id] id=', id, 'payload=', { fullName, roleId, photoUrl });
  // Determine if requester is super admin
  const organizationId = req.user.organizationId || req.user.orgId;
  const requester = await prisma.user.findUnique({ where: { id: req.user.sub }, include: { role: true } });
  const isSuper = requester?.role?.permissions?.includes('*');
  const user = await prisma.user.findFirst({ where: isSuper ? { id } : { id, organizationId: organizationId } });
  if (!user) return res.status(404).json({ message: 'Not found' });
  if (roleId) {
    const role = await prisma.role.findFirst({ where: isSuper ? { id: roleId } : { id: roleId, organizationId: organizationId } });
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
  const organizationId = req.user.organizationId || req.user.orgId;
  const requester = await prisma.user.findUnique({ where: { id: req.user.sub }, include: { role: true } });
  const isSuper = requester?.role?.permissions?.includes('*');
  const user = await prisma.user.findFirst({ where: isSuper ? { id } : { id, organizationId: organizationId } });
  if (!user) return res.status(404).json({ message: 'Not found' });
  await prisma.user.delete({ where: { id } });
  return res.status(204).send();
});


