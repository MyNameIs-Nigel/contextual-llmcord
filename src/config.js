import { readFileSync } from 'fs';
import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import yaml from 'js-yaml';

const __dirname = dirname(fileURLToPath(import.meta.url));
const configPath = join(__dirname, '..', 'config.yaml');

function loadRaw() {
  try {
    return readFileSync(configPath, 'utf8');
  } catch (err) {
    throw new Error(
      `Failed to read config.yaml at ${configPath}: ${err instanceof Error ? err.message : err}`
    );
  }
}

function validate(data) {
  if (!data || typeof data !== 'object') {
    throw new Error('config.yaml must contain a mapping at the root');
  }
  if (typeof data.default_model !== 'string' || !data.default_model.trim()) {
    throw new Error('config validation: default_model is required and must be a non-empty string');
  }
  const cw = data.context_window;
  if (!Number.isInteger(cw) || cw < 1) {
    throw new Error('config validation: context_window must be a positive integer');
  }
  if (typeof data.system_prompt !== 'string') {
    throw new Error('config validation: system_prompt must be a string');
  }
  const mem = data.memory ?? {};
  const maxFacts = mem.max_facts_per_user;
  if (!Number.isInteger(maxFacts) || maxFacts < 1) {
    throw new Error('config validation: memory.max_facts_per_user must be a positive integer');
  }
  if (typeof mem.inject_in_system !== 'boolean') {
    throw new Error('config validation: memory.inject_in_system must be true or false');
  }
  const or = data.openrouter ?? {};
  if (typeof or.site_url !== 'string' || !or.site_url.trim()) {
    throw new Error('config validation: openrouter.site_url must be a non-empty string');
  }
  if (typeof or.site_name !== 'string' || !or.site_name.trim()) {
    throw new Error('config validation: openrouter.site_name must be a non-empty string');
  }
  const timeout = or.timeout_ms;
  if (!Number.isInteger(timeout) || timeout < 1000) {
    throw new Error('config validation: openrouter.timeout_ms must be an integer >= 1000');
  }
}

let raw;
try {
  raw = yaml.load(loadRaw());
  validate(raw);
} catch (err) {
  if (err instanceof yaml.YAMLException) {
    throw new Error(`config.yaml parse error: ${err.message}`);
  }
  throw err;
}

/** @type {Readonly<typeof raw>} */
export const config = Object.freeze(structuredClone(raw));

/**
 * @param {string} channelId
 * @returns {string}
 */
export function getModelForChannel(channelId) {
  const map = config.channel_models;
  const id = String(channelId);
  if (map && typeof map === 'object') {
    for (const [k, v] of Object.entries(map)) {
      if (String(k) === id && typeof v === 'string' && v.trim()) return v;
    }
  }
  return config.default_model;
}

export function logConfigSummary() {
  console.log(
    '[config] default_model=%s context_window=%s max_facts_per_user=%s',
    config.default_model,
    config.context_window,
    config.memory.max_facts_per_user
  );
}
