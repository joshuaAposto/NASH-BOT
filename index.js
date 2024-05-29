const express = require('express');
const bodyParser = require('body-parser');
const login = require('fca-unofficial');
const fs = require('fs');
const config = require('./config.json');

const app = express();
const PORT = process.env.PORT || 3000;

let activeSessions = 0;

// Middleware
app.use(bodyParser.json());
app.use(express.static('public'));

// Map to store commands
const commands = new Map();

// Load commands dynamically from the commands folder
fs.readdirSync('./commands').forEach(file => {
    if (file.endsWith('.js')) {
        const command = require(`./commands/${file}`);
        commands.set(command.name, command);
    }
});

app.post('/login', (req, res) => {
    const { appState: incomingAppState, prefix } = req.body;

    try {
        const parsedAppState = JSON.parse(incomingAppState);
        login({ appState: parsedAppState }, (err, api) => {
            if (err) {
                console.error('Failed to login:', err);
                return res.status(500).send('Failed to login');
            }

            // Handle login success
            console.log('Login successful!');
            activeSessions++;
            setupBot(api, prefix); // Pass the prefix to the setupBot function
            res.sendStatus(200);
        });
    } catch (error) {
        console.error('Error parsing appState:', error);
        res.status(400).send('Invalid appState');
    }
});

function setupBot(api, prefix) {
    api.setOptions({ listenEvents: true });

    // Listen for messages and events
    api.listenMqtt((err, event) => {
        if (err) {
            console.error('Error listening for messages:', err);
            return;
        }

        try {
            if (event.type === 'message') {
                handleMessage(api, event, prefix);
            } else if (event.type === 'participantAdd') {
                handleParticipantAdd(api, event);
            }
        } catch (error) {
            console.error('Error handling event:', error);
        }
    });
}

function handleMessage(api, event, prefix) {
    let args;
    let commandName;
    let command;

    if (event.body.startsWith(prefix)) {
        args = event.body.slice(prefix.length).trim().split(/ +/);
        commandName = args.shift().toLowerCase();
        command = commands.get(commandName);

        if (!command) {
            api.sendMessage(`Unknown command: ${commandName}`, event.threadID);
            return;
        }

        if (command.nashPrefix === false) {
            api.sendMessage('This command does not need a prefix.', event.threadID);
            return;
        }
    } else {
        args = event.body.trim().split(/ +/);
        commandName = args.shift().toLowerCase();
        command = commands.get(commandName);

        if (!command) {
            // Handle mention command regardless of prefix
            const mentionCommand = commands.get('mention');
            if (mentionCommand) {
                mentionCommand.execute(api, event, args);
            }
            return;
        }

        if (command.nashPrefix === true) {
            api.sendMessage('Sorry, this command needs a prefix.', event.threadID);
            return;
        }
    }

    if (command) {
        command.execute(api, event, args, prefix, commands);
    }
}

function handleParticipantAdd(api, event) {
    const newcomerName = event.participantNames[0]; // Get the name of the newcomer
    const greetingMessage = `Welcome, ${newcomerName}! 🎉`; // Create the greeting message
    api.sendMessage(greetingMessage, event.threadID); // Send the greeting message
}

function listCommands(api, threadID) {
    let message = 'Total Commands: ' + commands.size + '\n\n';

    commands.forEach((command, name) => {
        message += `Command: ${name}\nDescription: ${command.description}\n\n`;
    });

    api.sendMessage(message, threadID);
}

app.get('/active-sessions', (req, res) => {
    res.json({ activeSessions });
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
