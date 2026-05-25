import { createSlice } from '@reduxjs/toolkit';

const notificationSlice = createSlice({
    name: 'notifications',
    initialState: {
        items: [],
    },
    reducers: {
        addNotification: (state, action) => {
            const notification = {
                id: action.payload.id || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`,
                title: action.payload.title || 'Notification',
                message: action.payload.message,
                type: action.payload.type || 'info',
                timestamp: action.payload.timestamp || Date.now(),
                read: false,
            };
            state.items.unshift(notification);
            if (state.items.length > 50) {
                state.items = state.items.slice(0, 50);
            }
        },
        markAllRead: (state) => {
            state.items.forEach((item) => {
                item.read = true;
            });
        },
        markRead: (state, action) => {
            const item = state.items.find((n) => n.id === action.payload);
            if (item) item.read = true;
        },
        clearNotifications: (state) => {
            state.items = [];
        },
    },
});

export const { addNotification, markAllRead, markRead, clearNotifications } = notificationSlice.actions;
export default notificationSlice.reducer;
