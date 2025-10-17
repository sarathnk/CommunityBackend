import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';

export function requireAuth(req, res, next) {
  try {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Unauthorized' });
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get full user data from database
    prisma.user.findUnique({
      where: { id: payload.sub },
      include: { organization: true }
    }).then(user => {
      if (!user) return res.status(401).json({ message: 'User not found' });
      
      req.user = {
        sub: user.id,
        id: user.id,
        fullName: user.fullName,
        photoUrl: user.photoUrl,
        organizationId: user.organizationId,
        role: payload.role,
        orgId: payload.orgId
      };
      next();
    }).catch(e => {
      console.error('Auth middleware error:', e);
      return res.status(401).json({ message: 'Unauthorized' });
    });
  } catch (e) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
}

export function requirePermission(required) {
  return async (req, res, next) => {
    try {
      const userId = req.user?.sub;
      if (!userId) return res.status(401).json({ message: 'Unauthorized' });
      const user = await prisma.user.findUnique({ where: { id: userId }, include: { role: true } });
      if (!user) return res.status(401).json({ message: 'Unauthorized' });
      const perms = new Set(user.role.permissions || []);
      
      // Debug logging
      console.log(`Permission check for user ${user.email}:`, {
        required,
        permissions: user.role.permissions,
        hasWildcard: perms.has('*'),
        hasRequired: perms.has(required)
      });
      
      if (perms.has('*') || perms.has(required)) return next();
      return res.status(403).json({ message: 'Forbidden' });
    } catch (e) {
      console.error('Permission check error:', e);
      return res.status(403).json({ message: 'Forbidden' });
    }
  };
}


