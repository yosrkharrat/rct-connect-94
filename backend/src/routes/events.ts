import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { dbHelper, DbEvent, DbEventParticipant, DbChatGroup, DbChatGroupMember } from '../db';
import { authenticateToken, optionalAuth, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/events - Get all events
router.get('/', optionalAuth, (req: AuthRequest, res) => {
  try {
    const { date, group, type } = req.query;

    let events = [...dbHelper.data.events];

    if (date) {
      events = events.filter(e => e.date === date);
    }
    if (group) {
      events = events.filter(e => e.group_name === group || e.group_name === 'Tous niveaux');
    }
    if (type) {
      events = events.filter(e => e.event_type === type);
    }

    // Add participant count and isJoined
    const eventsWithDetails = events.map(event => {
      const participants = dbHelper.data.event_participants.filter(p => p.event_id === event.id);
      const isJoined = req.user ? participants.some(p => p.user_id === req.user!.userId) : false;
      return {
        ...event,
        participant_count: participants.length,
        is_joined: isJoined,
      };
    });

    // Sort by date
    eventsWithDetails.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    res.json({ success: true, data: eventsWithDetails });
  } catch (error) {
    console.error('Get events error:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// GET /api/events/:id - Get event by ID
router.get('/:id', optionalAuth, (req: AuthRequest, res) => {
  try {
    const event = dbHelper.data.events.find(e => e.id === req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, error: 'Événement non trouvé' });
    }

    const participants = dbHelper.data.event_participants.filter(p => p.event_id === event.id);
    const participantUsers = participants.map(p => {
      const user = dbHelper.data.users.find(u => u.id === p.user_id);
      return user ? { id: user.id, name: user.name, avatar: user.avatar } : null;
    }).filter(Boolean);

    const isJoined = req.user ? participants.some(p => p.user_id === req.user!.userId) : false;
    const creator = dbHelper.data.users.find(u => u.id === event.created_by);

    res.json({
      success: true,
      data: {
        ...event,
        participants: participantUsers,
        participant_count: participants.length,
        is_joined: isJoined,
        creator: creator ? { id: creator.id, name: creator.name, avatar: creator.avatar } : null,
      },
    });
  } catch (error) {
    console.error('Get event error:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// POST /api/events - Create event
router.post('/', authenticateToken, requireRole('admin', 'coach'), async (req: AuthRequest, res) => {
  try {
    const schema = z.object({
      title: z.string().min(3, 'Le titre doit contenir au moins 3 caractères'),
      description: z.string().optional(),
      date: z.string(),
      time: z.string(),
      location: z.string().min(2, 'Lieu requis'),
      location_coords: z.object({ lat: z.number(), lng: z.number() }).optional(),
      distance: z.number().optional(),
      group_name: z.string().optional(),
      event_type: z.string().optional(),
      max_participants: z.number().int().positive().optional(),
    });

    const validation = schema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ success: false, error: validation.error.errors[0].message });
    }

    const now = new Date().toISOString();
    const newEvent: DbEvent = {
      id: uuidv4(),
      title: validation.data.title,
      description: validation.data.description || null,
      date: validation.data.date,
      time: validation.data.time,
      location: validation.data.location,
      location_coords: validation.data.location_coords ? JSON.stringify(validation.data.location_coords) : null,
      distance: validation.data.distance || 0,
      group_name: validation.data.group_name || 'Tous niveaux',
      event_type: validation.data.event_type || 'Sortie',
      max_participants: validation.data.max_participants || null,
      created_by: req.user!.userId,
      created_at: now,
      updated_at: now,
    };

    dbHelper.data.events.push(newEvent);

    // Create chat group for this event automatically
    const chatGroup: DbChatGroup = {
      id: uuidv4(),
      name: `Chat: ${validation.data.title}`,
      description: `Groupe de discussion pour l'événement "${validation.data.title}"`,
      event_id: newEvent.id,
      created_by: req.user!.userId,
      created_at: now,
      updated_at: now,
    };

    dbHelper.createChatGroup(chatGroup);

    // Add creator as admin of the chat group
    const creatorMember: DbChatGroupMember = {
      group_id: chatGroup.id,
      user_id: req.user!.userId,
      role: 'admin',
      joined_at: now,
    };

    dbHelper.addChatGroupMember(creatorMember);

    await dbHelper.write();

    res.status(201).json({ success: true, data: newEvent });
  } catch (error) {
    console.error('Create event error:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// PUT /api/events/:id - Update event
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const eventIndex = dbHelper.data.events.findIndex(e => e.id === req.params.id);
    if (eventIndex === -1) {
      return res.status(404).json({ success: false, error: 'Événement non trouvé' });
    }

    const event = dbHelper.data.events[eventIndex];
    if (event.created_by !== req.user!.userId && req.user!.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Non autorisé' });
    }

    const schema = z.object({
      title: z.string().min(3).optional(),
      description: z.string().optional(),
      date: z.string().optional(),
      time: z.string().optional(),
      location: z.string().optional(),
      location_coords: z.object({ lat: z.number(), lng: z.number() }).optional(),
      distance: z.number().optional(),
      group_name: z.string().optional(),
      event_type: z.string().optional(),
      max_participants: z.number().int().positive().nullable().optional(),
    });

    const validation = schema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ success: false, error: validation.error.errors[0].message });
    }

    const updates = { ...validation.data };
    if (updates.location_coords) {
      (updates as any).location_coords = JSON.stringify(updates.location_coords);
    }

    Object.assign(dbHelper.data.events[eventIndex], updates, { updated_at: new Date().toISOString() });
    await dbHelper.write();

    res.json({ success: true, data: dbHelper.data.events[eventIndex] });
  } catch (error) {
    console.error('Update event error:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// DELETE /api/events/:id - Delete event
router.delete('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const eventIndex = dbHelper.data.events.findIndex(e => e.id === req.params.id);
    if (eventIndex === -1) {
      return res.status(404).json({ success: false, error: 'Événement non trouvé' });
    }

    const event = dbHelper.data.events[eventIndex];
    if (event.created_by !== req.user!.userId && req.user!.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Non autorisé' });
    }

    // Remove event and participants
    dbHelper.data.events.splice(eventIndex, 1);
    dbHelper.data.event_participants = dbHelper.data.event_participants.filter(p => p.event_id !== req.params.id);
    await dbHelper.write();

    res.json({ success: true, message: 'Événement supprimé' });
  } catch (error) {
    console.error('Delete event error:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// POST /api/events/:id/join - Join event
router.post('/:id/join', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const event = dbHelper.data.events.find(e => e.id === req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, error: 'Événement non trouvé' });
    }

    // Check if already joined
    const existing = dbHelper.data.event_participants.find(
      p => p.event_id === req.params.id && p.user_id === req.user!.userId
    );
    if (existing) {
      return res.status(400).json({ success: false, error: 'Vous participez déjà à cet événement' });
    }

    // Check max participants
    const currentCount = dbHelper.data.event_participants.filter(p => p.event_id === req.params.id).length;
    if (event.max_participants && currentCount >= event.max_participants) {
      return res.status(400).json({ success: false, error: 'Événement complet' });
    }

    // Add participant
    const participant: DbEventParticipant = {
      event_id: req.params.id,
      user_id: req.user!.userId,
      joined_at: new Date().toISOString(),
    };
    dbHelper.data.event_participants.push(participant);

    // Update user's joined_events count
    const userIndex = dbHelper.data.users.findIndex(u => u.id === req.user!.userId);
    if (userIndex !== -1) {
      dbHelper.data.users[userIndex].joined_events++;
    }

    // Add user to event chat group automatically
    const chatGroup = dbHelper.getChatGroupByEventId(req.params.id);
    if (chatGroup) {
      const chatMember: DbChatGroupMember = {
        group_id: chatGroup.id,
        user_id: req.user!.userId,
        role: 'member',
        joined_at: new Date().toISOString(),
      };
      dbHelper.addChatGroupMember(chatMember);
    }

    await dbHelper.write();

    res.json({
      success: true,
      message: 'Inscription réussie',
      data: { participant_count: currentCount + 1 },
    });
  } catch (error) {
    console.error('Join event error:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// DELETE /api/events/:id/leave - Leave event
router.delete('/:id/leave', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const participantIndex = dbHelper.data.event_participants.findIndex(
      p => p.event_id === req.params.id && p.user_id === req.user!.userId
    );
    if (participantIndex === -1) {
      return res.status(400).json({ success: false, error: 'Vous ne participez pas à cet événement' });
    }

    dbHelper.data.event_participants.splice(participantIndex, 1);

    // Update user's joined_events count
    const userIndex = dbHelper.data.users.findIndex(u => u.id === req.user!.userId);
    if (userIndex !== -1 && dbHelper.data.users[userIndex].joined_events > 0) {
      dbHelper.data.users[userIndex].joined_events--;
    }

    // Remove user from event chat group automatically
    const chatGroup = dbHelper.getChatGroupByEventId(req.params.id);
    if (chatGroup) {
      dbHelper.removeChatGroupMember(chatGroup.id, req.user!.userId);
    }

    await dbHelper.write();

    const newCount = dbHelper.data.event_participants.filter(p => p.event_id === req.params.id).length;
    res.json({
      success: true,
      message: 'Désinscription réussie',
      data: { participant_count: newCount },
    });
  } catch (error) {
    console.error('Leave event error:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// GET /api/events/:id/participants - Get event participants
router.get('/:id/participants', authenticateToken, (req: AuthRequest, res) => {
  try {
    const event = dbHelper.data.events.find(e => e.id === req.params.id);
    if (!event) {
      return res.status(404).json({ success: false, error: 'Événement non trouvé' });
    }

    const participants = dbHelper.data.event_participants
      .filter(p => p.event_id === req.params.id)
      .map(p => {
        const user = dbHelper.data.users.find(u => u.id === p.user_id);
        return user ? { id: user.id, name: user.name, avatar: user.avatar, joined_at: p.joined_at } : null;
      })
      .filter(Boolean);

    res.json({ success: true, data: participants });
  } catch (error) {
    console.error('Get participants error:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

export default router;
