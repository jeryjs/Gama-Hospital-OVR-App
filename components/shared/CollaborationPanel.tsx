/**
 * @fileoverview Collaboration Panel - Internal Discussion & Activity
 * 
 * GitHub issues-style collaboration for investigations and actions
 * Supports comments, mentions, file attachments, and activity feed
 * Reusable across investigations and corrective actions
 */

'use client';

import {
    AttachFile,
    Delete,
    Edit,
    MoreVert,
    Send,
} from '@mui/icons-material';
import {
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    Chip,
    Divider,
    IconButton,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Menu,
    MenuItem,
    Paper,
    Stack,
    TextField,
    Typography,
} from '@mui/material';
import { formatDistanceToNow } from 'date-fns';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import { useComments } from '@/lib/hooks';
import type { Comment } from '@/lib/api/schemas';

export interface CollaborationPanelProps {
    resourceType: 'investigation' | 'corrective_action';
    resourceId: number;
    variant?: 'full' | 'compact';
    canComment?: boolean;
    canAttach?: boolean;
}

/**
 * Collaboration Panel Component
 * 
 * Provides internal collaboration features:
 * - Comment threads
 * - @mentions (placeholder)
 * - File attachments (placeholder)
 * - Activity timeline
 * 
 * @example
 * <CollaborationPanel
 *   resourceType="investigation"
 *   resourceId={123}
 *   variant="full"
 *   canComment={true}
 * />
 */
