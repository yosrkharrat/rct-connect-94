import { Router } from 'express';
import axios from 'axios';
import { authenticateToken, AuthRequest } from '../middleware/auth';
import { dbHelper } from '../db';

const router = Router();

const STRAVA_CLIENT_ID = process.env.STRAVA_CLIENT_ID || '201108';
const STRAVA_CLIENT_SECRET = process.env.STRAVA_CLIENT_SECRET || 'd888e477fd768c12ef1ecaae844ec4e2b47f3eab';
const STRAVA_REDIRECT_URI = process.env.STRAVA_REDIRECT_URI || 'http://localhost:8081/strava/callback';

// GET /api/strava/auth - Get Strava OAuth URL
router.get('/auth', authenticateToken, (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const authUrl = `https://www.strava.com/oauth/authorize?client_id=${STRAVA_CLIENT_ID}&redirect_uri=${encodeURIComponent(STRAVA_REDIRECT_URI)}&response_type=code&scope=read,activity:read_all&state=${userId}`;

    res.json({
      success: true,
      data: { authUrl },
    });
  } catch (error) {
    console.error('Strava auth URL error:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// POST /api/strava/callback - Handle Strava OAuth callback (exchange code for tokens)
// No authentication required - uses state parameter (userId) from OAuth flow
router.post('/callback', async (req, res) => {
  try {
    const { code, state } = req.body;
    const userId = state; // state contains the userId from OAuth flow

    if (!code) {
      return res.status(400).json({ success: false, error: 'Code d\'autorisation manquant' });
    }

    if (!userId) {
      return res.status(400).json({ success: false, error: 'User ID manquant (state parameter)' });
    }

    // Exchange authorization code for tokens
    const tokenResponse = await axios.post('https://www.strava.com/oauth/token', {
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      code,
      grant_type: 'authorization_code',
    });

    const { access_token, refresh_token, expires_at, athlete } = tokenResponse.data;

    // Update user in database with Strava info
    dbHelper.updateUser(userId, {
      strava_connected: 1,
      strava_id: String(athlete.id),
      strava_access_token: access_token,
      strava_refresh_token: refresh_token,
      strava_token_expires_at: expires_at,
    } as any);

    console.log(`[Strava] User ${userId} connected as athlete ${athlete.id} (${athlete.firstname} ${athlete.lastname})`);

    res.json({
      success: true,
      data: {
        athleteId: String(athlete.id),
        firstName: athlete.firstname,
        lastName: athlete.lastname,
        profile: athlete.profile,
      },
    });
  } catch (error: any) {
    console.error('Strava callback error:', error.response?.data || error.message);
    const message = error.response?.data?.message || 'Erreur lors de la connexion à Strava';
    res.status(400).json({ success: false, error: message });
  }
});

// Helper: Refresh Strava token if expired
async function getValidAccessToken(userId: string): Promise<string | null> {
  const user = dbHelper.getUserById(userId);
  if (!user || !user.strava_access_token) return null;

  const now = Math.floor(Date.now() / 1000);

  // If token is still valid (with 5-minute buffer), return it
  if (user.strava_token_expires_at && user.strava_token_expires_at > now + 300) {
    return user.strava_access_token;
  }

  // Token expired, refresh it
  try {
    console.log(`[Strava] Refreshing token for user ${userId}`);
    const response = await axios.post('https://www.strava.com/oauth/token', {
      client_id: STRAVA_CLIENT_ID,
      client_secret: STRAVA_CLIENT_SECRET,
      refresh_token: user.strava_refresh_token,
      grant_type: 'refresh_token',
    });

    const { access_token, refresh_token, expires_at } = response.data;

    dbHelper.updateUser(userId, {
      strava_access_token: access_token,
      strava_refresh_token: refresh_token,
      strava_token_expires_at: expires_at,
    } as any);

    return access_token;
  } catch (error: any) {
    console.error('Strava token refresh error:', error.response?.data || error.message);
    return null;
  }
}

// GET /api/strava/activities - Get user's Strava activities
router.get('/activities', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const user = dbHelper.getUserById(userId);

    if (!user || !user.strava_connected) {
      return res.status(400).json({ success: false, error: 'Strava non connecté' });
    }

    const accessToken = await getValidAccessToken(userId);
    if (!accessToken) {
      return res.status(401).json({ success: false, error: 'Token Strava invalide. Veuillez reconnecter votre compte.' });
    }

    // Fetch recent activities (last 30 days, running type)
    const thirtyDaysAgo = Math.floor(Date.now() / 1000) - 30 * 24 * 60 * 60;
    const response = await axios.get('https://www.strava.com/api/v3/athlete/activities', {
      headers: { Authorization: `Bearer ${accessToken}` },
      params: {
        after: thirtyDaysAgo,
        per_page: 30,
      },
    });

    // Filter for running activities and map to our format
    const activities = response.data
      .filter((a: any) => a.type === 'Run' || a.type === 'TrailRun' || a.type === 'VirtualRun')
      .map((a: any) => ({
        id: a.id,
        name: a.name,
        type: a.type,
        distance: a.distance,
        moving_time: a.moving_time,
        elapsed_time: a.elapsed_time,
        total_elevation_gain: a.total_elevation_gain,
        start_date: a.start_date_local,
        average_speed: a.average_speed,
        max_speed: a.max_speed,
        average_heartrate: a.average_heartrate,
        max_heartrate: a.max_heartrate,
        kudos_count: a.kudos_count,
        polyline: a.map?.summary_polyline || null,
        start_latlng: a.start_latlng || null,
        end_latlng: a.end_latlng || null,
      }));

    res.json({ success: true, data: activities });
  } catch (error: any) {
    console.error('Strava activities error:', error.response?.data || error.message);
    if (error.response?.status === 401) {
      return res.status(401).json({ success: false, error: 'Token Strava expiré. Veuillez reconnecter votre compte.' });
    }
    res.status(500).json({ success: false, error: 'Erreur lors du chargement des activités' });
  }
});

// GET /api/strava/athlete - Get athlete profile from Strava
router.get('/athlete', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const accessToken = await getValidAccessToken(userId);

    if (!accessToken) {
      return res.status(401).json({ success: false, error: 'Strava non connecté' });
    }

    const response = await axios.get('https://www.strava.com/api/v3/athlete', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const athlete = response.data;
    res.json({
      success: true,
      data: {
        id: athlete.id,
        firstName: athlete.firstname,
        lastName: athlete.lastname,
        profile: athlete.profile,
        city: athlete.city,
        country: athlete.country,
      },
    });
  } catch (error: any) {
    console.error('Strava athlete error:', error.response?.data || error.message);
    res.status(500).json({ success: false, error: 'Erreur lors du chargement du profil' });
  }
});

