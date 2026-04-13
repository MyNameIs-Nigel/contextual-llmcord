import { config, getModelForChannel as getConfiguredModelForChannel } from './config.js';
import { getDb } from './db/database.js';
import { isSupportedModel } from './models.js';

/**
 * @param {string} channelId
 * @returns {string | null}
 */
export function getChannelModelOverride(channelId) {
  const db = getDb();
  const stmt = db.prepare(
    'SELECT model FROM channel_model_overrides WHERE channel_id = ?'
  );
  const row = stmt.get(String(channelId));
  return typeof row?.model === 'string' ? row.model : null;
}

/**
 * @param {string} channelId
 * @returns {string}
 */
export function getSelectedModelForChannel(channelId) {
  return getChannelModelOverride(channelId) ?? getConfiguredModelForChannel(channelId);
}

/**
 * @param {string} channelId
 * @param {string} model
 */
export function setChannelModelOverride(channelId, model) {
  if (!isSupportedModel(model)) {
    throw new Error(`Unsupported model: ${model}`);
  }

  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO channel_model_overrides (channel_id, model, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(channel_id) DO UPDATE SET
      model = excluded.model,
      updated_at = CURRENT_TIMESTAMP
  `);
  stmt.run(String(channelId), model);
}

/**
 * @param {string} channelId
 */
export function clearChannelModelOverride(channelId) {
  const db = getDb();
  const stmt = db.prepare(
    'DELETE FROM channel_model_overrides WHERE channel_id = ?'
  );
  stmt.run(String(channelId));
}

/**
 * @returns {string}
 */
export function getDefaultModel() {
  return config.default_model;
}
