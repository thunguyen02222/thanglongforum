import { authService } from '@services/auth.service';
import getConfig from 'next/config';
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import SocketIO from 'socket.io-client';
import { useCurrentUserStore } from 'src/stores';

import { SocketContext } from './SocketContext';

type ISocketProps = {
  children: ReactNode;
};

function Socket({ children }: ISocketProps) {
  const { currentUser } = useCurrentUserStore();
  const loggedIn = !!currentUser;

  const socket = useRef<any>(null);
  const hasConnected = useRef(false);

  const [socketState, setSocketState] = useState<any>(null);
  const [socketStatus, setSocketStatus] = useState('initialized');

  const login = () => {
    if (!socket.current) return false;

    const token = authService.getToken();
    return socket.current.emit('auth/login', { token });
  };

  const connectSocket = () => {
    const token = authService.getToken();

    const defaultOptions = {
      reconnection: true,
      reconnectionAttempts: Infinity,
      reconnectionDelay: 1 * 1000,
      reconnectionDelayMax: 10 * 1000,
      autoConnect: true,
      transports: ['websocket', 'polling', 'long-polling'],
      rejectUnauthorized: true
    };

    const options = {
      ...defaultOptions,
      query: token ? { token } : {}
    } as any;

    const { publicRuntimeConfig: config } = getConfig();
    const socketUrl = config.API_ENDPOINT as string;

    socket.current = SocketIO(socketUrl, options) as any;
    setSocketState(socket.current);

    socket.current.status = 'initialized';
    setSocketStatus('initialized');

    socket.current.on('connect', () => {
      socket.current.status = 'connected';
      setSocketStatus('connected');

      login();
    });

    socket.current.on('disconnect', () => {
      socket.current.status = 'disconnected';
      setSocketStatus('disconnected');
    });

    socket.current.on('error', () => {
      socket.current.status = 'failed';
      setSocketStatus('failed');
    });

    socket.current.on('reconnect', () => {
      socket.current.status = 'connected';
      setSocketStatus('connected');

      login();
    });

    socket.current.on('reconnecting', () => {
      socket.current.status = 'reconnecting';
      setSocketStatus('reconnecting');
    });

    socket.current.on('reconnect_failed', () => {
      socket.current.status = 'failed';
      setSocketStatus('failed');
    });
  };

  const getSocket = () => socket.current;

  const connected = () => socketStatus === 'connected';

  const socketValue = useMemo(
    () => ({
      socket: socketState,
      getSocket,
      socketStatus,
      connected
    }),
    [socketState, socketStatus]
  );

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (!loggedIn || hasConnected.current) return;

    hasConnected.current = true;

    connectSocket();

    return () => {
      if (socket.current?.readyState) socket.current.close();
      hasConnected.current = false;
    };
  }, [loggedIn]);

  return <SocketContext.Provider value={socketValue as any}>{children}</SocketContext.Provider>;
}

export default Socket;
