import { useEffect, useRef, useCallback } from 'react';
import { createSocketClient } from '../services/socketClient';

export const useSocket = (projectId, handlers = {}) => {
  const socketRef = useRef(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    socketRef.current = createSocketClient(token);

    const socket = socketRef.current;

    socket.on('connect', () => {
      console.log('Socket connected:', socket.id);
      if (projectId) {
        socket.emit('join_project', projectId);
      }
    });

    socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });

    socket.on('connect_error', (err) => {
      console.error('Socket connection error:', err.message);
    });

    // Register event handlers
    if (handlers.onTaskCreated) socket.on('task_created', handlers.onTaskCreated);
    if (handlers.onTaskUpdated) socket.on('task_updated', handlers.onTaskUpdated);
    if (handlers.onTaskDeleted) socket.on('task_deleted', handlers.onTaskDeleted);
    if (handlers.onNotification) socket.on('notification', handlers.onNotification);
    if (handlers.onUserJoined) socket.on('user_joined', handlers.onUserJoined);
    if (handlers.onUserLeft) socket.on('user_left', handlers.onUserLeft);

    return () => {
      if (projectId) {
        socket.emit('leave_project', projectId);
      }
      socket.disconnect();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  const emit = useCallback((event, data) => {
    if (socketRef.current) {
      socketRef.current.emit(event, data);
    }
  }, []);

  return { socket: socketRef.current, emit };
};
