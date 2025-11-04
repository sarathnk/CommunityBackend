import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middlewares/auth.js';

export const router = Router();

// Get all chats for the user's organization
router.get('/', requireAuth, async (req, res) => {
  try {
    const organizationId = req.user.organizationId || req.user.orgId;
    if (!organizationId) {
      return res.status(401).json({ message: 'User organization not found' });
    }
    
    const chats = await prisma.chat.findMany({
      where: {
        organizationId,
        participants: {
          some: {
            userId: req.user.id
          }
        }
      },
      include: {
        participants: {
          select: {
            userId: true,
            userName: true,
            userPhoto: true,
            role: true,
            lastSeen: true
          }
        },
        messages: {
          orderBy: { createdAt: 'desc' },
          take: 1,
          select: {
            content: true,
            senderName: true,
            createdAt: true,
            type: true
          }
        },
        _count: {
          select: {
            participants: true,
            messages: true
          }
        }
      },
      orderBy: { updatedAt: 'desc' }
    });

    res.json({ items: chats });
  } catch (e) {
    console.error('Error fetching chats:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// Create a new chat
router.post('/', requireAuth, async (req, res) => {
  try {
    const { name, description, type = 'group', isPrivate = false, participantIds = [] } = req.body;
    const userId = req.user.id || req.user.sub;
    const userName = req.user.fullName || 'Unknown';
    const organizationId = req.user.organizationId || req.user.orgId;
    if (!organizationId) {
      return res.status(401).json({ message: 'User organization not found' });
    }

    if (!name) {
      return res.status(400).json({ message: 'Chat name is required' });
    }

    // Create the chat
    const chat = await prisma.chat.create({
      data: {
        name,
        description,
        type,
        isPrivate,
        createdById: userId,
        createdByName: userName,
        organizationId,
        participants: {
          create: [
            {
              userId,
              userName,
              userPhoto: req.user.photoUrl,
              role: 'admin'
            },
            ...participantIds.map(id => ({
              userId: id,
              userName: 'Unknown', // Will be updated when we fetch user details
              role: 'member'
            }))
          ]
        }
      },
      include: {
        participants: {
          select: {
            userId: true,
            userName: true,
            userPhoto: true,
            role: true,
            lastSeen: true
          }
        },
        _count: {
          select: {
            participants: true,
            messages: true
          }
        }
      }
    });

    // Update participant names with actual user data
    if (participantIds.length > 0) {
      const users = await prisma.user.findMany({
        where: { id: { in: participantIds } },
        select: { id: true, fullName: true, photoUrl: true }
      });

      for (const user of users) {
        await prisma.chatParticipant.updateMany({
          where: {
            chatId: chat.id,
            userId: user.id
          },
          data: {
            userName: user.fullName,
            userPhoto: user.photoUrl
          }
        });
      }
    }

    res.status(201).json(chat);
  } catch (e) {
    console.error('Error creating chat:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get chat details
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const organizationId = req.user.organizationId || req.user.orgId;
    if (!organizationId) {
      return res.status(401).json({ message: 'User organization not found' });
    }

    const chat = await prisma.chat.findFirst({
      where: {
        id,
        organizationId,
        participants: {
          some: {
            userId: req.user.id
          }
        }
      },
      include: {
        participants: {
          select: {
            userId: true,
            userName: true,
            userPhoto: true,
            role: true,
            joinedAt: true,
            lastSeen: true
          }
        },
        _count: {
          select: {
            participants: true,
            messages: true
          }
        }
      }
    });

    if (!chat) {
      return res.status(404).json({ message: 'Chat not found' });
    }

    res.json(chat);
  } catch (e) {
    console.error('Error fetching chat:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// Update chat
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, isPrivate } = req.body;
    const organizationId = req.user.organizationId || req.user.orgId;

    // Check if user is admin of the chat
    const participant = await prisma.chatParticipant.findFirst({
      where: {
        chatId: id,
        userId: req.user.id,
        role: { in: ['admin', 'moderator'] }
      }
    });

    if (!participant) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const chat = await prisma.chat.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(isPrivate !== undefined && { isPrivate })
      },
      include: {
        participants: {
          select: {
            userId: true,
            userName: true,
            userPhoto: true,
            role: true,
            lastSeen: true
          }
        },
        _count: {
          select: {
            participants: true,
            messages: true
          }
        }
      }
    });

    res.json(chat);
  } catch (e) {
    console.error('Error updating chat:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// Add participants to chat
router.post('/:id/participants', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { participantIds } = req.body;
    const organizationId = req.user.organizationId || req.user.orgId;
    if (!organizationId) {
      return res.status(401).json({ message: 'User organization not found' });
    }

    if (!participantIds || !Array.isArray(participantIds)) {
      return res.status(400).json({ message: 'Participant IDs are required' });
    }

    // Check if user is admin or moderator
    const participant = await prisma.chatParticipant.findFirst({
      where: {
        chatId: id,
        userId: req.user.id,
        role: { in: ['admin', 'moderator'] }
      }
    });

    if (!participant) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    // Get user details
    const users = await prisma.user.findMany({
      where: { 
        id: { in: participantIds },
        organizationId 
      },
      select: { id: true, fullName: true, photoUrl: true }
    });

    // Add participants
    const newParticipants = await prisma.chatParticipant.createMany({
      data: users.map(user => ({
        chatId: id,
        userId: user.id,
        userName: user.fullName,
        userPhoto: user.photoUrl,
        role: 'member'
      })),
      skipDuplicates: true
    });

    res.json({ message: 'Participants added successfully', count: newParticipants.count });
  } catch (e) {
    console.error('Error adding participants:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// Remove participant from chat
router.delete('/:id/participants/:userId', requireAuth, async (req, res) => {
  try {
    const { id, userId } = req.params;
    const organizationId = req.user.organizationId || req.user.orgId;

    // Check if user is admin or moderator, or removing themselves
    const participant = await prisma.chatParticipant.findFirst({
      where: {
        chatId: id,
        userId: req.user.id,
        role: { in: ['admin', 'moderator'] }
      }
    });

    if (!participant && userId !== req.user.id) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    await prisma.chatParticipant.deleteMany({
      where: {
        chatId: id,
        userId
      }
    });

    res.json({ message: 'Participant removed successfully' });
  } catch (e) {
    console.error('Error removing participant:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// Leave chat
router.post('/:id/leave', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    await prisma.chatParticipant.deleteMany({
      where: {
        chatId: id,
        userId: req.user.id
      }
    });

    res.json({ message: 'Left chat successfully' });
  } catch (e) {
    console.error('Error leaving chat:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete chat
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is admin
    const participant = await prisma.chatParticipant.findFirst({
      where: {
        chatId: id,
        userId: req.user.id,
        role: 'admin'
      }
    });

    if (!participant) {
      return res.status(403).json({ message: 'Only chat admins can delete chats' });
    }

    await prisma.chat.delete({
      where: { id }
    });

    res.json({ message: 'Chat deleted successfully' });
  } catch (e) {
    console.error('Error deleting chat:', e);
    res.status(500).json({ message: 'Server error' });
  }
});
