import { apiCall } from '@/lib/client/error-handler';
import { secureFetch } from '@/lib/client/csrf';
import useSWR from 'swr';

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

export interface UseNotificationsReturn {
  unreadCount: number;
  notifications: NotificationItem[];
  isLoading: boolean;
  error: unknown;
  mutate: () => void;
  markRead: (notificationId: number) => Promise<void>;
  markAllRead: () => Promise<void>;
}

export function useNotifications(): UseNotificationsReturn {
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

  return {
    unreadCount: data?.unreadCount || 0,
    notifications: data?.notifications || [],
    isLoading,
    error,
    mutate,
    markRead,
    markAllRead,
  };
}