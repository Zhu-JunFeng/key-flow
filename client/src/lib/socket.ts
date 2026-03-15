import { io, Socket } from 'socket.io-client';

const URL = import.meta.env.PROD ? '' : 'http://localhost:3001';

export const socket: Socket = io(URL, {
  autoConnect: false,
  transports: ['websocket', 'polling'],
});

export function connectSocket(): void {
  if (!socket.connected) {
    socket.connect();
  }
}

export function disconnectSocket(): void {
  if (socket.connected) {
    socket.disconnect();
  }
}
