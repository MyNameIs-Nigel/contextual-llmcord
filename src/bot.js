import {
  ActivityType,
  Client,
  Events,
  GatewayIntentBits,
} from 'discord.js';
import { config } from './config.js';
import { buildContextMessages, stripBotMention } from './context.js';
import {
  buildMemoryUserMessage,
  buildSystemPrompt,
  chat,
  parseMemoryBlock,
} from './llm.js';
import { addFacts } from './memory.js';
import { getSelectedModelForChannel } from './channelModels.js';
import { executeClearCommand } from './commands/clear.js';
import { executeModelCommand } from './commands/model.js';
import { executeMemoryCommand } from './commands/memory.js';

const inFlight = new Set();

export function setupBot() {
  const token = process.env.DISCORD_TOKEN;
  if (!token) throw new Error('DISCORD_TOKEN is not set');

  const client = new Client({
    intents: [
      GatewayIntentBits.Guilds,
      GatewayIntentBits.GuildMessages,
      GatewayIntentBits.MessageContent,
    ],
  });

  client.once(Events.ClientReady, (c) => {
    console.log('[bot] Logged in as %s', c.user.tag);
    const status = config.bot?.status_message ?? 'Mention me to chat!';
    c.user.setActivity(status, { type: ActivityType.Watching });
  });

  client.on(Events.MessageCreate, async (message) => {
    if (message.author.bot) return;
    const self = message.client.user;
    if (!self) return;
    if (!message.mentions.has(self)) return;

    if (inFlight.has(message.id)) return;
    inFlight.add(message.id);

    const stripped = stripBotMention(message);
    if (!stripped) {
      inFlight.delete(message.id);
      return;
    }

    let typingInterval = null;
    try {
      const sendTyping = () => message.channel.sendTyping().catch(() => {});
      sendTyping();
      typingInterval = setInterval(sendTyping, 9000);

      const model = getSelectedModelForChannel(message.channelId);
      /** @type {{ role: string; content: string }[]} */
      const msgs = await buildContextMessages(message, config);

      if (!config.memory.inject_in_system) {
        const last = msgs.pop();
        if (!last) throw new Error('Expected at least one context message');
        msgs.push({
          role: 'user',
          content: buildMemoryUserMessage(
            message.author.id,
            message.channelId,
            message.author.username
          ),
        });
        msgs.push(last);
      }

      const systemPrompt = buildSystemPrompt(
        message.author.id,
        message.channelId,
        message.author.username
      );

      const raw = await chat({
        model,
        systemPrompt,
        messages: msgs,
      });

      const { visible, facts } = parseMemoryBlock(raw);
      if (facts.length > 0) {
        addFacts(message.author.id, message.channelId, facts);
      }

      const ts = new Date().toISOString();
      console.log(
        '[msg] %s user=%s channel=%s model=%s new_facts=%s',
        ts,
        message.author.tag,
        message.channelId,
        model,
        facts.length
      );

      await message.reply({
        content: visible || '…',
        allowedMentions: { repliedUser: false },
      });
    } catch (err) {
      console.error('[bot] message handler error:', err);
      try {
        await message.reply({
          content: 'Sorry, something went wrong. Try again in a moment.',
          allowedMentions: { repliedUser: false },
        });
      } catch (replyErr) {
        console.error('[bot] failed to send error reply:', replyErr);
      }
    } finally {
      if (typingInterval) clearInterval(typingInterval);
      inFlight.delete(message.id);
    }
  });

  client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;
    try {
      if (interaction.commandName === 'memory') {
        await executeMemoryCommand(interaction);
        return;
      }
      if (interaction.commandName === 'clear') {
        await executeClearCommand(interaction);
        return;
      }
      if (interaction.commandName === 'model') {
        await executeModelCommand(interaction);
      }
    } catch (err) {
      console.error('[bot] interaction error:', err);
      const payload = {
        content: 'Something went wrong running that command.',
        ephemeral: true,
      };
      if (interaction.replied || interaction.deferred) {
        await interaction.followUp(payload).catch(() => {});
      } else {
        await interaction.reply(payload).catch(() => {});
      }
    }
  });

  client.login(token);
}
