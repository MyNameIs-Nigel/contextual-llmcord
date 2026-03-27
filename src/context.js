/**
 * @param {import('discord.js').Message} message
 * @param {object} cfg
 */
export async function buildContextMessages(message, cfg) {
  const limit = Math.min(Math.max(1, cfg.context_window), 100);

  const fetched = await message.channel.messages.fetch({
    limit,
    before: message.id,
  });

  const sorted = [...fetched.values()].sort(
    (a, b) => a.createdTimestamp - b.createdTimestamp
  );

  /** @type {{ role: 'user' | 'assistant'; content: string }[]} */
  const out = [];

  for (const m of sorted) {
    if (m.system) continue;
    const text = (m.content ?? '').trim();
    if (!text) continue;

    if (m.author.bot) {
      out.push({ role: 'assistant', content: m.content });
    } else {
      out.push({
        role: 'user',
        content: `[${m.author.username}]: ${m.content}`,
      });
    }
  }

  const stripped = stripBotMention(message);
  out.push({
    role: 'user',
    content: `[${message.author.username}]: ${stripped}`,
  });

  return out;
}

/**
 * @param {import('discord.js').Message} message
 */
export function stripBotMention(message) {
  const id = message.client.user?.id;
  if (!id) return message.content.trim();
  let text = message.content;
  const re = new RegExp(`<@!?${id}>`, 'g');
  text = text.replace(re, '').trim();
  return text.replace(/\s+/g, ' ').trim();
}
