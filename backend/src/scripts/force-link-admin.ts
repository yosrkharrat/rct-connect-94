import dotenv from 'dotenv';
import { dbHelper } from '../db';

dotenv.config();

async function main() {
  const adminEmail = 'admin@rct.tn';
  const admin = dbHelper.getUserByEmail(adminEmail);
  
  if (!admin) {
    console.error(`Admin user not found by email ${adminEmail}`);
    process.exit(1);
  }

  // Use provided credentials (even if expired, for UI purposes)
  const accessToken = 'e2acce77075891e13f419c330d4b88ebe24ff277';
  const refreshToken = 'c4228d8b5858d7fb81442f0de3c1225dff7f6d54';
  const expiresAt = Math.floor(new Date('2026-02-08T03:39:23Z').getTime() / 1000);
  
  // If you know your Strava athlete ID, provide it here
  // Otherwise use a placeholder
  const athleteId = process.argv[2] || 'YOUR_ATHLETE_ID';

  dbHelper.updateUser(admin.id, {
    strava_connected: true,
    strava_id: athleteId,
    strava_access_token: accessToken,
    strava_refresh_token: refreshToken,
    strava_token_expires_at: expiresAt,
  } as any);

  console.log(`✅ Forcefully linked Strava athlete ${athleteId} to admin (${adminEmail})`);
  console.log(`⚠️  Note: Tokens are expired. Real Strava API calls will fail until re-authorized.`);
}

main();
