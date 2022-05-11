import { io, Socket } from 'socket.io-client';
import { ChatSocketOptions } from './interfaces';

const WS_HOST = process.env.NEXT_PUBLIC_WS_HOST;
const options: ChatSocketOptions = {
    forceNew: true,
    reconnectionAttempts: Infinity,
    timeout: 10000,
    transports: [ 'websocket' ],
}
const chatSocket: Socket = io(`${WS_HOST}/chat`, options);

export default chatSocket;