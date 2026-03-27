/**
 * Uses Node's built-in `node:sqlite` (DatabaseSync). The plan referenced
 * `better-sqlite3`, but native SQLite avoids native addon builds (e.g. on
 * Windows without Visual Studio). Requires Node >= 22 with SQLite enabled.
 */
import { readFileSync, mkdirSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import { DatabaseSync } from 'node:sqlite';

const __dirname = dirname(fileURLToPath(import.meta.url));
const rootDir = join(__dirname, '..', '..');
const dataDir = join(rootDir, 'data');
const dbPath = join(dataDir, 'bot.db');
const schemaPath = join(__dirname, 'schema.sql');

/** @type {import('node:sqlite').DatabaseSync | null} */
let db = null;

export function initDb() {
  mkdirSync(dataDir, { recursive: true });
  const instance = new DatabaseSync(dbPath);
  const schema = readFileSync(schemaPath, 'utf8');
  instance.exec(schema);
  db = instance;
  return db;
}

export function getDb() {
  if (!db) throw new Error('Database not initialized; call initDb() first');
  return db;
}
