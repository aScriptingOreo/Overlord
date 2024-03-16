import * as discord from 'discord.js-selfbot-v13';
import { readFileSync } from 'fs';
import { load } from 'js-yaml';
import express from 'express';
import { gray, green, red, blue } from 'kleur';

// Define the colors for the console logs
const chalk = { gray, green, red, blue };
const app = express();


// Load overlord.yml
let overlordConfig: any;
try {
  overlordConfig = load(readFileSync('overlord.yml', 'utf8'));
} catch (e) {
  console.log(e);
}

const bot = new discord.Client();

bot.on('ready', () => {
  if (bot.user) {
    for (let webhookName in overlordConfig.overlord) {
      let olCfgTemp = overlordConfig.overlord[webhookName];
      console.log(chalk.gray(`Monitored channels for ${chalk.blue(webhookName)}: ${chalk.green(olCfgTemp.monitored_channels)}`));
    }
    console.log(chalk.gray(`The sleeper agent ${chalk.red(bot.user.displayName)} has been activated`));
  }
});

messageCreate();


bot.login(overlordConfig.bot_token);

function getRandomPort(min: number = 55000, max: number = 56000): number {
  return Math.floor(Math.random() * (max - min + 1) + min);
}


const port = getRandomPort();

// Define a route handler for the default home page
app.get("/", (req, res) => {
  res.send("Bot is running");
});

// Start the server on port 3000
app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});



// Function to create a message event listener
function messageCreate() {
  bot.on('messageCreate', async (message) => {
    const output = `[${message.guild!.name}] [${(message.channel.type === 'GUILD_TEXT' ? message.channel.name : 'DM Channel')}]\n > ${message.author.username}`;
    for (let webhookName in overlordConfig.overlord) {
      let config = overlordConfig.overlord[webhookName];
      let isMonitored = false;
      for (let channelId of config.monitored_channels) {
  
        if (channelId == message.channel.id) {
          console.log(chalk.green(output));
          console.log(chalk.red(`Message is from a monitored channel.`));
          const webhook = new discord.WebhookClient({ url: config.url });
          const webhookOptions = {
            content: message.content,
            username: output,
            avatarURL: message.author.displayAvatarURL({ dynamic: true }),
            files: Array.from(message.attachments.values()),
            embeds: message.embeds,
          };
          // Send the message using the webhook
          webhook.send(webhookOptions);
          isMonitored = true;
          break;
        }
      }
      if (isMonitored) {
        break;
      }
    }
    let isMonitored = false;
    if (!isMonitored) {
      console.log(chalk.gray(output));
    }
  });
}