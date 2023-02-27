// https://nodejs.org/en/knowledge/command-line/how-to-prompt-for-command-line-input/

const dotenv = require('dotenv');
const readline = require("readline");
const axios = require('axios');

dotenv.config();

const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
});

const ask = (prompt) => {
    rl.question(prompt, function (input) {
        if (input === 'quit') {
            process.exit(0)
        } else if (input === 'tbd') {
            ask("> ")
        } else {
            console.log(input)
            ask("> ")
        }
    });
}

rl.on("close", function () {
    console.log("\nBYE BYE !!!");
    process.exit(0);
});

ask("hello > ")
