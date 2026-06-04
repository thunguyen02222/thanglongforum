import { useContext, useCallback } from 'react';
import { SocketContext } from './SocketContext';

export function useSocket() {
  const { getSocket, socketStatus, connected, socket } = useContext(SocketContext);

  const emit = useCallback(
    (event: string, data?: any) => {
      const socketInstance = getSocket();
      if (socketInstance && connected()) {
        socketInstance.emit(event, data);
      }
    },
    [getSocket, connected]
  );

  const on = useCallback(
    (event: string, handler: (data: any) => void) => {
      const socketInstance = getSocket();
      if (socketInstance) {
        socketInstance.on(event, handler);
      }
      return () => {
        socketInstance?.off(event, handler);
      };
    },
    [getSocket]
  );

  const off = useCallback(
    (event: string, handler?: (data: any) => void) => {
      const socketInstance = getSocket();
      if (socketInstance) {
        socketInstance.off(event, handler);
      }
    },
    [getSocket]
  );

  return {
    socket,
    getSocket,
    socketStatus,
    connected,
    emit,
    on,
    off,
    isConnected: connected()
  };
}

export default useSocket;

