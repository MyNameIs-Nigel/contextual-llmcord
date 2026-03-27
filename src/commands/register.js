import 'dotenv/config';
import { REST, Routes } from 'discord.js';

const commands = [
  {
    name: 'memory',
    description: 'View what the bot remembers about you in this channel',
  },
  {
    name: 'clear',
    description: "Clear the bot's memory of you in this channel",
  },
];

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.DISCORD_CLIENT_ID;

if (!token) {
  console.error('Missing DISCORD_TOKEN');
  process.exit(1);
}
if (!clientId) {
  console.error('Missing DISCORD_CLIENT_ID (Application ID from the Discord Developer Portal)');
  process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(token);

try {
  await rest.put(Routes.applicationCommands(clientId), { body: commands });
  console.log('Successfully registered application (/) commands.');
} catch (err) {
  console.error(err);
  process.exit(1);
}
