import React, { useEffect, useRef, useState } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Bell, CheckCircle } from 'lucide-react';
import { markAllRead } from '../store/slices/notificationSlice';

const NotificationBell = () => {
    const dispatch = useDispatch();
    const notifications = useSelector((state) => state.notifications.items);
    const unreadCount = notifications.filter((item) => !item.read).length;
    const [open, setOpen] = useState(false);
    const ref = useRef(null);

    useEffect(() => {
        const handleClickOutside = (event) => {
            if (open && ref.current && !ref.current.contains(event.target)) {
                setOpen(false);
            }
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [open]);

    const togglePanel = () => {
        setOpen((prev) => !prev);
        if (unreadCount > 0) {
            dispatch(markAllRead());
        }
    };

    return (
        <div className="notification-bell" ref={ref}>
            <button type="button" className="notification-button" onClick={togglePanel}>
                <Bell size={20} />
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
            </button>
            {open && (
                <div className="notification-dropdown">
                    <div className="notification-dropdown-header">
                        <span>Notifications</span>
                        <button type="button" className="notification-clear" onClick={() => dispatch(markAllRead())}>
                            <CheckCircle size={14} /> Mark all read
                        </button>
                    </div>
                    <div className="notification-list">
                        {notifications.length === 0 ? (
                            <div className="notification-empty">No notifications yet.</div>
                        ) : (
                            notifications.map((notification) => (
                                <div
                                    key={notification.id}
                                    className={`notification-item ${notification.read ? 'read' : 'unread'}`}
                                >
                                    <div className="notification-item-title">{notification.title}</div>
                                    <div className="notification-item-message">{notification.message}</div>
                                    <div className="notification-item-time">
                                        {new Date(notification.timestamp).toLocaleString()}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default NotificationBell;
