import React, { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { SOCKET_URL } from '../config';
import { useAuth } from './AuthContext';
import { showLocalAlert } from '../utils/notifications';
import { ROLES } from '../config';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { user } = useAuth();
  const socketRef = useRef(null);
  const [connected, setConnected] = useState(false);
  const [lastAlert, setLastAlert] = useState(null);

  const connect = useCallback(() => {
    if (socketRef.current?.connected) return;

    const socket = io(SOCKET_URL, {
      transports: ['websocket'],
      reconnection: true,
      reconnectionDelay: 2000,
      reconnectionAttempts: 10,
    });

    socket.on('connect', () => {
      setConnected(true);
      if (user?.role === ROLES.POLICE) {
        socket.emit('join_officer_room', user.id);
      } else if (user?.role === ROLES.ADMIN) {
        socket.emit('join_admin_room');
      }
    });

    socket.on('disconnect', () => setConnected(false));

    socket.on('new_alert', (data) => {
      setLastAlert({ ...data, receivedAt: Date.now() });
      showLocalAlert(data).catch(() => {});
    });

    socket.on('officer_alert', (data) => {
      setLastAlert({ ...data, receivedAt: Date.now() });
      showLocalAlert(data).catch(() => {});
    });

    socket.on('admin_alert', (data) => {
      setLastAlert({ ...data, receivedAt: Date.now() });
      showLocalAlert(data).catch(() => {});
    });

    socketRef.current = socket;
  }, [user]);

  const disconnect = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setConnected(false);
  }, []);

  useEffect(() => {
    if (user) {
      connect();
    } else {
      disconnect();
    }
    return () => disconnect();
  }, [user?.id]);

  return (
    <SocketContext.Provider value={{ connected, lastAlert, socket: socketRef.current }}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
