'use client';

import { useComments } from '@/lib/hooks';
import { Comment as CommentIcon, Delete, Send } from '@mui/icons-material';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import {
  alpha,
  Avatar,
  Box,
  Button,
  CircularProgress,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { format } from 'date-fns';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

interface Props {
  incidentId: number;
}

export function CommentsSection({ incidentId }: Props) {
  const { data: session } = useSession();
  const [newComment, setNewComment] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editText, setEditText] = useState('');

  const { comments, addComment, updateComment, deleteComment } = useComments(incidentId);

  useEffect(() => {
    setExpanded(comments.length > 0);
  }, [comments.length]);

  const handleSubmit = async () => {
    if (!newComment.trim()) return;

    setSubmitting(true);
    try {
      await addComment(newComment);
      setNewComment('');
      setExpanded(true);
    } catch (error) {
      console.error('Error posting comment:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: number) => {
    if (!confirm('Delete this comment?')) return;
    try {
      await deleteComment(commentId);
    } catch (error) {
      console.error('Error deleting comment:', error);
    }
  };

  const handleStartEdit = (commentId: number, currentText: string) => {
    setEditingId(commentId);
    setEditText(currentText);
  };

  const handleCancelEdit = () => {
    setEditingId(null);
    setEditText('');
  };

  const handleSaveEdit = async (commentId: number) => {
    if (!editText.trim()) return;

    try {
      await updateComment(commentId, editText);
      setEditingId(null);
      setEditText('');
    } catch (error) {
      console.error('Error updating comment:', error);
    }
  };

  return (
    <Paper
      elevation={1}
      sx={{
        p: 2,
        mb: 2,
        borderRadius: 2,
        background: (theme) => theme.palette.background.paper,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          pb: 1.5,
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
          cursor: 'pointer',
          userSelect: 'none',
        }}
        onClick={() => setExpanded((prev) => !prev)}
      >
        <CommentIcon color="primary" sx={{ fontSize: 20 }} />
        <Typography
          variant="subtitle1"
          fontWeight={600}
          sx={{ flex: 1, color: 'text.primary' }}
        >
          Comments
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {comments.length}
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
        <>
          <Stack spacing={1.5} sx={{ mt: 2, mb: 2 }}>
            {comments.length === 0 ? (
              <Typography variant="caption" color="text.secondary" textAlign="center" py={1}>
                No comments yet
              </Typography>
            ) : (
              comments.map((comment) => (
                <Box
                  key={comment.id}
                  sx={{
                    p: 1.5,
                    borderRadius: 1.5,
                    border: (theme) => `1px solid ${theme.palette.divider}`,
                    transition: 'bgcolor 0.2s',
                    '&:hover': {
                      bgcolor: (theme) => alpha(theme.palette.primary.light, 0.05),
                    },
                  }}
                >
                  <Stack direction="row" spacing={1.5} alignItems="flex-start">
                    <Avatar
                      src={comment.user?.profilePicture || undefined}
                      alt={
                        comment.user
                          ? `${comment.user.firstName ?? ''} ${comment.user.lastName ?? ''}`
                          : ''
                      }
                      sx={{
                        width: 32,
                        height: 32,
                        bgcolor: (theme) => theme.palette.primary.main,
                        fontSize: 12,
                        flexShrink: 0,
                      }}
                    >
                      {comment.user?.firstName?.[0] || '?'}
                    </Avatar>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                      <Stack direction="row" justifyContent="space-between" alignItems="flex-start" gap={1}>
                        <Box>
                          <Typography variant="caption" fontWeight={700} display="block" sx={{ color: 'text.primary' }}>
                            {comment.user
                              ? `${comment.user.firstName ?? ''} ${comment.user.lastName ?? ''}`
                              : 'Unknown'}
                          </Typography>
                          <Typography variant="caption" color="text.secondary" display="block">
                            {format(new Date(comment.createdAt), 'MMM dd, yyyy HH:mm')}
                          </Typography>
                        </Box>
                        <Stack direction="row" alignItems="center" gap={0.5}>
                          <Typography variant="caption" color="text.secondary" sx={{ textAlign: 'right', minWidth: 'max-content' }}>
                            {format(new Date(comment.createdAt), 'HH:mm')}
                          </Typography>
                          {comment.userId?.toString() === session?.user?.id && (
                            <MoreVertMenu
                              onDelete={() => handleDelete(comment.id)}
                              onEdit={() => handleStartEdit(comment.id, comment.comment)}
                            />
                          )}
                        </Stack>
                      </Stack>

                      {editingId === comment.id ? (
                        <Stack spacing={1} sx={{ mt: 1 }}>
                          <TextField
                            fullWidth
                            multiline
                            minRows={2}
                            value={editText}
                            onChange={(e) => setEditText(e.target.value)}
                            variant="outlined"
                            size="small"
                            autoFocus
                            sx={{
                              '& .MuiOutlinedInput-root': {
                                fontSize: 13,
                                borderRadius: 1.5,
                              },
                            }}
                          />
                          <Stack direction="row" spacing={1} justifyContent="flex-end">
                            <Button
                              size="small"
                              variant="outlined"
                              onClick={handleCancelEdit}
                              sx={{ textTransform: 'none' }}
                            >
                              Cancel
                            </Button>
                            <Button
                              size="small"
                              variant="contained"
                              onClick={() => handleSaveEdit(comment.id)}
                              disabled={!editText.trim()}
                              sx={{ textTransform: 'none' }}
                            >
                              Save
                            </Button>
                          </Stack>
                        </Stack>
                      ) : (
                        <Typography
                          variant="body2"
                          sx={{
                            mt: 0.75,
                            whiteSpace: 'pre-wrap',
                            color: 'text.primary',
                            fontSize: 13,
                          }}
                        >
                          {comment.comment}
                        </Typography>
                      )}
                    </Box>
                  </Stack>
                </Box>
              ))
            )}
          </Stack>

          <Stack direction="row" spacing={1.5} alignItems="flex-start">
            <Avatar
              src={session?.user?.image || undefined}
              alt={session?.user?.name || ''}
              sx={{
                width: 32,
                height: 32,
                bgcolor: (theme) => theme.palette.primary.main,
                fontSize: 12,
                flexShrink: 0,
              }}
            >
              {session?.user?.name?.[0]}
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <TextField
                fullWidth
                multiline
                minRows={2}
                placeholder="Add a comment..."
                value={newComment}
                onChange={(e) => setNewComment(e.target.value)}
                variant="outlined"
                size="small"
                sx={{
                  '& .MuiOutlinedInput-root': {
                    fontSize: 13,
                    borderRadius: 1.5,
                    paddingRight: 0,
                  },
                }}
                InputProps={{
                  endAdornment: (
                    <Button
                      variant="contained"
                      startIcon={<Send sx={{ fontSize: 16 }} />}
                      onClick={handleSubmit}
                      disabled={submitting || !newComment.trim()}
                      size="small"
                      sx={{
                        fontWeight: 600,
                        textTransform: 'none',
                        boxShadow: 'none',
                        borderRadius: 1,
                        ml: 1,
                        minWidth: 80,
                      }}
                    >
                      {submitting ? 'Posting...' : 'Post'}
                    </Button>
                  ),
                  sx: { alignItems: 'flex-end' },
                }}
              />
            </Box>
          </Stack>
        </>
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
          Edit
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
