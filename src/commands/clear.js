import { clearMemory } from '../memory.js';

/**
 * @param {import('discord.js').ChatInputCommandInteraction} interaction
 */
export async function executeClearCommand(interaction) {
  const channelId = interaction.channelId;
  if (!channelId) {
    await interaction.reply({
      content: 'This command only works in a channel.',
      ephemeral: true,
    });
    return;
  }

  await interaction.deferReply({ ephemeral: true });

  clearMemory(interaction.user.id, channelId);

  await interaction.editReply({
    content: "Done — I've cleared my memory of you in this channel.",
  });
}
