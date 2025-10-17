import { Router } from 'express';
import { prisma } from '../lib/prisma.js';
import { requireAuth } from '../middlewares/auth.js';

export const router = Router();

// Get messages for a chat
router.get('/chat/:chatId', requireAuth, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { page = 1, limit = 50 } = req.query;
    const { organizationId } = req.user;

    // Check if user is participant in the chat
    const participant = await prisma.chatParticipant.findFirst({
      where: {
        chatId,
        userId: req.user.id
      }
    });

    if (!participant) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const messages = await prisma.message.findMany({
      where: { chatId },
      include: {
        replyTo: {
          select: {
            id: true,
            content: true,
            senderName: true,
            type: true
          }
        },
        replies: {
          select: {
            id: true,
            content: true,
            senderName: true,
            createdAt: true
          },
          orderBy: { createdAt: 'asc' }
        }
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: parseInt(limit)
    });

    // Update last seen
    await prisma.chatParticipant.updateMany({
      where: {
        chatId,
        userId: req.user.id
      },
      data: {
        lastSeen: new Date()
      }
    });

    res.json({ items: messages.reverse() }); // Reverse to show oldest first
  } catch (e) {
    console.error('Error fetching messages:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// Send a message
router.post('/', requireAuth, async (req, res) => {
  try {
    const { chatId, content, type = 'text', replyToId } = req.body;
    const { id: userId, fullName: userName, photoUrl } = req.user;

    if (!chatId || !content) {
      return res.status(400).json({ message: 'Chat ID and content are required' });
    }

    // Check if user is participant in the chat
    const participant = await prisma.chatParticipant.findFirst({
      where: {
        chatId,
        userId
      }
    });

    if (!participant) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Validate reply message exists
    if (replyToId) {
      const replyMessage = await prisma.message.findFirst({
        where: {
          id: replyToId,
          chatId
        }
      });

      if (!replyMessage) {
        return res.status(400).json({ message: 'Reply message not found' });
      }
    }

    const message = await prisma.message.create({
      data: {
        content,
        type,
        senderId: userId,
        senderName: userName,
        senderPhoto: photoUrl,
        chatId,
        replyToId
      },
      include: {
        replyTo: {
          select: {
            id: true,
            content: true,
            senderName: true,
            type: true
          }
        }
      }
    });

    // Update chat's updatedAt
    await prisma.chat.update({
      where: { id: chatId },
      data: { updatedAt: new Date() }
    });

    res.status(201).json(message);
  } catch (e) {
    console.error('Error sending message:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// Edit a message
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: 'Content is required' });
    }

    // Check if user is the sender
    const message = await prisma.message.findFirst({
      where: {
        id,
        senderId: req.user.id
      }
    });

    if (!message) {
      return res.status(404).json({ message: 'Message not found or access denied' });
    }

    const updatedMessage = await prisma.message.update({
      where: { id },
      data: {
        content,
        isEdited: true,
        editedAt: new Date()
      },
      include: {
        replyTo: {
          select: {
            id: true,
            content: true,
            senderName: true,
            type: true
          }
        }
      }
    });

    res.json(updatedMessage);
  } catch (e) {
    console.error('Error editing message:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// Delete a message
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Check if user is the sender or admin
    const message = await prisma.message.findFirst({
      where: { id },
      include: {
        chat: {
          include: {
            participants: {
              where: {
                userId: req.user.id
              }
            }
          }
        }
      }
    });

    if (!message) {
      return res.status(404).json({ message: 'Message not found' });
    }

    const participant = message.chat.participants[0];
    const isAdmin = participant?.role === 'admin' || participant?.role === 'moderator';
    const isSender = message.senderId === req.user.id;

    if (!isAdmin && !isSender) {
      return res.status(403).json({ message: 'Access denied' });
    }

    await prisma.message.delete({
      where: { id }
    });

    res.json({ message: 'Message deleted successfully' });
  } catch (e) {
    console.error('Error deleting message:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// Mark messages as read
router.post('/mark-read', requireAuth, async (req, res) => {
  try {
    const { chatId } = req.body;

    if (!chatId) {
      return res.status(400).json({ message: 'Chat ID is required' });
    }

    await prisma.chatParticipant.updateMany({
      where: {
        chatId,
        userId: req.user.id
      },
      data: {
        lastSeen: new Date()
      }
    });

    res.json({ message: 'Messages marked as read' });
  } catch (e) {
    console.error('Error marking messages as read:', e);
    res.status(500).json({ message: 'Server error' });
  }
});

// Get unread message count
router.get('/unread-count', requireAuth, async (req, res) => {
  try {
    const { organizationId } = req.user;

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
          where: {
            userId: req.user.id
          },
          select: {
            lastSeen: true
          }
        },
        messages: {
          where: {
            createdAt: {
              gt: new Date() // This will be updated with actual lastSeen time
            }
          },
          select: {
            id: true
          }
        }
      }
    });

    let totalUnread = 0;
    for (const chat of chats) {
      const lastSeen = chat.participants[0]?.lastSeen || new Date(0);
      const unreadCount = await prisma.message.count({
        where: {
          chatId: chat.id,
          createdAt: {
            gt: lastSeen
          }
        }
      });
      totalUnread += unreadCount;
    }

    res.json({ unreadCount: totalUnread });
  } catch (e) {
    console.error('Error getting unread count:', e);
    res.status(500).json({ message: 'Server error' });
  }
});
