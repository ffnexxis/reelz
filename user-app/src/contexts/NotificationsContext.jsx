import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { notificationsApi } from '../api/client';
import { useAuth } from './AuthContext';

const POLL_INTERVAL_MS = 60_000; // never poll more often than 60s (global rate limit)

const NotificationsContext = createContext(null);

export function NotificationsProvider({ children }) {
  const { user } = useAuth();
  const [unreadCount, setUnreadCount] = useState(0);

  const refresh = useCallback(async () => {
    try {
      const { data } = await notificationsApi.getUnreadCount();
      setUnreadCount(data.count ?? 0);
    } catch {
      // network/auth hiccup — keep last known count
    }
  }, []);

  useEffect(() => {
    if (!user) {
      setUnreadCount(0);
      return;
    }
    refresh();
    const timer = setInterval(refresh, POLL_INTERVAL_MS);
    return () => clearInterval(timer);
  }, [user, refresh]);

  const markAllRead = useCallback(async () => {
    try {
      await notificationsApi.markAllRead();
    } finally {
      setUnreadCount(0);
    }
  }, []);

  return (
    <NotificationsContext.Provider value={{ unreadCount, refresh, markAllRead }}>
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications() {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
}
