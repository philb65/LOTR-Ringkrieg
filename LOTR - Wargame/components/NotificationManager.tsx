import React, { useEffect } from 'react';
import { useGameState, useGameDispatch } from '../engine/hooks/useGameState';
import { GameStateActionType, Notification } from '../types';

// --- NotificationToast Component ---

interface NotificationToastProps {
    notification: Notification;
}

const ICONS = {
    info: 'ℹ️',
    success: '✅',
    danger: '💀',
};

const BORDER_COLORS = {
    info: 'border-blue-500',
    success: 'border-green-500',
    danger: 'border-red-500',
}

const NotificationToast: React.FC<NotificationToastProps> = ({ notification }) => {
    const dispatch = useGameDispatch();

    useEffect(() => {
        const timer = setTimeout(() => {
            dispatch({ type: GameStateActionType.REMOVE_NOTIFICATION, payload: { id: notification.id } });
        }, 20000); // Notification lasts 20 seconds

        return () => clearTimeout(timer);
    }, [notification.id, dispatch]);

    const handleClose = () => {
        dispatch({ type: GameStateActionType.REMOVE_NOTIFICATION, payload: { id: notification.id } });
    }

    return (
        <div 
            onClick={handleClose}
            className={`relative w-full max-w-sm p-4 mb-2 text-white bg-gray-800/90 border-l-4 ${BORDER_COLORS[notification.type]} rounded-r-lg shadow-lg backdrop-blur-sm animate-fade-in-down cursor-pointer`}
            role="alert"
        >
            <div className="flex items-start">
                <div className="text-xl mr-3">{ICONS[notification.type]}</div>
                <p className="flex-1">{notification.message}</p>
                <button 
                    onClick={(e) => { e.stopPropagation(); handleClose(); }}
                    className="ml-2 -mt-1 text-2xl font-bold leading-none text-gray-400 hover:text-white"
                    aria-label="Close"
                >&times;</button>
            </div>
        </div>
    );
};


// --- NotificationManager Component ---

export const NotificationManager: React.FC = () => {
    const { notifications } = useGameState();

    if (!notifications || notifications.length === 0) {
        return null;
    }

    return (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 w-full px-4 sm:w-auto">
            {notifications.map(notification => (
                <NotificationToast key={notification.id} notification={notification} />
            ))}
        </div>
    );
};