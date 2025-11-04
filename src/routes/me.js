import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { prisma } from '../lib/prisma.js';

export const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.user.sub }, include: { role: true, organization: true } });
  if (!user) return res.status(404).json({ message: 'Not found' });
  return res.json({
    id: user.id,
    email: user.email,
    fullName: user.fullName,
    role: user.role.name,
    permissions: user.role.permissions || [],
    organization: { id: user.organization.id, name: user.organization.name, place: user.organization.place },
  });
});


// GET /api/me/organizations - List organizations for current user (user-scoped)
router.get('/organizations', requireAuth, async (req, res) => {
  try {
    const page = Math.max(parseInt(String(req.query.page || '1')) || 1, 1);
    const limit = Math.min(Math.max(parseInt(String(req.query.limit || '20')) || 20, 1), 100);

    // In current schema, a user belongs to a single organization via user.organizationId
    const orgId = req.user.orgId || req.user.organizationId;

    if (!orgId) {
      return res.json({ organizations: [], total: 0, page, limit });
    }

    const organization = await prisma.organization.findUnique({
      where: { id: orgId },
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        logoUrl: true,
        themeColor: true,
        place: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    const organizations = organization ? [organization] : [];
    const total = organizations.length;

    // Apply pagination window even though there is at most 1 item
    const start = (page - 1) * limit;
    const end = start + limit;
    const paged = organizations.slice(start, end);

    return res.json({ organizations: paged, total, page, limit });
  } catch (e) {
    console.error('Error listing my organizations:', e);
    return res.status(500).json({ message: 'Server error' });
  }
});


