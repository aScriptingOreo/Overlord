# Overlord Bot

This project is a Discord bot that monitors specific channels and performs actions based on the configuration provided in the overlord.yml file.

## How it Works

The bot is written in TypeScript and uses the discord.js-selfbot-v13 library to interact with the Discord API. The bot's behavior is defined in the bot.ts file.

When the bot starts, it reads the configuration from the overlord.yml file. This configuration includes the bot token, the owner's Discord user ID, and the webhooks and channels that the bot should monitor.

The bot then logs into Discord using the provided bot token and starts monitoring the specified channels. When a message is sent in one of these channels, the bot triggers an event and performs an action based on the message content.

## How to Modify the Configuration

The bot's configuration is stored in the overlord.yml file. Here's what each field in the configuration means:

- bot_token: This is the token of your Discord bot. You can get this token from the Discord developer portal.
- owner_id: This is an array of Discord user IDs. Only users with these IDs can use the bot's commands.
- overlord: This is an object where each key is the name of a webhook. Each webhook has the following properties:
    - url: The URL of the webhook.
    - monitored_channels: An array of channel IDs. The bot will monitor these channels for messages.

To modify the bot's configuration, simply open the overlord.yml file in a text editor and change the values as needed. Be sure to save the file when you're done.

## Running the Bot

To run the bot, you need to have Node.js and Yarn installed on your machine. Then, you can start the bot by running the following command in your terminal:

```sh
yarn run start:dev
```

This command starts the bot in development mode, which means the bot will automatically restart if you make changes to the bot.ts file or the overlord.yml file.

## Docker Support

This project also includes a Dockerfile for running the bot in a Docker container. To build the Docker image, run the following command in your terminal:

```sh
docker build -t overlord-bot .
```

Then, to start a container with the bot, run:

```sh
docker run -d --name overlord-bot overlord-bot
```

Please note that if you're running the bot in a Docker container, you'll need to provide the overlord.yml file and any other necessary files to the container. You can do this by using Docker volumes.
