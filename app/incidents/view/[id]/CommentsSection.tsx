'use client';

import { Comment as CommentIcon, Delete, Send } from '@mui/icons-material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import {
  alpha,
  Avatar,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Menu, MenuItem,
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
  // Start collapsed if empty, expanded if not empty (after fetch)
  const [expanded, setExpanded] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [incidentId]);

  useEffect(() => {
    if (!loading) {
      // If there are comments, expand automatically; otherwise, stay collapsed
      setExpanded(comments.length > 0 ? true : false);
    }
  }, [loading, comments.length]);

  const fetchComments = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/incidents/${incidentId}/comments`);
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
      const res = await fetch(`/api/incidents/${incidentId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: newComment }),
      });

      if (res.ok) {
        setNewComment('');
        fetchComments();
        setExpanded(true);
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
      const res = await fetch(`/api/incidents/${incidentId}/comments/${commentId}`, {
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
    <Paper
      elevation={3}
      sx={{
        p: { xs: 2, sm: 3 },
        mb: 3,
        borderRadius: 3,
        boxShadow: (theme) => theme.shadows[2],
        background: (theme) => theme.palette.background.paper,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          pb: 2,
          borderBottom: (theme) => `2px solid ${theme.palette.divider}`,
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={() => setExpanded((prev) => !prev)}
      >
        <CommentIcon color="primary" />
        <Typography
          variant="h6"
          fontWeight={700}
          sx={{ flex: 1, color: 'text.primary', letterSpacing: 0.2 }}
        >
          Comments & Discussion
        </Typography>
        <Button
          size="small"
          variant="text"
          sx={{ minWidth: 0, px: 1, display: { xs: 'none', sm: 'inline-flex' } }}
        >
          {expanded ? 'Hide' : 'Show'}
        </Button>
      </Box>

      {expanded && (
        loading ? (
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
                  <Paper
                    key={comment.id}
                    elevation={0}
                    sx={{
                      p: 2,
                      bgcolor: (theme) => alpha(theme.palette.primary.light, 0.08),
                      borderRadius: 2,
                      border: (theme) => `1px solid ${theme.palette.divider}`,
                      transition: 'background 0.2s',
                      '&:hover': {
                        bgcolor: (theme) => alpha(theme.palette.primary.light, 0.15),
                      },
                    }}
                  >
                    <Stack direction="row" spacing={2} alignItems="flex-start">
                      <Avatar
                        src={comment.user?.profilePicture || undefined}
                        alt={
                          comment.user
                            ? `${comment.user.firstName ?? ''} ${comment.user.lastName ?? ''}`
                            : ''
                        }
                        sx={{
                          width: 40,
                          height: 40,
                          bgcolor: (theme) => theme.palette.primary.main,
                          fontWeight: 700,
                          fontSize: 18,
                        }}
                      >
                        {comment.user?.firstName?.[0] || '?'}
                      </Avatar>
                      <Box sx={{ flex: 1 }}>
                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                          <Typography variant="subtitle2" fontWeight={600}>
                            {comment.user
                              ? `${comment.user.firstName ?? ''} ${comment.user.lastName ?? ''}`
                              : 'Unknown User'}
                          </Typography>
                          <Stack direction="row" spacing={1} alignItems="center">
                            <Typography variant="caption" color="text.secondary">
                              {format(new Date(comment.createdAt), 'MMM dd, yyyy HH:mm')}
                            </Typography>
                            {comment.userId?.toString() === session?.user?.id && (
                              <Box>
                                <IconButton
                                  size="small"
                                  aria-label="comment actions"
                                  sx={{ ml: 1 }}
                                  id={`comment-actions-${comment.id}`}
                                >
                                  <MoreVertMenu
                                    onDelete={() => handleDelete(comment.id)}
                                    onEdit={() => {
                                      // Placeholder for edit
                                    }}
                                  />
                                </IconButton>
                              </Box>
                            )}
                          </Stack>
                        </Stack>
                        <Typography
                          variant="body2"
                          sx={{
                            mt: 1,
                            whiteSpace: 'pre-wrap',
                            color: 'text.primary',
                            fontSize: 15,
                          }}
                        >
                          {comment.comment}
                        </Typography>
                      </Box>
                    </Stack>
                  </Paper>
                ))
              )}
            </Stack>

            {/* Add Comment */}
            <Paper
              elevation={0}
              sx={{
                mt: 4,
                p: 2,
                bgcolor: (theme) => alpha(theme.palette.primary.light, 0.04),
                borderRadius: 2,
              }}
            >
              <Stack direction="row" spacing={2} alignItems="flex-start">
                <Avatar
                  src={session?.user?.image || undefined}
                  alt={session?.user?.name || ''}
                  sx={{
                    width: 36,
                    height: 36,
                    bgcolor: (theme) => theme.palette.primary.main,
                    fontWeight: 700,
                    fontSize: 16,
                  }}
                >
                  {session?.user?.name?.[0]}
                </Avatar>
                <Box sx={{ flex: 1 }}>
                  <TextField
                    fullWidth
                    multiline
                    minRows={2}
                    maxRows={6}
                    label="Add a comment"
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Share your thoughts..."
                    variant="outlined"
                    size="small"
                    sx={{
                      bgcolor: 'background.paper',
                      borderRadius: 1,
                      '& .MuiOutlinedInput-root': {
                        fontSize: 15,
                      },
                    }}
                  />
                  <Stack direction="row" justifyContent="flex-end" sx={{ mt: 1 }}>
                    <Button
                      variant="contained"
                      startIcon={<Send />}
                      onClick={handleSubmit}
                      disabled={submitting || !newComment.trim()}
                      sx={{
                        minWidth: 120,
                        fontWeight: 600,
                        textTransform: 'none',
                        boxShadow: 'none',
                      }}
                    >
                      {submitting ? 'Posting...' : 'Post Comment'}
                    </Button>
                  </Stack>
                </Box>
              </Stack>
            </Paper>
          </>
        )
      )}
    </Paper>
  );

}

// 3-dot menu for comment actions

function MoreVertMenu({
  onDelete,
  onEdit,
}: {
  onDelete: () => void;
  onEdit: () => void;
}) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  return (
    <>
      <IconButton
        size="small"
        onClick={(e) => setAnchorEl(e.currentTarget)}
        aria-label="more"
      >
        <MoreVertIcon fontSize="small" />
      </IconButton>
      <Menu
        anchorEl={anchorEl}
        open={open}
        onClose={() => setAnchorEl(null)}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
        transformOrigin={{ vertical: 'top', horizontal: 'right' }}
      >
        <MenuItem
          onClick={() => {
            onEdit();
            setAnchorEl(null);
          }}
        >
          Edit (coming soon)
        </MenuItem>
        <MenuItem
          onClick={() => {
            onDelete();
            setAnchorEl(null);
          }}
          sx={{ color: 'error.main' }}
        >
          <Delete fontSize="small" sx={{ mr: 1 }} />
          Delete
        </MenuItem>
      </Menu>
    </>
  );
}
