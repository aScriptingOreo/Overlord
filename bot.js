var util = require('util');
var auth = require('./auth.json');
var Discord = require('discord.js');
var _ = require("underscore");
var logger = require('winston');
logger.info('Initializing bot');
var bot = new Discord.Client();
bot.login(auth.token);

var request = require("request");

var channels = auth.channels;
var servers = auth.servers;
var consoleOutput = auth.consoleOutput;

// Debug level of logger outputs EVERYTHING
if(consoleOutput){
    logger.level = 'debug';
} else{
    // 0 level of logger outputs nothing
    logger.level = '0';
}
var servArr = [];
var chanArr = [];
var relay = true;
var timeout;

bot.on('ready', function () {
    logger.info('OVERLORD IS ONLINE');
    logger.info('Active Drone: ');
    logger.info(bot.user.username + ' - (' + bot.user.id + ')');
    bot.user.setStatus('invisible')
        .then(console.log)
        .catch(console.error);
    // Generate all channel related data
    var channelArr = bot.channels.cache.array();
    console.log(`\nAvailable channels:\n`);
    for (i in channelArr) {
        console.log(`[${channelArr[i].guild}] [${channelArr[i].name}] [${channelArr[i].id}]`);
    }
    console.log(`\n\nListening to:\n`);
    for (i in channels) {
        if (channels[i].name) {
            if (bot.channels.cache.has(channels[i].name)) {
                let tmpChan = bot.channels.cache.get(channels[i].name);
                channels[i].id = tmpChan.id;
                console.log(`Found channel ${channels[i].name} with ID ${channels[i].id}`);
                chanArr.push(channels[i].id);
                console.log(channels[i]);
                /*tmpChan.fetchMessages({ limit: 10 })
                    .then(messages => console.log(`Received ${messages.size} messages\n\n${messages.array()}`))
                    .catch(console.error);*/
            } else {
                logger.warn(`Could not find channel ${channels[i].name}`);
            }
        } else if (channels[i].id) {
            if (bot.channels.cache.has(channels[i].id)) {
                let tmpChan = bot.channels.cache.get(channels[i].id);
                console.log(tmpChan);
                console.log(tmpChan.toString);
                channels[i].name = tmpChan.name;
                console.log(`Found channel ${channels[i].name} with ID ${channels[i].id}`);
                chanArr.push(channels[i].id);
                console.log(channels[i]);
                /*tmpChan.fetchMessages({ limit: 10 })
                    .then(messages => console.log(`Received ${messages.size} messages\n\n${messages.array()}`))
                    .catch(console.error);*/
            } else {
                logger.warn(`Could not find channel name for id ${channels[i].id}`);
            }
        }
    }
    
    // generate the list of servers to grab data from
    for (i in servers) {
        if (servers[i].id) {
            // If the bot is connected to a server with a matching id
            if(bot.guilds.cache.has(servers[i].id)){
                let tmpServ = bot.guilds.cache.get(servers[i].id);
                servers[i].name = tmpServ.name;
                console.log(`ID - Found server ${servers[i].name} with ID ${servers[i].id}`);
                servArr.push(servers[i].id);
            }else {
                logger.warn(`Could not find server name for id ${servers[i].id}`);
            }
        }
    }
});

bot.on('disconnect', function (errMsg, code) {
    logger.warn(errMsg);
    logger.warn('----- Bot disconnected from Discord with code', code, 'for reason:', errMsg, '-----');
    bot.login(auth.token);
});

bot.on('channelUpdate', function (oldChannel, newChannel) {
    if(consoleOutput) console.log('[STATUS] > Channel updating...');
    if (newChannel.permissionOverwrites.has(bot.user.id)) {
        logger.warn('[STATUS] > MISSING PERMISSIONS!');
        logger.warn(newChannel.permissionOverwrites);
        relay = false;
        clearTimeout(timeout);
        timeout = setTimeout(function () {
            relay = true;
        }, 1800000);
    } else {
        if(consoleOutput) console.log('[STATUS] > CLEAR!');
    }
});

