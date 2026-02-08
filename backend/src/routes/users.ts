import { Router } from 'express';
import { z } from 'zod';
import { dbHelper } from '../db';
import { authenticateToken, requireRole, AuthRequest } from '../middleware/auth';

const router = Router();

// GET /api/users - Get all users
router.get('/', authenticateToken, (req: AuthRequest, res) => {
  try {
    const { role, group } = req.query;

    let users = dbHelper.data.users.map(({ password: _, ...user }) => user);

    if (role) {
      users = users.filter(u => u.role === role);
    }
    if (group) {
      users = users.filter(u => u.group_name === group);
    }

    res.json({
      success: true,
      data: users,
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// GET /api/users/:id - Get user by ID
router.get('/:id', authenticateToken, (req: AuthRequest, res) => {
  try {
    const user = dbHelper.data.users.find(u => u.id === req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
    }

    const { password: _, ...userWithoutPassword } = user;
    res.json({ success: true, data: userWithoutPassword });
  } catch (error) {
    console.error('Get user error:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// PUT /api/users/:id - Update user
router.put('/:id', authenticateToken, async (req: AuthRequest, res) => {
  try {
    // Only allow updating own profile or admin
    if (req.params.id !== req.user!.userId && req.user!.role !== 'admin') {
      return res.status(403).json({ success: false, error: 'Non autorisé' });
    }

    const schema = z.object({
      name: z.string().min(2).optional(),
      avatar: z.string().url().nullable().optional(),
      level: z.enum(['débutant', 'intermédiaire', 'élite']).optional(),
      group_name: z.string().optional(),
    });

    const validation = schema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ success: false, error: validation.error.errors[0].message });
    }

    const userIndex = dbHelper.data.users.findIndex(u => u.id === req.params.id);
    if (userIndex === -1) {
      return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
    }

    const updates = validation.data;
    Object.assign(dbHelper.data.users[userIndex], updates, { updated_at: new Date().toISOString() });
    await dbHelper.write();

    const { password: _, ...userWithoutPassword } = dbHelper.data.users[userIndex];
    res.json({ success: true, data: userWithoutPassword });
  } catch (error) {
    console.error('Update user error:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// PUT /api/users/:id/role - Update user role (admin only)
router.put('/:id/role', authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const schema = z.object({
      role: z.enum(['admin', 'coach', 'member']),
    });

    const validation = schema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ success: false, error: 'Rôle invalide' });
    }

    const userIndex = dbHelper.data.users.findIndex(u => u.id === req.params.id);
    if (userIndex === -1) {
      return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
    }

    dbHelper.data.users[userIndex].role = validation.data.role;
    dbHelper.data.users[userIndex].updated_at = new Date().toISOString();
    await dbHelper.write();

    res.json({ success: true, message: 'Rôle mis à jour' });
  } catch (error) {
    console.error('Update role error:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// PUT /api/users/:id/stats - Update user stats
router.put('/:id/stats', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (req.params.id !== req.user!.userId && !['admin', 'coach'].includes(req.user!.role)) {
      return res.status(403).json({ success: false, error: 'Non autorisé' });
    }

    const schema = z.object({
      distance: z.number().nonnegative().optional(),
      runs: z.number().int().nonnegative().optional(),
    });

    const validation = schema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({ success: false, error: validation.error.errors[0].message });
    }

    const userIndex = dbHelper.data.users.findIndex(u => u.id === req.params.id);
    if (userIndex === -1) {
      return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
    }

    if (validation.data.distance !== undefined) {
      dbHelper.data.users[userIndex].distance += validation.data.distance;
    }
    if (validation.data.runs !== undefined) {
      dbHelper.data.users[userIndex].runs += validation.data.runs;
    }
    dbHelper.data.users[userIndex].updated_at = new Date().toISOString();
    await dbHelper.write();

    const { password: _, ...userWithoutPassword } = dbHelper.data.users[userIndex];
    res.json({ success: true, data: userWithoutPassword });
  } catch (error) {
    console.error('Update stats error:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// POST /api/users/:id/strava - Connect Strava (used after OAuth callback)
router.post('/:id/strava', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (req.params.id !== req.user!.userId) {
      return res.status(403).json({ success: false, error: 'Non autorisé' });
    }

    const { stravaId, accessToken, refreshToken, expiresAt } = req.body;
    if (!stravaId) {
      return res.status(400).json({ success: false, error: 'ID Strava requis' });
    }

    const user = dbHelper.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
    }

    dbHelper.updateUser(req.params.id, {
      strava_connected: 1,
      strava_id: stravaId,
      strava_access_token: accessToken || null,
      strava_refresh_token: refreshToken || null,
      strava_token_expires_at: expiresAt || null,
    } as any);

    res.json({ success: true, message: 'Strava connecté' });
  } catch (error) {
    console.error('Connect Strava error:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// DELETE /api/users/:id/strava - Disconnect Strava
router.delete('/:id/strava', authenticateToken, async (req: AuthRequest, res) => {
  try {
    if (req.params.id !== req.user!.userId) {
      return res.status(403).json({ success: false, error: 'Non autorisé' });
    }

    const user = dbHelper.getUserById(req.params.id);
    if (!user) {
      return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
    }

    dbHelper.updateUser(req.params.id, {
      strava_connected: 0,
      strava_id: null,
      strava_access_token: null,
      strava_refresh_token: null,
      strava_token_expires_at: null,
    } as any);

    res.json({ success: true, message: 'Strava déconnecté' });
  } catch (error) {
    console.error('Disconnect Strava error:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// DELETE /api/users/:id - Delete user (admin only)
router.delete('/:id', authenticateToken, requireRole('admin'), async (req: AuthRequest, res) => {
  try {
    const userIndex = dbHelper.data.users.findIndex(u => u.id === req.params.id);
    if (userIndex === -1) {
      return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
    }

    dbHelper.data.users.splice(userIndex, 1);
    await dbHelper.write();

    res.json({ success: true, message: 'Utilisateur supprimé' });
  } catch (error) {
    console.error('Delete user error:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

export default router;
