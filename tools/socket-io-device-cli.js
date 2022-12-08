// https://nodejs.org/en/knowledge/command-line/how-to-prompt-for-command-line-input/

const dotenv = require('dotenv');
const readline = require("readline");
const axios = require('axios');
const { io } = require("socket.io-client");
const timesync = require('timesync');
const rcs = require('robokit-command-system')

dotenv.config();

/*
curl --location --request POST 'http://localhost:8083/auth' \
     --header 'Content-Type: application/json' \
     --data-raw '{
       "accountId": "device1",
       "password": "12345!"
     }'
*/

async function getToken() {
    if (process.env.TOKEN) {
        return process.env.TOKEN;
    } else if (process.env.AUTH_URL && process.env.DEVICE_ACCOUNT_ID && process.env.DEVICE_PASSWORD) {
        return new Promise((resolve, reject) => {
            axios.post(process.env.AUTH_URL, {
                accountId: process.env.DEVICE_ACCOUNT_ID,
                password: process.env.DEVICE_PASSWORD
            },
                {
                    headers: { 'Content-Type': 'application/json' }
                })
                .then(function (response) {
                    // console.log(response);
                    resolve(response.data.access_token);
                })
                .catch(function (error) {
                    console.log('CLI: error', error);
                    reject();
                });

        });
    } else {
        throw new Error('Unable to get token.');
    }
}

function connect(token) {
    // console.log(token);
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });

    console.log(`CLI: URL:`, process.env.URL);
    console.log('CLI: token:', token);
    const socket = io(process.env.URL, {
        path: process.env.DEVICE_SOCKET_PATH,
        extraHeaders: {
            Authorization: `Bearer ${token}`,
        },
        reconnection: false,
    });

    // synchronized clock

    onSynchronizedClockUpdate = (timeData) => {
        if (showTimeEvents) {
            console.log(`CLI: clockUpdate: ${timeData.simpleFormat}`)
        }
    }

    let showTimeEvents = false
    let synchronizedClock = new rcs.SynchronizedClock();
    synchronizedClock.on('1sec', onSynchronizedClockUpdate)
    synchronizedClock.startUpdate()

    // timesync

    const ts = timesync.create({
        server: socket,
        interval: 5000
    });

    ts.on('sync', function (state) {
        // console.log('timesync: sync ' + state + '');
    });

    ts.on('change', function (offset) {
        if (showTimeEvents) {
            console.log('CLI: timesync: changed offset: ' + offset + ' ms');
        }
        if (synchronizedClock) {
            synchronizedClock.onSyncOffsetChanged(offset)
        }
        const command = {
            id: 'tbd',
            type: 'sync',
            name: 'syncOffset',
            payload: {
                syncOffset: offset,
            }
        }
        socket.emit('command', command)
    });

    ts.send = function (socket, data, timeout) {
        //console.log('send', data);
        return new Promise(function (resolve, reject) {
            var timeoutFn = setTimeout(reject, timeout);

            socket.emit('timesync', data, function () {
                clearTimeout(timeoutFn);
                resolve();
            });
        });
    };

    socket.on('timesync', function (data) {
        //console.log('receive', data);
        ts.receive(null, data);
    });

    // socket messages

    socket.on("connect", () => {
        console.log('CLI: socket id', socket.id); // "G5p5..."
    });

    socket.on('disconnect', function () {
        console.log(`CLI: on disconnect. closing...`);
        if (synchronizedClock) {
            synchronizedClock.dispose()
            synchronizedClock = undefined
        }
        process.exit(0);
    });

    rcs.CommandProcessor.getInstance().on('commandCompleted', (commandAck) => {
        console.log(`CLI: command completed:`, commandAck)
        socket.emit('command', commandAck)
    })

    socket.on('command', function (command) {
        console.log('CLI: command', command);
        rcs.CommandProcessor.getInstance().processCommand(command)
        ask("> ");
    });

    socket.on('message', function (data) {
        console.log('CLI: on message', data);
        ask("> ");
    });

    const ask = (prompt) => {
        rl.question(prompt, function (input) {
            if (input === 'quit') {
                process.exit(0)
            } else if (input === 'clock') {
                showTimeEvents = !showTimeEvents
                ask("> ")
            } else {
                const messageData = {
                    source: 'CLI',
                    event: 'user-input',
                    data: { input: input }
                }
                socket.emit('message', messageData)
            }
        });
    }

    rl.on("close", function () {
        console.log("\nBYE BYE !!!");
        process.exit(0);
    });
}

async function doIt() {
    const token = await getToken();
    connect(token);
}

doIt();
