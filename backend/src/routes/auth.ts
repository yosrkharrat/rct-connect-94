import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import { z } from 'zod';
import { dbHelper, DbUser } from '../db';
import { authenticateToken, generateToken, AuthRequest } from '../middleware/auth';

const router = Router();

// Transform backend user to frontend user structure
function toFrontendUser(user: DbUser) {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    cin: '',  // Not used anymore
    role: user.role,
    group: user.group_name,
    avatar: user.avatar,
    joinDate: user.created_at,
    stats: {
      totalDistance: user.distance,
      totalRuns: user.runs,
      avgPace: '5:30',  // Default value
      streak: 0,
      ranking: 1,
    },
    strava: {
      connected: user.strava_connected,
      athleteId: user.strava_id || undefined,
    },
  };
}

// POST /api/auth/register
router.post('/register', async (req, res) => {
  try {
    const schema = z.object({
      name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
      email: z.string().email('Email invalide'),
      password: z.string().min(6, 'Le mot de passe doit contenir au moins 6 caractères'),
    });

    const validation = schema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: validation.error.errors[0].message,
      });
    }

    const { name, email, password } = validation.data;

    // Check if user exists
    const existingUser = dbHelper.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (existingUser) {
      return res.status(400).json({
        success: false,
        error: 'Cet email est déjà utilisé',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create user
    const now = new Date().toISOString();
    const newUser: DbUser = {
      id: uuidv4(),
      email: email.toLowerCase(),
      password: hashedPassword,
      name,
      avatar: null,
      role: 'member',
      group_name: 'Débutant',
      distance: 0,
      runs: 0,
      joined_events: 0,
      strava_connected: false,
      strava_id: null,
      created_at: now,
      updated_at: now,
    };

    dbHelper.data.users.push(newUser);
    await dbHelper.write();

    // Generate token
    const token = generateToken(newUser.id, newUser.role);

    res.status(201).json({
      success: true,
      data: {
        user: toFrontendUser(newUser),
        token,
      },
    });
  } catch (error) {
    console.error('Register error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
    });
  }
});

// POST /api/auth/login
router.post('/login', async (req, res) => {
  try {
    const schema = z.object({
      email: z.string().email('Email invalide'),
      password: z.string().min(1, 'Mot de passe requis'),
    });

    const validation = schema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: validation.error.errors[0].message,
      });
    }

    const { email, password } = validation.data;

    // Find user
    const user = dbHelper.data.users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Email ou mot de passe incorrect',
      });
    }

    // Check password
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: 'Email ou mot de passe incorrect',
      });
    }

    // Generate token
    const token = generateToken(user.id, user.role);

    res.json({
      success: true,
      data: {
        user: toFrontendUser(user),
        token,
      },
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
    });
  }
});

// GET /api/auth/me
router.get('/me', authenticateToken, (req: AuthRequest, res) => {
  try {
    const user = dbHelper.data.users.find(u => u.id === req.user!.userId);
    if (!user) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé',
      });
    }

    res.json({
      success: true,
      data: { user: toFrontendUser(user) },
    });
  } catch (error) {
    console.error('Get me error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
    });
  }
});

// POST /api/auth/logout
router.post('/logout', authenticateToken, (_req, res) => {
  res.json({
    success: true,
    message: 'Déconnexion réussie',
  });
});

// PUT /api/auth/password
router.put('/password', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const schema = z.object({
      currentPassword: z.string().min(1, 'Mot de passe actuel requis'),
      newPassword: z.string().min(6, 'Le nouveau mot de passe doit contenir au moins 6 caractères'),
    });

    const validation = schema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        success: false,
        error: validation.error.errors[0].message,
      });
    }

    const { currentPassword, newPassword } = validation.data;

    const userIndex = dbHelper.data.users.findIndex(u => u.id === req.user!.userId);
    if (userIndex === -1) {
      return res.status(404).json({
        success: false,
        error: 'Utilisateur non trouvé',
      });
    }

    const user = dbHelper.data.users[userIndex];

    // Verify current password
    const passwordMatch = await bcrypt.compare(currentPassword, user.password);
    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        error: 'Mot de passe actuel incorrect',
      });
    }

    // Hash and update password
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    dbHelper.data.users[userIndex].password = hashedPassword;
    dbHelper.data.users[userIndex].updated_at = new Date().toISOString();
    await dbHelper.write();

    res.json({
      success: true,
      message: 'Mot de passe mis à jour',
    });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({
      success: false,
      error: 'Erreur serveur',
    });
  }
});

export default router;
