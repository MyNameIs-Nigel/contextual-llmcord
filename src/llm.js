import { config } from './config.js';
import { getMemory } from './memory.js';

/**
 * @param {string} userId
 * @param {string} channelId
 * @param {string} username
 */
export function buildSystemPrompt(userId, channelId, username) {
  const facts = getMemory(userId, channelId);
  const factsBlock = facts.length ? facts.join('\n') : 'Nothing yet.';
  const base = `${config.system_prompt}

---
Conversation context: You are in a Discord channel. Multiple users may be in this conversation.
Messages from humans are prefixed with [username].`;

  const memorySection = `Your memory of ${username} in this channel:
${factsBlock}`;

  const tail = `After your response, extract any new facts worth remembering about ${username} 
and output them in this exact format on a new line:
<memory>["fact one", "fact two"]</memory>
If no new facts, output: <memory>[]</memory>`;

  if (config.memory.inject_in_system) {
    return `${base}

${memorySection}

${tail}`;
  }

  return `${base}

${tail}`;
}

/**
 * @param {string} userId
 * @param {string} channelId
 * @param {string} username
 */
export function buildMemoryUserMessage(userId, channelId, username) {
  const facts = getMemory(userId, channelId);
  const factsBlock = facts.length ? facts.join('\n') : 'Nothing yet.';
  return `Your memory of ${username} in this channel:\n${factsBlock}`;
}

/**
 * @param {string} raw
 * @returns {{ visible: string; facts: string[] }}
 */
export function parseMemoryBlock(raw) {
  const re = /<memory>\s*([\s\S]*?)\s*<\/memory>/i;
  const m = raw.match(re);
  if (!m) {
    return { visible: raw.trim(), facts: [] };
  }
  const visible = (raw.slice(0, m.index) + raw.slice(m.index + m[0].length)).trim();
  let facts = [];
  try {
    const parsed = JSON.parse(m[1].trim());
    if (Array.isArray(parsed)) {
      facts = parsed.filter((x) => typeof x === 'string' && x.trim()).map((x) => x.trim());
    }
  } catch {
    console.warn('[llm] Malformed <memory> JSON; skipping fact extraction');
  }
  return { visible, facts };
}

/**
 * @param {{ model: string; systemPrompt: string; messages: { role: string; content: string }[] }} opts
 * @returns {Promise<string>}
 */
export async function chat({ model, systemPrompt, messages }) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) throw new Error('OPENROUTER_API_KEY is not set');

  const body = {
    model,
    messages: [{ role: 'system', content: systemPrompt }, ...messages],
  };

  const signal = AbortSignal.timeout(config.openrouter.timeout_ms);
  const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${key}`,
      'HTTP-Referer': config.openrouter.site_url,
      'X-Title': config.openrouter.site_name,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
    signal,
  });

  if (!response.ok) {
    const errText = await response.text().catch(() => '');
    throw new Error(`OpenRouter error: ${response.status} ${errText}`);
  }

  const data = await response.json();
  const content = data?.choices?.[0]?.message?.content;
  if (typeof content !== 'string') {
    throw new Error('OpenRouter returned an unexpected response shape');
  }
  return content;
}
