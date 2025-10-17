import { Router } from 'express';
import { requireAuth } from '../middlewares/auth.js';
import { prisma } from '../lib/prisma.js';

export const router = Router();

// Get all notifications for the current user
router.get('/', requireAuth, async (req, res) => {
  try {
    const notifications = await prisma.notification.findMany({
      where: { userId: req.user.sub },
      orderBy: { createdAt: 'desc' },
      take: 50,
    });

    return res.json({
      items: notifications,
      total: notifications.length,
    });
  } catch (e) {
    console.error('Error fetching notifications:', e);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Mark a notification as read
router.patch('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { isRead } = req.body;

    const notification = await prisma.notification.update({
      where: { 
        id: id,
        userId: req.user.sub, // Ensure user can only update their own notifications
      },
      data: { isRead: isRead ?? true },
    });

    return res.json(notification);
  } catch (e) {
    console.error('Error updating notification:', e);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Mark all notifications as read
router.patch('/mark-all-read', requireAuth, async (req, res) => {
  try {
    await prisma.notification.updateMany({
      where: { 
        userId: req.user.sub,
        isRead: false,
      },
      data: { isRead: true },
    });

    return res.json({ message: 'All notifications marked as read' });
  } catch (e) {
    console.error('Error marking all notifications as read:', e);
    return res.status(500).json({ message: 'Server error' });
  }
});

// Create a notification (for testing purposes)
router.post('/', requireAuth, async (req, res) => {
  try {
    const { title, message, type, userId } = req.body;
    
    const notification = await prisma.notification.create({
      data: {
        title: title || 'Test Notification',
        message: message || 'This is a test notification',
        type: type || 'general',
        userId: userId || req.user.sub,
        isRead: false,
      },
    });

    return res.status(201).json(notification);
  } catch (e) {
    console.error('Error creating notification:', e);
    return res.status(500).json({ message: 'Server error' });
  }
});

