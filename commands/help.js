module.exports = {
  name: 'help',
  description: 'Displays information about available commands',
  nashPrefix: false,
  execute(api, event, args, prefix, commands) {
    const helpMessage = generateHelpMessage(commands);
    api.sendMessage(helpMessage, event.threadID);
  },
};

function generateHelpMessage(commands) {
    let helpMessage = 'Here are the available commands:\n\n';

    commands.forEach((command, name) => {
        helpMessage += `Command: ${name}\nDescription: ${command.description}\n\n`;
    });

    return helpMessage;
}