// DELETE /api/strava/disconnect - Disconnect Strava
router.delete('/disconnect', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const user = dbHelper.getUserById(userId);

    if (!user) {
      return res.status(404).json({ success: false, error: 'Utilisateur non trouvé' });
    }

    // Clear Strava data from user
    dbHelper.updateUser(userId, {
      strava_connected: 0,
      strava_id: null,
      strava_access_token: null,
      strava_refresh_token: null,
      strava_token_expires_at: null,
    } as any);

    console.log(`[Strava] User ${userId} disconnected`);
    res.json({ success: true, message: 'Strava déconnecté' });
  } catch (error) {
    console.error('Disconnect Strava error:', error);
    res.status(500).json({ success: false, error: 'Erreur serveur' });
  }
});

// GET /api/strava/stats - Get user's Strava stats
router.get('/stats', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const user = dbHelper.getUserById(userId);

    if (!user || !user.strava_connected || !user.strava_id) {
      return res.status(400).json({ success: false, error: 'Strava non connecté' });
    }

    const accessToken = await getValidAccessToken(userId);
    if (!accessToken) {
      return res.status(401).json({ success: false, error: 'Token Strava invalide' });
    }

    const response = await axios.get(`https://www.strava.com/api/v3/athletes/${user.strava_id}/stats`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const stats = response.data;
    res.json({
      success: true,
      data: {
        recentRuns: stats.recent_run_totals,
        allTimeRuns: stats.all_run_totals,
        ytdRuns: stats.ytd_run_totals,
      },
    });
  } catch (error: any) {
    console.error('Strava stats error:', error.response?.data || error.message);
    res.status(500).json({ success: false, error: 'Erreur lors du chargement des stats' });
  }
});

// POST /api/strava/sync-distance - Sync Strava distance to user profile
router.post('/sync-distance', authenticateToken, async (req: AuthRequest, res) => {
  try {
    const userId = req.user!.userId;
    const user = dbHelper.getUserById(userId);

    if (!user || !user.strava_connected || !user.strava_id) {
      return res.status(400).json({ success: false, error: 'Strava non connecté' });
    }

    const accessToken = await getValidAccessToken(userId);
    if (!accessToken) {
      return res.status(401).json({ success: false, error: 'Token Strava invalide' });
    }

    // Get Strava stats
    const response = await axios.get(`https://www.strava.com/api/v3/athletes/${user.strava_id}/stats`, {
      headers: { Authorization: `Bearer ${accessToken}` },
    });

    const stats = response.data;
    const totalDistance = stats.all_run_totals?.distance || 0; // in meters
    const totalDistanceKm = Math.round(totalDistance / 1000); // convert to km
    const totalRuns = stats.all_run_totals?.count || 0;

    // Update user profile
    dbHelper.updateUser(userId, {
      distance: totalDistanceKm,
      runs: totalRuns,
    } as any);

    console.log(`[Strava Sync] User ${userId}: ${totalDistanceKm}km, ${totalRuns} runs`);

    res.json({
      success: true,
      data: {
        distance: totalDistanceKm,
        runs: totalRuns,
      },
    });
  } catch (error: any) {
    console.error('Strava sync error:', error.response?.data || error.message);
    res.status(500).json({ success: false, error: 'Erreur lors de la synchronisation' });
  }
});

export default router;
