module.exports = {
  name: 'author',
  description: 'Displays information about the script\'s usage policy and author.',
  nashPrefix: true,
  execute(api, event, args, prefix, commands) {
    const config = require('../config.json');
    const { author, description } = config;
    
    const message = `📜 Copyright Information 📜\n\nAuthor: ${author}\nDescription: ${description}`;
    api.sendMessage(message, event.threadID);
  },
};
