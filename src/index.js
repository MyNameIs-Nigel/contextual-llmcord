import 'dotenv/config';
import { initDb } from './db/database.js';
import { logConfigSummary } from './config.js';
import { setupBot } from './bot.js';

const required = ['DISCORD_TOKEN', 'OPENROUTER_API_KEY'];
for (const key of required) {
  if (!process.env[key]) {
    throw new Error(`Missing env var: ${key}`);
  }
}

initDb();
logConfigSummary();
setupBot();
