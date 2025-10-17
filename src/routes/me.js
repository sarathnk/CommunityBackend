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


