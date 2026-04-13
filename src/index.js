import 'dotenv/config';
import { initDb } from './db/database.js';
import { logConfigSummary } from './config.js';
import { setupBot } from './bot.js';

const required = ['DISCORD_TOKEN'];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing env var: ${key}`);
  }
}

if (!process.env.OPENROUTER_API_KEY && !process.env.GOOGLE_API_KEY) {
  throw new Error('Missing provider env var: set OPENROUTER_API_KEY or GOOGLE_API_KEY');
}

initDb();
logConfigSummary();
setupBot();
