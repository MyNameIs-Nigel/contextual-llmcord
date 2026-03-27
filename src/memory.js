import { getDb } from './db/database.js';
import { config } from './config.js';

/**
 * @param {string} userId
 * @param {string} channelId
 * @returns {string[]}
 */
export function getMemory(userId, channelId) {
  const db = getDb();
  const stmt = db.prepare(
    'SELECT fact FROM user_memory WHERE user_id = ? AND channel_id = ? ORDER BY created_at ASC'
  );
  const rows = stmt.all(userId, channelId);
  return rows.map((r) => r.fact);
}

/**
 * @param {string} userId
 * @param {string} channelId
 * @param {string[]} facts
 */
export function addFacts(userId, channelId, facts) {
  const db = getDb();
  const max = config.memory.max_facts_per_user;
  const toInsert = facts.filter((f) => typeof f === 'string' && f.trim());
  if (toInsert.length === 0) return;

  db.exec('BEGIN IMMEDIATE');
  try {
    const insert = db.prepare(
      'INSERT OR IGNORE INTO user_memory (user_id, channel_id, fact) VALUES (?, ?, ?)'
    );
    for (const fact of toInsert) {
      insert.run(userId, channelId, fact.trim());
    }

    const countStmt = db.prepare(
      'SELECT COUNT(*) AS c FROM user_memory WHERE user_id = ? AND channel_id = ?'
    );
    let count = /** @type {{ c: number }} */ (countStmt.get(userId, channelId)).c;
    while (count > max) {
      const toDelete = count - max;
      const del = db.prepare(`
        DELETE FROM user_memory WHERE id IN (
          SELECT id FROM user_memory
          WHERE user_id = ? AND channel_id = ?
          ORDER BY created_at ASC
          LIMIT ?
        )
      `);
      del.run(userId, channelId, toDelete);
      count = /** @type {{ c: number }} */ (countStmt.get(userId, channelId)).c;
    }
    db.exec('COMMIT');
  } catch (e) {
    db.exec('ROLLBACK');
    throw e;
  }
}

/**
 * @param {string} userId
 * @param {string} channelId
 */
export function clearMemory(userId, channelId) {
  const db = getDb();
  const stmt = db.prepare('DELETE FROM user_memory WHERE user_id = ? AND channel_id = ?');
  stmt.run(userId, channelId);
}

/**
 * @param {string} channelId
 * @returns {string[]}
 */
export function getAllUsersInChannel(channelId) {
  const db = getDb();
  const stmt = db.prepare(
    'SELECT DISTINCT user_id FROM user_memory WHERE channel_id = ? ORDER BY user_id'
  );
  const rows = stmt.all(channelId);
  return rows.map((r) => r.user_id);
}