export function CollaborationPanel({
    resourceType,
    resourceId,
    variant = 'full',
    canComment = true,
    canAttach = false,
}: CollaborationPanelProps) {
    const { data: session } = useSession();
    const [newComment, setNewComment] = useState('');
    const [editingId, setEditingId] = useState<number | null>(null);
    const [editText, setEditText] = useState('');
    const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
    const [selectedCommentId, setSelectedCommentId] = useState<number | null>(null);

    // Note: Using incident comments temporarily - will create dedicated endpoint
    const { comments, addComment, updateComment, deleteComment } = useComments(
        `${resourceType}-${resourceId}`
    );
    const isLoading = false; // Placeholder

    const handleAddComment = async () => {
        if (!newComment.trim()) return;

        try {
            await addComment(newComment.trim());
            setNewComment('');
        } catch (error) {
            console.error('Failed to add comment:', error);
        }
    };

    const handleEditComment = async (commentId: number) => {
        if (!editText.trim()) return;

        try {
            await updateComment(commentId, editText.trim());
            setEditingId(null);
            setEditText('');
        } catch (error) {
            console.error('Failed to update comment:', error);
        }
    };

    const handleDeleteComment = async (commentId: number) => {
        if (!confirm('Delete this comment?')) return;

        try {
            await deleteComment(commentId);
            setAnchorEl(null);
        } catch (error) {
            console.error('Failed to delete comment:', error);
        }
    };

    const handleMenuOpen = (event: React.MouseEvent<HTMLElement>, commentId: number) => {
        setAnchorEl(event.currentTarget);
        setSelectedCommentId(commentId);
    };

    const handleMenuClose = () => {
        setAnchorEl(null);
        setSelectedCommentId(null);
    };

    const startEdit = (comment: Comment) => {
        setEditingId(comment.id);
        setEditText(comment.comment);
        handleMenuClose();
    };

    const isCompact = variant === 'compact';

    return (
        <Card elevation={isCompact ? 1 : 2}>
            <CardHeader
                title={
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <Typography variant="h6" fontWeight={600}>
                            Discussion
                        </Typography>
                        <Chip
                            label={comments?.length || 0}
                            size="small"
                            color="primary"
                        />
                    </Box>
                }
                subheader="Internal collaboration and activity"
                sx={{
                    bgcolor: 'primary.main',
                    color: 'primary.contrastText',
                    '& .MuiCardHeader-subheader': {
                        color: 'primary.contrastText',
                        opacity: 0.9,
                    },
                }}
            />

            <CardContent>
                {/* Comment Input */}
                {canComment && (
                    <Box sx={{ mb: 3 }}>
                        <TextField
                            multiline
                            rows={isCompact ? 2 : 3}
                            fullWidth
                            placeholder="Add a comment... (Use @ to mention team members)"
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            sx={{ mb: 1 }}
                        />
                        <Stack direction="row" spacing={1} justifyContent="space-between">
                            <Box>
                                {canAttach && (
                                    <Button
                                        size="small"
                                        startIcon={<AttachFile />}
                                        disabled
                                    >
                                        Attach File (Coming Soon)
                                    </Button>
                                )}
                            </Box>
                            <Button
                                variant="contained"
                                size="small"
                                onClick={handleAddComment}
                                disabled={!newComment.trim()}
                                startIcon={<Send />}
                            >
                                Comment
                            </Button>
                        </Stack>
                    </Box>
                )}

                <Divider sx={{ my: 2 }} />

                {/* Comments List */}
                {isLoading ? (
                    <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
                        Loading comments...
                    </Typography>
                ) : !comments || comments.length === 0 ? (
                    <Typography variant="body2" color="text.secondary" textAlign="center" py={4}>
                        No comments yet. Start the discussion!
                    </Typography>
                ) : (
                    <List sx={{ p: 0 }}>
                        {comments.map((comment, index) => {
                            const isOwnComment = comment.userId === Number(session?.user?.id);
                            const isEditing = editingId === comment.id;

                            return (
                                <Box key={comment.id}>
                                    {index > 0 && <Divider sx={{ my: 2 }} />}
                                    <ListItem
                                        alignItems="flex-start"
                                        sx={{ px: 0 }}
                                        secondaryAction={
                                            isOwnComment && !isEditing ? (
                                                <IconButton
                                                    size="small"
                                                    onClick={(e) => handleMenuOpen(e, comment.id)}
                                                >
                                                    <MoreVert fontSize="small" />
                                                </IconButton>
                                            ) : null
                                        }
                                    >
                                        <ListItemAvatar>
                                            <Avatar sx={{ bgcolor: 'primary.main' }}>
                                                {comment.user?.firstName?.[0] || '?'}
                                            </Avatar>
                                        </ListItemAvatar>
                                        <ListItemText
                                            primary={
                                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                                                    <Typography variant="subtitle2" fontWeight={600}>
                                                        {comment.user?.firstName} {comment.user?.lastName}
                                                    </Typography>
                                                    <Typography variant="caption" color="text.secondary">
                                                        {formatDistanceToNow(new Date(comment.createdAt), { addSuffix: true })}
                                                    </Typography>
                                                    {comment.updatedAt !== comment.createdAt && (
                                                        <Chip label="edited" size="small" sx={{ height: 16, fontSize: '0.65rem' }} />
                                                    )}
                                                </Box>
                                            }
                                            secondary={
                                                isEditing ? (
                                                    <Box sx={{ mt: 1 }}>
                                                        <TextField
                                                            multiline
                                                            rows={2}
                                                            fullWidth
                                                            value={editText}
                                                            onChange={(e) => setEditText(e.target.value)}
                                                            size="small"
                                                        />
                                                        <Stack direction="row" spacing={1} sx={{ mt: 1 }}>
                                                            <Button
                                                                size="small"
                                                                variant="contained"
                                                                onClick={() => handleEditComment(comment.id)}
                                                            >
                                                                Save
                                                            </Button>
                                                            <Button
                                                                size="small"
                                                                onClick={() => {
                                                                    setEditingId(null);
                                                                    setEditText('');
                                                                }}
                                                            >
                                                                Cancel
                                                            </Button>
                                                        </Stack>
                                                    </Box>
                                                ) : (
                                                    <Typography
                                                        variant="body2"
                                                        sx={{ mt: 0.5, whiteSpace: 'pre-wrap' }}
                                                    >
                                                        {comment.comment}
                                                    </Typography>
                                                )
                                            }
                                        />
                                    </ListItem>
                                </Box>
                            );
                        })}
                    </List>
                )}

                {/* Comment Actions Menu */}
                <Menu
                    anchorEl={anchorEl}
                    open={Boolean(anchorEl)}
                    onClose={handleMenuClose}
                >
                    <MenuItem
                        onClick={() => {
                            const comment = comments?.find((c) => c.id === selectedCommentId);
                            if (comment) startEdit(comment);
                        }}
                    >
                        <Edit fontSize="small" sx={{ mr: 1 }} />
                        Edit
                    </MenuItem>
                    <MenuItem
                        onClick={() => selectedCommentId && handleDeleteComment(selectedCommentId)}
                        sx={{ color: 'error.main' }}
                    >
                        <Delete fontSize="small" sx={{ mr: 1 }} />
                        Delete
                    </MenuItem>
                </Menu>
            </CardContent>
        </Card>
    );
}
