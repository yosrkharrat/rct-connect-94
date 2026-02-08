import { Router, Response } from 'express';
import dbHelper, { DbChatMessage } from '../db';
import { authenticateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Get chat group for an event
router.get('/:eventId/group', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { eventId } = req.params;
    
    // Check if event exists
    const event = dbHelper.getEventById(eventId);
    if (!event) {
      return res.status(404).json({ success: false, error: 'Event not found' });
    }

    // Get chat group for this event
    const chatGroup = dbHelper.getChatGroupByEventId(eventId);
    if (!chatGroup) {
      return res.status(404).json({ success: false, error: 'Chat group not found for this event' });
    }

    // Check if user is a member of this group
    const members = dbHelper.getChatGroupMembers(chatGroup.id);
    const isMember = members.some(m => m.user_id === req.user!.userId);

    if (!isMember) {
      return res.status(403).json({ success: false, error: 'You are not a member of this chat group' });
    }

    res.json({ success: true, data: chatGroup });
  } catch (error) {
    console.error('Error getting event chat group:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get messages for event chat group
router.get('/:eventId/messages', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { eventId } = req.params;
    
    // Get chat group for this event
    const chatGroup = dbHelper.getChatGroupByEventId(eventId);
    if (!chatGroup) {
      return res.status(404).json({ success: false, error: 'Chat group not found for this event' });
    }

    // Check if user is a member
    const members = dbHelper.getChatGroupMembers(chatGroup.id);
    const isMember = members.some(m => m.user_id === req.user!.userId);

    if (!isMember) {
      return res.status(403).json({ success: false, error: 'You are not a member of this chat group' });
    }

    // Get messages
    const messages = dbHelper.getChatGroupMessages(chatGroup.id);

    // Get sender info for each message
    const messagesWithSenders = messages.map(msg => {
      const sender = dbHelper.getUserById(msg.sender_id);
      return {
        id: msg.id,
        group_id: msg.group_id,
        sender_id: msg.sender_id,
        sender_name: sender?.name || 'Unknown',
        sender_avatar: sender?.avatar || null,
        content: msg.content,
        created_at: msg.created_at,
      };
    });

    res.json({ success: true, data: messagesWithSenders });
  } catch (error) {
    console.error('Error getting event messages:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Send message to event chat group
router.post('/:eventId/messages', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { eventId } = req.params;
    const { content } = req.body;

    if (!content || content.trim().length === 0) {
      return res.status(400).json({ success: false, error: 'Message content is required' });
    }

    // Get chat group for this event
    const chatGroup = dbHelper.getChatGroupByEventId(eventId);
    if (!chatGroup) {
      return res.status(404).json({ success: false, error: 'Chat group not found for this event' });
    }

    // Check if user is a member
    const members = dbHelper.getChatGroupMembers(chatGroup.id);
    const isMember = members.some(m => m.user_id === req.user!.userId);

    if (!isMember) {
      return res.status(403).json({ success: false, error: 'You are not a member of this chat group' });
    }

    // Create message
    const message: DbChatMessage = {
      id: Date.now().toString(),
      group_id: chatGroup.id,
      sender_id: req.user!.userId,
      content: content.trim(),
      created_at: new Date().toISOString(),
    };

    dbHelper.createChatMessage(message);

    // Get sender info
    const sender = dbHelper.getUserById(req.user!.userId);

    const messageWithSender = {
      id: message.id,
      group_id: message.group_id,
      sender_id: message.sender_id,
      sender_name: sender?.name || 'Unknown',
      sender_avatar: sender?.avatar || null,
      content: message.content,
      created_at: message.created_at,
    };

    res.status(201).json({ success: true, data: messageWithSender });
  } catch (error) {
    console.error('Error sending event message:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

// Get chat group members
router.get('/:eventId/members', authenticateToken, (req: AuthRequest, res: Response) => {
  try {
    const { eventId } = req.params;
    
    // Get chat group for this event
    const chatGroup = dbHelper.getChatGroupByEventId(eventId);
    if (!chatGroup) {
      return res.status(404).json({ success: false, error: 'Chat group not found for this event' });
    }

    // Check if user is a member
    const members = dbHelper.getChatGroupMembers(chatGroup.id);
    const isMember = members.some(m => m.user_id === req.user!.userId);

    if (!isMember) {
      return res.status(403).json({ success: false, error: 'You are not a member of this chat group' });
    }

    // Get member details
    const membersWithDetails = members.map(member => {
      const user = dbHelper.getUserById(member.user_id);
      return {
        user_id: member.user_id,
        name: user?.name || 'Unknown',
        avatar: user?.avatar || null,
        role: member.role,
        joined_at: member.joined_at,
      };
    });

    res.json({ success: true, data: membersWithDetails });
  } catch (error) {
    console.error('Error getting chat members:', error);
    res.status(500).json({ success: false, error: 'Internal server error' });
  }
});

export default router;
