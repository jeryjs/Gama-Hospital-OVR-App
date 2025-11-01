'use client';

import { Comment as CommentIcon, Delete, Send } from '@mui/icons-material';
import {
  alpha,
  Avatar,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { format } from 'date-fns';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';
import type { Comment } from '../../_shared/types';

interface Props {
  incidentId: number;
}

export function CommentsSection({ incidentId }: Props) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [incidentId]);

  const fetchComments = async () => {
    try {
      const res = await fetch(`/api/incidents/view/${incidentId}/comments`);
      if (res.ok) {
        const data = await res.json();
        setComments(data);
      }
    } catch (error) {
      console.error('Error fetching comments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/incidents/view/${incidentId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      });

      if (res.ok) {
        setNewComment('');
        fetchComments();
      }
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!confirm('Delete this comment?')) return;

    try {
      const res = await fetch(`/api/incidents/view/${incidentId}/comments/${commentId}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        fetchComments();
      }
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography
        variant="h6"
        fontWeight={700}
        gutterBottom
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          pb: 2,
          borderBottom: (theme) => `2px solid ${theme.palette.divider}`,
        }}
      >
        <CommentIcon /> Comments & Discussion
      </Typography>

      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
          <CircularProgress />
        </Box>
      ) : (
        <>
          {/* Comments List */}
          <Stack spacing={2} sx={{ mt: 3 }}>
            {comments.length === 0 ? (
              <Typography variant="body2" color="text.secondary" textAlign="center" py={2}>
                No comments yet. Be the first to comment!
              </Typography>
            ) : (
              comments.map((comment) => (
                <Box
                  key={comment.id}
                  sx={{
                    p: 2,
                    bgcolor: (theme) => alpha(theme.palette.background.default, 0.5),
                    borderRadius: 1,
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Stack direction="row" spacing={2}>
                    <Avatar
                      src={comment.user.profilePicture || undefined}
                      alt={`${comment.user.firstName} ${comment.user.lastName}`}
                    >
                      {comment.user.firstName[0]}
                    </Avatar>
                    <Box sx={{ flex: 1 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="subtitle2" fontWeight={600}>
                          {comment.user.firstName} {comment.user.lastName}
                        </Typography>
                        <Stack direction="row" spacing={1} alignItems="center">
                          <Typography variant="caption" color="text.secondary">
                            {format(new Date(comment.createdAt), 'MMM dd, yyyy HH:mm')}
                          </Typography>
                          {comment.userId.toString() === session?.user?.id && (
                            <IconButton size="small" onClick={() => handleDelete(comment.id)}>
                              <Delete fontSize="small" />
                            </IconButton>
                          )}
                        </Stack>
                      </Stack>
                      <Typography variant="body2" sx={{ mt: 1, whiteSpace: 'pre-wrap' }}>
                        {comment.content}
                      </Typography>
                    </Box>
                  </Stack>
                </Box>
              ))
            )}
          </Stack>

          {/* Add Comment */}
          <Box sx={{ mt: 3 }}>
            <TextField
              fullWidth
              multiline
              rows={3}
              label="Add a comment"
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Share your thoughts..."
            />
            <Button
              variant="contained"
              startIcon={<Send />}
              onClick={handleSubmit}
              disabled={submitting || !newComment.trim()}
              sx={{ mt: 2 }}
            >
              {submitting ? 'Posting...' : 'Post Comment'}
            </Button>
          </Box>
        </>
      )}
    </Paper>
  );
}
