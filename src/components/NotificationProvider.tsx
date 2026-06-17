import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { playNotificationSound } from '../constants/sounds';

interface Notification {
  id: string;
  message: string;
  type: 'success' | 'error' | 'info';
  timestamp: Date;
  isRead: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  activeNotifications: Notification[];
  unreadCount: number;
  addNotification: (message: string, type?: 'success' | 'error' | 'info') => void;
  removeNotification: (id: string) => void;
  markAllAsRead: () => void;
  markAsRead: (id: string) => void;
  clearAll: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export function NotificationProvider({ children }: { children: ReactNode }) {
  const [allNotifications, setAllNotifications] = useState<Notification[]>([]);
  const [activeNotifications, setActiveNotifications] = useState<Notification[]>([]);

  const unreadCount = allNotifications.filter(n => !n.isRead).length;

  const addNotification = useCallback((message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now().toString();
    const newNotification: Notification = { 
      id, 
      message, 
      type, 
      timestamp: new Date(),
      isRead: false 
    };

    setAllNotifications(prev => [newNotification, ...prev].slice(0, 50)); // Keep last 50
    setActiveNotifications(prev => [...prev, newNotification]);
    playNotificationSound();
    
    // Auto remove from ACTIVE/TOAST after 5 seconds
    setTimeout(() => {
      setActiveNotifications(prev => prev.filter(n => n.id !== id));
    }, 5000);
  }, []);

  const removeNotification = useCallback((id: string) => {
    setActiveNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  const markAllAsRead = useCallback(() => {
    setAllNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
  }, []);

  const markAsRead = useCallback((id: string) => {
    setAllNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
  }, []);

  const clearAll = useCallback(() => {
    setAllNotifications([]);
  }, []);

  return (
    <NotificationContext.Provider value={{ 
      notifications: allNotifications, 
      activeNotifications,
      unreadCount, 
      addNotification, 
      removeNotification,
      markAllAsRead,
      markAsRead,
      clearAll
    }}>
      {children}
    </NotificationContext.Provider>
  );
}

export function useNotifications() {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
}
