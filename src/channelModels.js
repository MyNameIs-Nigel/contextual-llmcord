import { config, getModelForChannel as getConfiguredModelForChannel } from './config.js';
import { getDb } from './db/database.js';
import {
  getFirstAvailableModel,
  isModelAvailable,
  isSupportedModel,
  normalizeModelValue,
} from './models.js';

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
  return typeof row?.model === 'string' ? normalizeModelValue(row.model) : null;
}

/**
 * @param {string} channelId
 * @returns {string}
 */
export function getSelectedModelForChannel(channelId) {
  const override = getChannelModelOverride(channelId);
  if (override && isModelAvailable(override)) {
    return override;
  }

  const configured = normalizeModelValue(getConfiguredModelForChannel(channelId));
  if (configured && isModelAvailable(configured)) {
    return configured;
  }

  const fallback = getFirstAvailableModel();
  if (fallback) {
    return fallback;
  }

  throw new Error('No model providers are configured. Set OPENROUTER_API_KEY or GOOGLE_API_KEY.');
}

/**
 * @param {string} channelId
 * @param {string} model
 */
export function setChannelModelOverride(channelId, model) {
  const normalized = normalizeModelValue(model);
  if (!isSupportedModel(normalized)) {
    throw new Error(`Unsupported model: ${model}`);
  }
  if (!isModelAvailable(normalized)) {
    throw new Error(`Model is not available with the current environment: ${normalized}`);
  }

  const db = getDb();
  const stmt = db.prepare(`
    INSERT INTO channel_model_overrides (channel_id, model, updated_at)
    VALUES (?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(channel_id) DO UPDATE SET
      model = excluded.model,
      updated_at = CURRENT_TIMESTAMP
  `);
  stmt.run(String(channelId), normalized);
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
  const configured = normalizeModelValue(config.default_model);
  if (configured && isModelAvailable(configured)) {
    return configured;
  }
  return getFirstAvailableModel() ?? configured;
}
