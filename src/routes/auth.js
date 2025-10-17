import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../lib/prisma.js';

export const router = Router();

// Check if phone number is available
router.get('/check-phone', async (req, res) => {
  try {
    const { phone } = req.query;
    if (!phone) return res.status(400).json({ message: 'Phone is required' });
    
    const user = await prisma.user.findUnique({ where: { phoneNumber: phone } });
    const available = !user;
    
    return res.json({ available });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Simple in-memory OTP store
const otpStore = new Map();

router.post('/login', async (req, res) => {
  try {
    const { phone, password } = req.body;
    if (!phone || !password) return res.status(400).json({ message: 'Missing credentials' });
    const user = await prisma.user.findUnique({ where: { phoneNumber: phone }, include: { role: true } });
    if (!user) return res.status(401).json({ message: 'Invalid credentials' });
    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid credentials' });
    const token = jwt.sign({ sub: user.id, orgId: user.organizationId, role: user.role.name }, process.env.JWT_SECRET, { expiresIn: '1d' });
    return res.json({ token });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.post('/otp/request', async (req, res) => {
  try {
    console.log('=== OTP REQUEST ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { phone } = req.body;
    if (!phone) {
      console.log('No phone provided');
      return res.status(400).json({ message: 'Phone is required' });
    }
    
    console.log('Looking for user with phone:', phone);
    const user = await prisma.user.findUnique({ 
      where: { phoneNumber: phone },
      include: { organization: true }
    });
    
    if (!user) {
      console.log('User not found with phone:', phone);
      return res.status(404).json({ message: 'User not found' });
    }
    
    console.log('User found:', {
      id: user.id,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      organization: user.organization.name
    });

    const code = String(Math.floor(100000 + Math.random() * 900000));
    const expiresAt = Date.now() + 5 * 60 * 1000; // 5 minutes
    const key = `phone:${phone}`;
    otpStore.set(key, { code, expiresAt });

    console.log(`[OTP] ${phone} -> ${code}`);
    return res.json({ 
      message: 'OTP sent',
      code: code  // Include OTP in response for testing
    });
  } catch (e) {
    console.error('OTP request error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
});

router.post('/otp/verify', async (req, res) => {
  try {
    console.log('=== OTP VERIFICATION ===');
    console.log('Request body:', JSON.stringify(req.body, null, 2));
    
    const { phone, code } = req.body;
    if (!phone || !code) {
      console.log('Missing phone or code');
      return res.status(400).json({ message: 'Phone and code are required' });
    }

    console.log('Verifying OTP for phone:', phone, 'with code:', code);
    
    const key = `phone:${phone}`;
    const entry = otpStore.get(key);
    if (!entry) {
      console.log('No OTP found for phone:', phone);
      return res.status(400).json({ message: 'No OTP requested' });
    }
    
    if (Date.now() > entry.expiresAt) {
      console.log('OTP expired for phone:', phone);
      otpStore.delete(key);
      return res.status(400).json({ message: 'OTP expired' });
    }
    
    if (entry.code !== code) {
      console.log('Invalid OTP for phone:', phone, 'expected:', entry.code, 'got:', code);
      return res.status(401).json({ message: 'Invalid OTP' });
    }

    console.log('OTP verified, looking up user');
    const user = await prisma.user.findUnique({ 
      where: { phoneNumber: phone }, 
      include: { role: true, organization: true } 
    });
    
    if (!user) {
      console.log('User not found during verification for phone:', phone);
      return res.status(404).json({ message: 'User not found' });
    }

    console.log('User found for verification:', {
      id: user.id,
      fullName: user.fullName,
      phoneNumber: user.phoneNumber,
      organization: user.organization.name,
      role: user.role.name
    });

    otpStore.delete(key);

    const token = jwt.sign({ sub: user.id, orgId: user.organizationId, role: user.role.name }, process.env.JWT_SECRET, { expiresIn: '1d' });
    console.log('JWT token generated successfully');
    return res.json({ token });
  } catch (e) {
    console.error('OTP verification error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Refresh token endpoint
router.post('/refresh', async (req, res) => {
  try {
    const { token } = req.body;
    if (!token) {
      return res.status(400).json({ message: 'Token is required' });
    }

    // Verify the existing token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get fresh user data
    const user = await prisma.user.findUnique({ 
      where: { id: decoded.sub }, 
      include: { role: true, organization: true } 
    });
    
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }

    // Generate new token
    const newToken = jwt.sign({ 
      sub: user.id, 
      orgId: user.organizationId, 
      role: user.role.name 
    }, process.env.JWT_SECRET, { expiresIn: '1d' });

    return res.json({ token: newToken });
  } catch (e) {
    if (e.name === 'JsonWebTokenError' || e.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Invalid or expired token' });
    }
    console.error('Token refresh error:', e);
    return res.status(500).json({ message: 'Server error' });
  }
});
