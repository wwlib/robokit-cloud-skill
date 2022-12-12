import { Server as HTTPServer } from 'http'
import { Server as SocketIoServer } from 'socket.io'
import { JwtAuth } from './auth/JwtAuth'
import ConnectionManager from 'src/connection/ConnectionManager'
import { ConnectionEventType, ConnectionType } from 'src/connection/Connection'
// import ASRSessionHandler from './asr/ASRSessionHandler'
// import { ASRStreamingSessionConfig } from 'cognitiveserviceslib'
import { RCSCommand, RCSCommandType, RCSCommandName } from 'robokit-command-system'


export const setupSocketIoSkillClientServer = (httpServer: HTTPServer, path: string): SocketIoServer => {
    const ioSocketServer = new SocketIoServer(httpServer, {
        path: path,
    })

    ioSocketServer.use(function (socket: any, next: any) {
        var auth = socket.request.headers.authorization
        if (auth) {
            const token = auth.replace("Bearer ", "")
            if (!token) {
                return next(new Error('SkillClientServer: SKILL_CLIENT connection: unauthorized: Missing token.'))
            }
            let decodedAccessToken: any
            try {
                decodedAccessToken = JwtAuth.decodeAccessToken(token)
                // console.log(decodedAccessToken)
                socket.data.accountId = decodedAccessToken.accountId
            } catch (error: any) {
                // TODO: remove log and throw
                console.error(error)
                return next(new Error('SkillClientServer: SKILL_CLIENT connection: unauthorized: Invalid token.'))
            }
            return next()
        } else {
            return next(new Error("no authorization header"))
        }
    })

    ioSocketServer.on('connection', function (socket: any) {
        console.log(`SkillClientServer: on SKILL_CLIENT connection:`, socket.id)
        const connection = ConnectionManager.getInstance().addConnection(ConnectionType.SKILL_CLIENT, socket, socket.data.accountId)
        socket.emit('message', { source: 'CS:RCS', event: 'handshake', message: 'SKILL_CLIENT connection accepted' })

        socket.on('command', (command: RCSCommand) => {
            ConnectionManager.getInstance().onAnalyticsEvent(ConnectionType.SKILL_CLIENT, socket, ConnectionEventType.COMMAND_FROM, command.type)
            if (command.type === RCSCommandType.sync && command.name === RCSCommandName.syncOffset) {
                if (command.payload && typeof command.payload.syncOffset === 'number' ) {
                    if (connection) {
                        if (process.env.DEBUG_CLOCK_SYNC === 'true') {
                            console.log(`DEBUG_CLOCK_SYNC: SkillClientServer: updating syncOffset for SKILL_CLIENT socket: ${socket.id}`)
                        }
                        connection.onSyncOffset(command.payload.syncOffset)
                    }
                }
            } 
            // else {
            //     ConnectionManager.getInstance().broadcastDeviceCommandToSubscriptionsWithAccountId(socket.data.accountId, command)
            // }
        })

        socket.on('message', (messageData: any) => {
            if (process.env.DEBUG === 'true') {
                console.log(`DEBUG: SkillClientServer: on message:`, messageData, socket.id, socket.data.accountId)
            }
            ConnectionManager.getInstance().onAnalyticsEvent(ConnectionType.SKILL_CLIENT, socket, ConnectionEventType.MESSAGE_FROM, messageData.event)
            // ConnectionManager.getInstance().broadcastDeviceMessageToSubscriptionsWithAccountId(socket.data.accountId, { message: messageData })
            socket.emit('message', { source: 'CS:RCS', event: 'reply', data: {
                reply: `I'm sorry. I don't yet know how to help with: ${messageData.text}`
            } }) // TODO should be a command
        })

        socket.once('disconnect', function (reason: string) {
            console.log(`SkillClientServer: on SKILL_CLIENT disconnect: ${reason}: ${socket.id}`)
            ConnectionManager.getInstance().removeConnection(ConnectionType.DEVICE, socket)
        })

        // time sync

        socket.on('timesync', function (data: any) {
            // console.log('SKILL_CLIENT timesync message:', data)
            socket.emit('timesync', {
                id: data && 'id' in data ? data.id : null,
                result: Date.now()
            })
        })
    })

    return ioSocketServer
}
