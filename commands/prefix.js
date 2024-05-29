module.exports = {
  name: 'prefix',
  description: 'Replies with the prefix',
  execute(api, event, args, prefix) { // Add prefix as a parameter
    try {
      api.sendMessage(`The current prefix is: ${prefix}`, event.threadID);
    } catch (error) {
      console.error('Error executing command:', error);
      api.sendMessage('An error occurred while executing the command.', event.threadID);
    }
  },
};