bot.on('guildMemberUpdate', function (oldMember, newMember) {
    logger.warn('[GUILD] > Member Update');
    if (newMember.id == bot.user.id) {
        delete newMember.guild;
        logger.warn(newMember);
        logger.warn('[GUILD] > DRONE HAS CHANGED!');
        relay = false;
        clearTimeout(timeout);
        timeout = setTimeout(function () {
            relay = true;
        }, 1800000);
    }
});

bot.on('message', function (message) {
    logger.debug(`[${message.guild.name}] [${message.channel.name}] [${message.author.username}] > ${message.content}`);
    
    // This code checks for the FIRST instance of the Server ID in the server list
    if(servArr.indexOf(message.guild.id) > -1){
        if(relay){
            // logger.debug('==== DEBUG ====');
            // logger.debug(util.inspect(message.attachments));
            // logger.debug(util.inspect(message.embeds));
            // logger.debug(message.type);
            // logger.debug('===============');
            
            // _.Find will only pull the FIRST result. We want ALL results.
            //var obj = _.find(channels, function (obj) { return obj.id === message.channel.id; });
            
            //_.Filter will return ALL results. This gets us ALL Webhooks to output to.
            var servObj = _.filter(servers, function (servObj) { return servObj.id === message.guild.id; });
            
            var post_data = {};
            // This posts the message under the SERVER name
            //post_data.username = message.guild.name;
            
            // This will post the message using special formatting
            if(message.member.nickname != null){
               post_data.username = `[${message.guild.name}][${message.channel.name}][${message.member.nickname}]`;
            } else {
                post_data.username = `[${message.guild.name}][${message.channel.name}][${message.member.user.tag}]`;
            }
            
            post_data.avatar_url = message.author.displayAvatarURL();

            if (message.content && message.content != '') {
                logger.info(`$`);
                post_data.content = `${message.content}`
            }

            if (message.embeds.length > 0) {
                logger.debug('==== DEBUG ====');
                logger.debug(util.inspect(message.embeds));
                logger.debug('===============');
                var embed = message.embeds[0];
                delete embed['message'];
                delete embed['createdTimestamp'];
                if (embed['image']) {
                    delete embed['image']['embed'];
                    delete embed['image']['proxyURL'];
                    delete embed['image']['height'];
                    delete embed['image']['width'];
                }
                if (embed['video'])
                    delete embed['video'];
                if (embed['provider'])
                    delete embed['provider'];
                if (embed['fields'].length < 1)
                    delete embed['fields'];
                for (var propName in embed) {
                    if (embed[propName] === null || embed[propName] === undefined || embed[propName] == []) {
                        delete embed[propName];
                    }
                }
                logger.debug(embed);
                var embedTest = { "color": "#3AA3E3", "fields": [{ "name": "name", "value": "value", "inline": false }, { "name": "name", "value": "value", "inline": true }] };
                post_data.embeds = [embed];
            }

            var attachArray = message.attachments.array();
            if (attachArray.length > 0) {
                // logger.debug(util.inspect(attachArray));
                var attach = attachArray[0];
                logger.debug(attach.url);
                post_data.content += '\n' + attach.url;
            }

            // This will loop through ALL output webhooks and send a request for each.
            for(var i = 0; i < servObj.length; i++){
                //This code creates the data for the request
                var url = servObj[i].webhook;
                var options = {
                    method: 'post',
                    body: post_data,
                    json: true,
                    url: url
                };

                // This code sends the data to the webhook
                request(options, function (err, res, body) {
                    if (err) {
                        console.error('error posting json: ', err)
                        throw err
                    }
                    
                    var headers = res.headers
                    var statusCode = res.statusCode
                    //console.log('headers: ', headers)
                    if(consoleOutput) console.log('[STATUS] > Sent ', statusCode)
                    //console.log('body: ', body)
                });
            }
        } else {
            logger.warn('==== WARN ====');
            logger.warn(`NOT SENDING MESSAGE DUE TO RELAY PROTECTION`);
            logger.warn(`[${message.guild.name}] [${message.channel.name}] [${message.author.username}] > ${message.content}`);
            logger.warn('==============');
        }
    }
    
    // This code checks for the FIRST instance of the Channel ID in the channel list
    if (chanArr.indexOf(message.channel.id) > -1) {
        if (relay) {
            // logger.debug('==== DEBUG ====');
            // logger.debug(util.inspect(message.attachments));
            // logger.debug(util.inspect(message.embeds));
            // logger.debug(message.type);
            // logger.debug('===============');
            
            // _.Find will only pull the FIRST result. We want ALL results.
            //var obj = _.find(channels, function (obj) { return obj.id === message.channel.id; });
            
            //_.Filter will return ALL results. This gets us ALL Webhooks to output to.
            var obj = _.filter(channels, function (obj) { return obj.id === message.channel.id; });

            var post_data = {};
            // This posts the message under the SERVER name
            //post_data.username = message.guild.name;
            
            // This will post the message using special formatting
            if(message.member.nickname != null){
               post_data.username = `[${message.guild.name}][${message.channel.name}][${message.member.nickname}]`;
            } else {
                post_data.username = `[${message.guild.name}][${message.channel.name}][${message.member.user.tag}]`;
            }
            
            post_data.avatar_url = message.author.displayAvatarURL();

            if (message.content && message.content != '') {
                logger.info(`$`);
                post_data.content = `${message.content}`
            }

            if (message.embeds.length > 0) {
                logger.debug('==== DEBUG ====');
                logger.debug(util.inspect(message.embeds));
                logger.debug('===============');
                var embed = message.embeds[0];
                delete embed['message'];
                delete embed['createdTimestamp'];
                if (embed['image']) {
                    delete embed['image']['embed'];
                    delete embed['image']['proxyURL'];
                    delete embed['image']['height'];
                    delete embed['image']['width'];
                }
                if (embed['video'])
                    delete embed['video'];
                if (embed['provider'])
                    delete embed['provider'];
                if (embed['fields'].length < 1)
                    delete embed['fields'];
                for (var propName in embed) {
                    if (embed[propName] === null || embed[propName] === undefined || embed[propName] == []) {
                        delete embed[propName];
                    }
                }
                logger.debug(embed);
                var embedTest = { "color": "#3AA3E3", "fields": [{ "name": "name", "value": "value", "inline": false }, { "name": "name", "value": "value", "inline": true }] };
                post_data.embeds = [embed];
            }

            var attachArray = message.attachments.array();
            if (attachArray.length > 0) {
                // logger.debug(util.inspect(attachArray));
                var attach = attachArray[0];
                logger.debug(attach.url);
                post_data.content += '\n' + attach.url;
            }

            // This will loop through ALL output webhooks and send a request for each.
            for(var i = 0; i < obj.length; i++){
                //This code creates the data for the request
                var url = obj[i].webhook;
                var options = {
                    method: 'post',
                    body: post_data,
                    json: true,
                    url: url
                };

                // This code sends the data to the webhook
                request(options, function (err, res, body) {
                    if (err) {
                        console.error('error posting json: ', err)
                        throw err
                    }
                    var headers = res.headers
                    var statusCode = res.statusCode
                    //console.log('headers: ', headers)
                    if(consoleOutput) console.log('[STATUS] > Sent ', statusCode)
                    //console.log('body: ', body)
                });
            }
        } else {
            logger.warn('==== WARN ====');
            logger.warn(`NOT SENDING MESSAGE DUE TO RELAY PROTECTION`);
            logger.warn(`[${message.guild.name}] [${message.channel.name}] [${message.author.username}] > ${message.content}`);
            logger.warn('==============');
        }
    }
});

bot.on('messageUpdate', function (oldMessage, newMessage) {
    // debugging
    logger.debug('==== DEBUG ====');
    logger.debug(`[${newMessage.channel.name}] [${newMessage.author.username}] > ${newMessage.content}`);
    if (newMessage.attachments.length > 0) {
        logger.debug(`newMessage attachments: `);
        logger.debug(util.inspect(newMessage.attachments));
    }
    logger.debug('===============');
});

bot.on('error', function (error) {
    logger.error(error);
});