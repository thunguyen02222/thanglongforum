import { createContext } from 'react';

export type ISocketContext = {
  getSocket: () => any;
  socket: any;
  socketStatus: string;
  connected: () => boolean;
};

export const SocketContext = createContext<ISocketContext>({
  getSocket() {
    return null;
  },
  socketStatus: '',
  socket: null,
  connected() {
    return false;
  }
});

