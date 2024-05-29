module.exports = {
  name: 'mention',
  description: 'Responds when "josh," "joshua," or "joshua apostol" is mentioned',
  nashPrefix: false,
  execute(api, event, args) {
    const message = event.body.toLowerCase();
    if (message.includes('josh') || message.includes('joshua') || message.includes('joshua apostol')) {
      api.sendMessage("Don't call my master, dude", event.threadID, event.messageID);
    }
  },
};
