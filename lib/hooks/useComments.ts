import { apiCall } from '@/lib/client/error-handler';
import type { CommentWithUser } from '@/lib/types';
import useSWR from 'swr';

export interface UseCommentsReturn {
  comments: CommentWithUser[];
  isError: boolean;
  error: any;
  mutate: () => void;
  addComment: (comment: string) => Promise<CommentWithUser>;
  updateComment: (commentId: number, comment: string) => Promise<void>;
  deleteComment: (commentId: number) => Promise<void>;
}

/**
 * Hook to fetch and manage incident comments
 * @example
 * const { comments, isLoading, addComment } = useComments(123);
 * await addComment('Great work!');
 */
export function useComments(incidentId: number | string | null | undefined): UseCommentsReturn {
  const url = incidentId ? `/api/incidents/${incidentId}/comments` : null;

  // Fetcher function
  const fetcher = async (url: string) => {
    const { data, error } = await apiCall<CommentWithUser[]>(url);

    if (error) {
      throw error;
    }

    return data!;
  };

  const { data, error, mutate } = useSWR(url, fetcher, {
    revalidateOnFocus: false,
    dedupingInterval: 1000,
    suspense: true,
  });

  // Add comment
  const addComment = async (comment: string) => {
    if (!url) throw new Error('Incident ID is required');

    const { data: newComment, error } = await apiCall(url, {
      method: 'POST',
      body: JSON.stringify({ comment }),
    });

    if (error) {
      throw error;
    }

    // Optimistic update
    mutate();

    return newComment as CommentWithUser;
  };

  // Update comment
  const updateComment = async (commentId: number, comment: string) => {
    if (!incidentId) throw new Error('Incident ID is required');

    const { error } = await apiCall(`/api/incidents/${incidentId}/comments/${commentId}`, {
      method: 'PATCH',
      body: JSON.stringify({ comment }),
    });

    if (error) {
      throw error;
    }

    // Optimistic update
    mutate();
  };

  // Delete comment
  const deleteComment = async (commentId: number) => {
    if (!incidentId) throw new Error('Incident ID is required');

    const { error } = await apiCall(`/api/incidents/${incidentId}/comments/${commentId}`, {
      method: 'DELETE',
    });

    if (error) {
      throw error;
    }

    // Optimistic update
    mutate();
  };

  return {
    comments: data || [],
    isError: !!error,
    error,
    mutate,
    addComment,
    updateComment,
    deleteComment,
  };
}
