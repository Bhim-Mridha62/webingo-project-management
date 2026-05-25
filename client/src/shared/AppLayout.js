import React from 'react';
import { useDispatch } from 'react-redux';
import Sidebar from '../components/Sidebar';
import { useSocket } from '../hooks/useSocket';
import { addNotification } from '../store/slices/notificationSlice';

export const AppLayout = ({ children }) => {
    const dispatch = useDispatch();

    useSocket(null, {
        onNotification: (notification) => {
            if (notification && notification.message) {
                dispatch(addNotification(notification));
            }
        },
    });

    return (
        <div className="app-layout">
            <Sidebar />
            <main className="main-content">{children}</main>
        </div>
    );
};
