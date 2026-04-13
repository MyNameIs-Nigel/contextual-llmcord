export const DEFAULT_MODEL_CHOICE = '__default__';

export const MODEL_CHOICES = Object.freeze([
  Object.freeze({
    name: 'Z.AI GLM 4.5 Air',
    value: 'z-ai/glm-4.5-air:free',
  }),
  Object.freeze({
    name: 'NVIDIA Nemotron 3 Super 120B',
    value: 'nvidia/nemotron-3-super-120b-a12b:free',
  }),
  Object.freeze({
    name: 'Google Gemma 4 26B',
    value: 'google/gemma-4-26b-a4b-it:free',
  }),
  Object.freeze({
    name: 'Liquid LFM 2.5 1.2B',
    value: 'liquid/lfm-2.5-1.2b-instruct:free',
  }),
]);

const SUPPORTED_MODELS = new Set(MODEL_CHOICES.map((choice) => choice.value));

/**
 * @param {string} model
 * @returns {boolean}
 */
export function isSupportedModel(model) {
  return SUPPORTED_MODELS.has(model);
}

/**
 * @param {string} model
 * @returns {string}
 */
export function getModelDisplayName(model) {
  const match = MODEL_CHOICES.find((choice) => choice.value === model);
  return match?.name ?? model;
}

/**
 * @returns {{ name: string; value: string }[]}
 */
export function getModelChoices() {
  return MODEL_CHOICES.map((choice) => ({ ...choice }));
}
