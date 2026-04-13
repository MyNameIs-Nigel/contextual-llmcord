export const DEFAULT_MODEL_CHOICE = '__default__';

const OPENROUTER_MODEL_CHOICES = Object.freeze([
  Object.freeze({
    name: 'Z.AI GLM 4.5 Air',
    value: 'openrouter/z-ai/glm-4.5-air:free',
  }),
  Object.freeze({
    name: 'NVIDIA Nemotron 3 Super 120B',
    value: 'openrouter/nvidia/nemotron-3-super-120b-a12b:free',
  }),
  Object.freeze({
    name: 'Google Gemma 4 26B',
    value: 'openrouter/google/gemma-4-26b-a4b-it:free',
  }),
  Object.freeze({
    name: 'Liquid LFM 2.5 1.2B',
    value: 'openrouter/liquid/lfm-2.5-1.2b-instruct:free',
  }),
]);

const GOOGLE_MODEL_CHOICES = Object.freeze([
  Object.freeze({
    name: 'Google Gemini 2.5 Flash',
    value: 'google/gemini-2.5-flash',
  }),
  Object.freeze({
    name: 'Google Gemini 2.5 Flash-Lite',
    value: 'google/gemini-2.5-flash-lite',
  }),
  Object.freeze({
    name: 'Google Gemini 2.5 Pro',
    value: 'google/gemini-2.5-pro',
  }),
]);

const LEGACY_MODEL_ALIASES = new Map([
  ['z-ai/glm-4.5-air:free', 'openrouter/z-ai/glm-4.5-air:free'],
  [
    'nvidia/nemotron-3-super-120b-a12b:free',
    'openrouter/nvidia/nemotron-3-super-120b-a12b:free',
  ],
  ['google/gemma-4-26b-a4b-it:free', 'openrouter/google/gemma-4-26b-a4b-it:free'],
  ['liquid/lfm-2.5-1.2b-instruct:free', 'openrouter/liquid/lfm-2.5-1.2b-instruct:free'],
]);

const ALL_MODEL_CHOICES = Object.freeze([
  ...OPENROUTER_MODEL_CHOICES,
  ...GOOGLE_MODEL_CHOICES,
]);

const SUPPORTED_MODELS = new Set(ALL_MODEL_CHOICES.map((choice) => choice.value));

export function hasOpenRouterKey() {
  return typeof process.env.OPENROUTER_API_KEY === 'string' && !!process.env.OPENROUTER_API_KEY.trim();
}

export function hasGoogleKey() {
  return typeof process.env.GOOGLE_API_KEY === 'string' && !!process.env.GOOGLE_API_KEY.trim();
}

/**
 * @param {string} model
 * @returns {string}
 */
export function normalizeModelValue(model) {
  const raw = String(model ?? '').trim();
  if (!raw) return raw;
  return LEGACY_MODEL_ALIASES.get(raw) ?? raw;
}

/**
 * @param {string} model
 * @returns {boolean}
 */
export function isSupportedModel(model) {
  return SUPPORTED_MODELS.has(normalizeModelValue(model));
}

/**
 * @param {string} model
 * @returns {boolean}
 */
export function isModelAvailable(model) {
  const normalized = normalizeModelValue(model);
  if (normalized.startsWith('openrouter/')) return hasOpenRouterKey();
  if (normalized.startsWith('google/')) return hasGoogleKey();
  return false;
}

/**
 * @param {string} model
 * @returns {string}
 */
export function getModelDisplayName(model) {
  const normalized = normalizeModelValue(model);
  const match = ALL_MODEL_CHOICES.find((choice) => choice.value === normalized);
  return match?.name ?? normalized;
}

/**
 * @returns {{ name: string; value: string }[]}
 */
export function getModelChoices() {
  const out = [];
  if (hasOpenRouterKey()) {
    out.push(...OPENROUTER_MODEL_CHOICES);
  }
  if (hasGoogleKey()) {
    out.push(...GOOGLE_MODEL_CHOICES);
  }
  return out.map((choice) => ({ ...choice }));
}

/**
 * @returns {string | null}
 */
export function getFirstAvailableModel() {
  const first = getModelChoices()[0];
  return first?.value ?? null;
}
