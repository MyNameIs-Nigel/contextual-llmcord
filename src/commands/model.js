import { PermissionFlagsBits } from 'discord.js';
import {
  clearChannelModelOverride,
  getDefaultModel,
  getSelectedModelForChannel,
  setChannelModelOverride,
} from '../channelModels.js';
import {
  DEFAULT_MODEL_CHOICE,
  getModelChoices,
  getModelDisplayName,
} from '../models.js';

function buildModelList(currentModel) {
  const choices = getModelChoices();
  if (choices.length === 0) {
    return 'No models are currently available. Set OPENROUTER_API_KEY or GOOGLE_API_KEY.';
  }

  return choices
    .map((choice) => {
      const prefix = choice.value === currentModel ? '* ' : '- ';
      return `${prefix}${choice.name} (${choice.value})`;
    })
    .join('\n');
}

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
export async function executeModelCommand(interaction) {
  const channelId = interaction.channelId;
  if (!channelId) {
    await interaction.reply({
      content: 'This command only works in a channel.',
      ephemeral: true,
    });
    return;
  }

  const requestedModel = interaction.options.getString('name');
  const currentModel = getSelectedModelForChannel(channelId);
  const defaultModel = getDefaultModel();

  if (!requestedModel) {
    await interaction.reply({
      content:
        `Current model for this channel: ${getModelDisplayName(currentModel)}\n` +
        `Model ID: ${currentModel}\n` +
        `Default model: ${defaultModel}\n\n` +
        `Available models:\n${buildModelList(currentModel)}\n\n` +
        'Use /model with a selection to change it for this channel.',
      ephemeral: true,
    });
    return;
  }

  const hasPermission = interaction.memberPermissions?.has(
    PermissionFlagsBits.ManageChannels
  );
  if (!hasPermission) {
    await interaction.reply({
      content: 'You need the Manage Channels permission to change the model for this channel.',
      ephemeral: true,
    });
    return;
  }

  if (requestedModel === DEFAULT_MODEL_CHOICE) {
    clearChannelModelOverride(channelId);
    await interaction.reply({
      content:
        `Cleared the channel override. This channel now uses the default model: ` +
        `${getModelDisplayName(defaultModel)} (${defaultModel})`,
      ephemeral: true,
    });
    return;
  }

  setChannelModelOverride(channelId, requestedModel);
  await interaction.reply({
    content:
      `Updated this channel to use ${getModelDisplayName(requestedModel)} ` +
      `(${requestedModel}).`,
    ephemeral: true,
  });
}
