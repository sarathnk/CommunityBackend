import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middlewares/auth.js';

export const router = Router();

router.post('/register', async (req, res) => {
  try {
    console.log('=== Registration Request ===');
    console.log('Full body:', JSON.stringify(req.body, null, 2));
    
    const { name, type, description, logoUrl, themeColor, place, admin, roles } = req.body;
    
    console.log('Extracted fields:');
    console.log('- name:', name);
    console.log('- type:', type);
    console.log('- description:', description);
    console.log('- logoUrl:', logoUrl);
    console.log('- themeColor:', themeColor);
    console.log('- place:', place);
    console.log('- admin:', admin);
    console.log('- roles:', roles);
    
    if (!name || !type || !admin?.phone || !admin?.otp || !admin?.fullName) {
      console.log('Validation failed:');
      console.log('- name exists:', !!name);
      console.log('- type exists:', !!type);
      console.log('- admin exists:', !!admin);
      console.log('- admin.phone exists:', !!admin?.phone);
      console.log('- admin.otp exists:', !!admin?.otp);
      console.log('- admin.fullName exists:', !!admin?.fullName);
      return res.status(400).json({ message: 'Invalid payload' });
    }

    // Ensure phone number has +91 prefix
    const phoneNumber = admin.phone.startsWith('+91') ? admin.phone : `+91${admin.phone}`;
    console.log('Checking for existing user with phone:', phoneNumber);
    
    // Check if user already exists with this phone number
    const existingUser = await prisma.user.findUnique({ 
      where: { phoneNumber: phoneNumber },
      include: { organization: true }
    });
    
    if (existingUser) {
      console.log('User already exists with phone:', phoneNumber);
      return res.status(400).json({ 
        message: 'User with this phone number already exists',
        existingOrg: existingUser.organization.name
      });
    }

    const result = await prisma.$transaction(async (tx) => {
      const org = await tx.organization.create({ data: { name, type, description, logoUrl, themeColor, place } });

      let adminRole;
      if (Array.isArray(roles) && roles.length > 0) {
        // Create roles provided by client; ensure at least one admin-like role exists
        for (const r of roles) {
          const created = await tx.role.create({
            data: {
              name: r.name || 'Role',
              description: r.description || '',
              permissions: Array.isArray(r.permissions) ? r.permissions : [],
              isDefault: !!r.isDefault,
              organizationId: org.id,
            },
          });
          if (!adminRole && (created.permissions.includes('*') || created.name.toLowerCase() === 'admin')) {
            adminRole = created;
          }
        }
        if (!adminRole) {
          adminRole = await tx.role.create({ data: { name: 'Admin', description: 'Full access', permissions: ['*'], isDefault: true, organizationId: org.id } });
        }
      } else {
        // Seed defaults
        [adminRole] = await Promise.all([
          tx.role.create({ data: { name: 'Admin', description: 'Full access', permissions: ['*'], isDefault: true, organizationId: org.id } }),
          tx.role.create({ data: { name: 'Member', description: 'Standard access', permissions: ['read'], isDefault: true, organizationId: org.id } }),
          tx.role.create({ data: { name: 'Volunteer', description: 'Event helpers', permissions: ['events.read'], isDefault: true, organizationId: org.id } }),
        ]);
      }

      // For OTP-based registration, store OTP as password
      // In a real app, you'd verify the OTP first, then create the user
      const passwordHash = await bcrypt.hash(admin.otp, 10);
      console.log('Creating user with phone:', phoneNumber);
      
      const user = await tx.user.create({
        data: {
          fullName: admin.fullName,
          passwordHash,
          phoneNumber: phoneNumber,
          photoUrl: admin.photoUrl,
          organizationId: org.id,
          roleId: adminRole.id,
        },
      });

      return { org, user };
    });

    const token = jwt.sign({ sub: result.user.id, orgId: result.org.id }, process.env.JWT_SECRET, { expiresIn: '1d' });

    return res.status(201).json({
      organization: { id: result.org.id, name: result.org.name, type: result.org.type, themeColor: result.org.themeColor, logoUrl: result.org.logoUrl, place: result.org.place },
      user: { id: result.user.id, email: result.user.email, fullName: result.user.fullName },
      token,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.get('/', requireAuth, async (req, res) => {
  try {
    // Get user's role to check if they're super admin
    const user = await prisma.user.findUnique({ 
      where: { id: req.user.sub }, 
      include: { role: true } 
    });
    
    if (!user) return res.status(401).json({ message: 'User not found' });

    // Super admin can see all organizations, others only see their organization
    const where = user.role.permissions.includes('*') 
      ? {} // Super admin sees all organizations
      : { id: user.organizationId }; // Regular users see only their org

    const organizations = await prisma.organization.findMany({
      where,
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        logoUrl: true,
        themeColor: true,
        place: true,
        createdAt: true,
        _count: {
          select: {
            users: true,
            events: true,
            announcements: true,
          }
        }
      },
      orderBy: { createdAt: 'desc' }
    });

    return res.json({ organizations });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.put('/update', requireAuth, async (req, res) => {
  try {
    const { name, type, description, logoUrl, themeColor, place } = req.body;
    const userId = req.user.sub;
    
    // Get user's organization
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { organization: true }
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Update organization
    const updatedOrg = await prisma.organization.update({
      where: { id: user.organizationId },
      data: {
        name: name || user.organization.name,
        type: type || user.organization.type,
        description: description !== undefined ? description : user.organization.description,
        logoUrl: logoUrl !== undefined ? logoUrl : user.organization.logoUrl,
        themeColor: themeColor !== undefined ? themeColor : user.organization.themeColor,
        place: place !== undefined ? place : user.organization.place,
      }
    });

    return res.status(200).json({
      organization: {
        id: updatedOrg.id,
        name: updatedOrg.name,
        type: updatedOrg.type,
        description: updatedOrg.description,
        logoUrl: updatedOrg.logoUrl,
        themeColor: updatedOrg.themeColor,
        place: updatedOrg.place,
      }
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.post('/switch', requireAuth, async (req, res) => {
  try {
    const { organizationId } = req.body;
    const userId = req.user.sub;
    
    // Get user's role to check if they're super admin
    const user = await prisma.user.findUnique({ 
      where: { id: userId }, 
      include: { role: true } 
    });
    
    if (!user) return res.status(401).json({ message: 'User not found' });

    // Only super admin can switch organizations
    if (!user.role.permissions.includes('*')) {
      return res.status(403).json({ message: 'Only super admin can switch organizations' });
    }

    // Verify the organization exists
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: {
        id: true,
        name: true,
        type: true,
        description: true,
        logoUrl: true,
        themeColor: true,
        place: true,
        _count: {
          select: {
            users: true,
            events: true,
            announcements: true,
          }
        }
      }
    });

    if (!organization) {
      return res.status(404).json({ message: 'Organization not found' });
    }

    // Generate new token with the switched organization context
    const token = jwt.sign({ 
      sub: userId, 
      orgId: organizationId 
    }, process.env.JWT_SECRET, { expiresIn: '1d' });

    return res.json({
      organization,
      token
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
});
