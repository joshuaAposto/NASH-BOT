const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const login = require("fca-unofficial");
const fs = require("fs");
const config = require("./config.json");

const app = new express();

const PORT = process.env.PORT || 3000;

let activeSessions = 0;
app.use(bodyParser.json());
app.use(express.static("public"));

global.NashBoT = new Object({
  commands: new Map(),
  onlineUsers: new Map(),
});

async function loadCommands() {
  const commandPath = path.join(__dirname, "commands");
  const commandFiles = await fs
    .readdirSync(commandPath)
    .filter((file) => file.endsWith(".js"));

  commandFiles.forEach((file) => {
    const cmdFile = require(path.join(commandPath, file));

    if (!cmdFile) {
      console.error(`File: ${file} does not export anything!`);
    } else if (!cmdFile.name) {
      console.error(`File: ${file} does not export a name!`);
    } else if (!cmdFile.execute) {
      console.error(`File ${file} does not export an execute function!`);
    } else {
      global.NashBoT.commands.set(
        cmdFile.name, cmdFile
      );
    }
  });
}

loadCommands();

app.post("/login", (req, res) => {
  const { 
    botState,
    prefix 
  } = req.body;

  try {
    const appState = JSON.parse(botState);
    login({
      appState 
    }, (err, api) => {
      if (err) {
        console.error("Failed to login:", err);
        return res.status(500).send("Failed to login");
      };

      const cuid = api.getCurrentUserID();
      global.NashBoT.onlineUsers.set(
        cuid, {
          userID: cuid, 
          prefix: prefix
        }
      );
    
      setupBot(api, prefix);
      res.sendStatus(200);
    });
  } catch (error) {
    console.error("Error parsing appState:", error);
    res.status(400).send("Invalid appState");
  }
});

function setupBot(api, prefix) {
  api.setOptions({ listenEvents: true });

  api.listenMqtt((err, event) => {
    if (err) {
      console.error("Error listening for messages:", err);
      return;
    }

    try {
      if (event.type === "message") {
        handleMessage(api, event, prefix);
      }
    } catch (error) {
      console.error("Error handling event:", error);
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
    command = global.NashBoT.commands.get(commandName);

    if (!command) {
      api.sendMessage(`Unknown command: ${commandName}`, event.threadID);
      return;
    }

    if (command.nashPrefix === false) {
      api.sendMessage("This command does not need a prefix.", event.threadID);
      return;
    }
  } else {
    args = event.body.trim().split(/ +/);
    commandName = args.shift().toLowerCase();
    command = commands.get(commandName);

    if (!command) {
      // Handle mention command regardless of prefix
      const mentionCommand = commands.get("mention");
      if (mentionCommand) {
        mentionCommand.execute(api, event, args);
      }
      return;
    }

    if (command.nashPrefix === true) {
      api.sendMessage("Sorry, this command needs a prefix.", event.threadID);
      return;
    }
  }

  if (command) {
    command.execute(api, event, args, prefix, commands);
  }
}

function listCommands(api, threadID) {
  let message = "Total Commands: " + commands.size + "\n\n";

  commands.forEach((command, name) => {
    message += `Command: ${name}\nDescription: ${command.description}\n\n`;
  });

  api.sendMessage(message, threadID);
}

app.get("/active-sessions", async (
  req, res
) => {
  let json = {};
  for (
    let [uid, { userID, prefix }]
    of global.NashBoT.onlineUsers
  ) {
    json[uid] = {
      userID,
      prefix
    };
  };

  res.json(json);
});

const stater = require('./stater')
app.get('/stater', async (
  req, res
) => {
  const { email, password } = req.query;

  if (!email || !password) {
    res.status(400).json({
      message: "Please provide both email and password."
    });
  } else {
    try {
      const session = await stater.getCookie(email, password, (error, fbstate) => {
        if (error) {
          res.status(500).json({
            message: "An error occured while logging in."
          });
        };

        if (fbstate) {
          res.status(200).json({
            appState: fbstate
          });
        };
      });
    } catch (error) {
      res.status(500).json({
        message: "Internal Server Error"
      });
    };
  };
});


app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
