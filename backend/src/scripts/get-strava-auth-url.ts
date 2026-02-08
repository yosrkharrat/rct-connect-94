import dotenv from 'dotenv';
import { dbHelper } from '../db';

dotenv.config();

function main() {
  const clientId = process.env.STRAVA_CLIENT_ID || '201108';
  const redirect = process.env.STRAVA_REDIRECT_URI || 'http://localhost:8081/strava/callback';

  const admin = dbHelper.getUserByEmail('admin@rct.tn');
  if (!admin) {
    console.error('Admin user not found (email admin@rct.tn)');
    process.exit(1);
  }

  const state = admin.id;
  const authUrl = `https://www.strava.com/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirect)}&response_type=code&scope=read,activity:read_all&state=${state}`;

  console.log('Open this URL in a browser (logged in as the admin on your Strava app) to authorize:');
  console.log(authUrl);
}

main();
