const axios = require('axios');

module.exports = {
    name: 'gpt',
    author: 'joshua Apostol',//Credit to the Api owner Rui
    description: 'Query GPT-4o for a response.',
    nashPrefix: true,
    execute: async (api, event, args) => {
        const input = args.join(' ');

        if (!input) {
            api.sendMessage('Please provide a query for GPT-4o.', event.threadID, event.messageID);
            return;
        }

        try {
            const response = await axios.get(`https://ruiapi.onrender.com/api/gpt4o?q=${encodeURIComponent(input)}`);
            const output = response.data.message;

            api.sendMessage(output, event.threadID, event.messageID);
        } catch (error) {
            console.error('Error querying GPT-4:', error);
            api.sendMessage('An error occurred while processing your request. Please try again later.', event.threadID, event.messageID);
        }
    }
};
