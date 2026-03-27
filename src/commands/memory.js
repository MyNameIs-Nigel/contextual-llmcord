import { getMemory } from '../memory.js';

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
export async function executeMemoryCommand(interaction) {
  const channelId = interaction.channelId;
  if (!channelId) {
    await interaction.reply({
      content: 'This command only works in a channel.',
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  const userId = interaction.user.id;
  const facts = getMemory(userId, channelId);

  if (facts.length === 0) {
    await interaction.editReply({
      content: "I don't have any memories of you in this channel yet.",
    });
    return;
  }

  const bullets = facts.map((f) => `• ${f}`).join('\n');
  await interaction.editReply({
    content: `Here's what I remember about you in this channel:\n${bullets}`,
  });
}
