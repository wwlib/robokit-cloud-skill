// https://nodejs.org/en/knowledge/command-line/how-to-prompt-for-command-line-input/

const dotenv = require('dotenv');
const readline = require("readline");
const axios = require('axios');

const { Configuration, OpenAIApi } = require("openai")

dotenv.config();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const configuration = new Configuration({
    apiKey: process.env.OPENAI_API_KEY,
})
const openai = new OpenAIApi(configuration)

const ask = (prompt) => {
    rl.question(prompt, async function (input) {
        if (input === 'quit') {
            process.exit(0)
        } else if (input === 'tbd') {
            ask("> ")
        } else {
            console.log(input)

            let openAiResponse
            try {
                const completionOptions = {
                    model: process.env.GPT_MODEL,
                    prompt: input,
                    max_tokens: 100,
                    temperature: 0
                }
                // console.log('GPT3 completion options:', completionOptions)
                openAiResponse = await openai.createCompletion(completionOptions)
            } catch (error) {
                if (error.response) {
                    openAiResponse = error.response
                } else {
                    openAiResponse = error.message
                }
            }
            console.log(openAiResponse?.data?.choices[0].text)
            ask("> ")
        }
    });
}

rl.on("close", function () {
    console.log("\nBYE BYE !!!");
    process.exit(0);
});

ask("hello > ")
