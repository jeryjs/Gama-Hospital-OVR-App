import { apiCall } from '@/lib/client/error-handler';
import { secureFetch } from '@/lib/client/csrf';
import useSWR from 'swr';
import { useCallback, useEffect, useState } from 'react';

export interface NotificationItem {
  id: number;
  userId: number;
  event: string;
  title: string;
  body: string;
  url: string | null;
  actorUserId: number | null;
  actorEmail: string | null;
  metadata: string | null;
  isRead: boolean;
  readAt: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface NotificationsResponse {
  unreadCount: number;
  notifications: NotificationItem[];
}

export type PushRegistrationStatus = 'unsupported' | 'denied' | 'available' | 'enabled' | 'loading' | 'error';

export interface UseNotificationsReturn {
  unreadCount: number;
  notifications: NotificationItem[];
  isLoading: boolean;
  error: unknown;
  pushStatus: PushRegistrationStatus;
  mutate: () => void;
  markRead: (notificationId: number) => Promise<void>;
  markAllRead: () => Promise<void>;
  enablePushNotifications: () => Promise<void>;
}

interface PushConfigResponse {
  publicKey: string | null;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - base64String.length % 4) % 4);
  const base64 = `${base64String}${padding}`.replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)));
}

export function useNotifications(): UseNotificationsReturn {
  const [pushStatus, setPushStatus] = useState<PushRegistrationStatus>('loading');

  const fetcher = async (url: string) => {
    const { data, error } = await apiCall<NotificationsResponse>(url);
    if (error) throw error;
    return data!;
  };

  const { data, error, isLoading, mutate } = useSWR('/api/notifications', fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 15000,
    suspense: false,
  });

  // Determine initial push status once on mount
  useEffect(() => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) {
      setPushStatus('unsupported');
      return;
    }
    if (Notification.permission === 'denied') {
      setPushStatus('denied');
      return;
    }
    navigator.serviceWorker.getRegistration('/sw.js').then((registration) => {
      if (!registration) { setPushStatus('available'); return; }
      registration.pushManager.getSubscription().then((sub) => {
        setPushStatus(sub ? 'enabled' : 'available');
      });
    }).catch(() => setPushStatus('available'));
  }, []);

  const markRead = async (notificationId: number) => {
    const response = await secureFetch(`/api/notifications/${notificationId}`, { method: 'PATCH' });
    if (!response.ok) throw new Error('Failed to mark notification as read');
    mutate();
  };

  const markAllRead = async () => {
    const response = await secureFetch('/api/notifications/read-all', { method: 'POST' });
    if (!response.ok) throw new Error('Failed to mark notifications as read');
    mutate();
  };

  const enablePushNotifications = useCallback(async () => {
    if (typeof window === 'undefined' || !('serviceWorker' in navigator) || !('PushManager' in window)) return;

    setPushStatus('loading');
    try {
      const permission = await Notification.requestPermission();
      if (permission !== 'granted') { setPushStatus('denied'); return; }

      const { data: config } = await apiCall<PushConfigResponse>('/api/notifications/push-subscription');
      if (!config?.publicKey) { setPushStatus('error'); return; }

      const registration = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(config.publicKey) as unknown as ArrayBuffer,
      });

      const sub = subscription.toJSON();
      const response = await secureFetch('/api/notifications/push-subscription', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sub),
      });

      setPushStatus(response.ok ? 'enabled' : 'error');
    } catch {
      setPushStatus('error');
    }
  }, []);

  return {
    unreadCount: data?.unreadCount || 0,
    notifications: data?.notifications || [],
    isLoading,
    error,
    pushStatus,
    mutate,
    markRead,
    markAllRead,
    enablePushNotifications,
  };
}