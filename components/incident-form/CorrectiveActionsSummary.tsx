/**
 * @fileoverview Corrective Actions Summary - Display action items with progress
 * 
 * Shows corrective actions with assignees, status, due dates, and completion progress
 */

'use client';

import type { CorrectiveActionWithUsers } from '@/lib/api/schemas';
import {
    Avatar,
    Box,
    Chip,
    LinearProgress,
    Paper,
    Stack,
    Typography,
    alpha,
} from '@mui/material';
import { RichTextPreview, type EditorValue } from '@/components/editor';
import {
    Task as TaskIcon,
    CheckCircle as CheckIcon,
    Schedule as ScheduleIcon,
    Warning as WarningIcon,
} from '@mui/icons-material';
import { format, isPast, isToday } from 'date-fns';

interface CorrectiveActionsSummaryProps {
    actions: CorrectiveActionWithUsers[];
}

/**
 * Get status color for action
 */
function getStatusColor(status: string, dueDate: Date | string | null): 'success' | 'error' | 'warning' | 'default' {
    if (status === 'closed') return 'success';

    if (dueDate) {
        const due = new Date(dueDate);
        if (isPast(due) && !isToday(due)) return 'error';
        if (isToday(due)) return 'warning';
    }

    return 'default';
}

/**
 * Helper to parse rich text value from string or EditorValue
 */
function parseRichTextValue(value: unknown): EditorValue | undefined {
    if (!value) return undefined;
    if (typeof value === 'string') {
        try {
            return JSON.parse(value);
        } catch {
            return undefined;
        }
    }
    return value as EditorValue;
}

/**
 * Corrective Actions Summary Component
 * Displays all corrective actions with progress tracking
 */
export function CorrectiveActionsSummary({ actions }: CorrectiveActionsSummaryProps) {
    if (!actions?.length) return null;

    const completed = actions.filter((a) => a.status === 'closed').length;
    const progress = (completed / actions.length) * 100;
    const overdue = actions.filter((a) => {
        if (a.status === 'closed') return false;
        if (!a.dueDate) return false;
        const due = new Date(a.dueDate);
        return isPast(due) && !isToday(due);
    }).length;

    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                mb: 3,
                borderRadius: 2,
                bgcolor: alpha('#6366F1', 0.05),
                border: '1px solid',
                borderColor: alpha('#6366F1', 0.2),
            }}
        >
            <Stack
                direction="row"
                spacing={1}
                alignItems="center"
                justifyContent="space-between"
                sx={{ mb: 2 }}
            >
                <Stack direction="row" spacing={1} alignItems="center">
                    <TaskIcon sx={{ color: 'primary.main' }} />
                    <Typography variant="h6" fontWeight={600}>
                        Corrective Actions
                    </Typography>
                </Stack>
                <Stack direction="row" spacing={1}>
                    {overdue > 0 && (
                        <Chip
                            icon={<WarningIcon sx={{ fontSize: 16 }} />}
                            label={`${overdue} Overdue`}
                            color="error"
                            size="small"
                        />
                    )}
                    <Chip
                        icon={<CheckIcon sx={{ fontSize: 16 }} />}
                        label={`${completed}/${actions.length} Complete`}
                        color={progress === 100 ? 'success' : 'default'}
                        size="small"
                    />
                </Stack>
            </Stack>

            <LinearProgress
                variant="determinate"
                value={progress}
                sx={{
                    mb: 2,
                    borderRadius: 1,
                    height: 6,
                    bgcolor: alpha('#6366F1', 0.1),
                    '& .MuiLinearProgress-bar': {
                        bgcolor: progress === 100 ? 'success.main' : 'primary.main',
                    },
                }}
            />

            <Stack spacing={1.5}>
                {actions.map((action) => {
                    const assignees = action.assigneeUsers || [];
                    const statusColor = getStatusColor(action.status, action.dueDate);
                    const isOverdue = statusColor === 'error';

                    return (
                        <Box
                            key={action.id}
                            sx={{
                                p: 2,
                                bgcolor: 'background.paper',
                                borderRadius: 1,
                                border: '1px solid',
                                borderColor: isOverdue ? 'error.main' : 'divider',
                            }}
                        >
                            <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                    <Typography fontWeight={600} noWrap>
                                        {action.title}
                                    </Typography>

                                    {/* Assignees */}
                                    {assignees.length > 0 && (
                                        <Stack direction="row" spacing={0.5} alignItems="center" sx={{ mt: 0.5 }}>
                                            {assignees.slice(0, 3).map((assignee) => (
                                                <Avatar
                                                    key={assignee.id}
                                                    src={assignee.profilePicture || undefined}
                                                    sx={{ width: 20, height: 20, fontSize: 10 }}
                                                >
                                                    {assignee.firstName?.[0] || '?'}
                                                </Avatar>
                                            ))}
                                            {assignees.length > 3 && (
                                                <Typography variant="caption" color="text.secondary">
                                                    +{assignees.length - 3}
                                                </Typography>
                                            )}
                                            <Typography variant="caption" color="text.secondary" sx={{ ml: 0.5 }}>
                                                {assignees.length === 1
                                                    ? `${assignees[0].firstName || ''} ${assignees[0].lastName || ''}`.trim()
                                                    : `${assignees.length} assignees`}
                                            </Typography>
                                        </Stack>
                                    )}

                                    {/* Description snippet */}
                                    {action.description && (
                                        <Box
                                            sx={{
                                                mt: 0.5,
                                                overflow: 'hidden',
                                                '& > div': {
                                                    display: '-webkit-box',
                                                    WebkitLineClamp: 1,
                                                    WebkitBoxOrient: 'vertical',
                                                    overflow: 'hidden',
                                                }
                                            }}
                                        >
                                            <RichTextPreview
                                                value={parseRichTextValue(action.description)}
                                                emptyText=""
                                            />
                                        </Box>
                                    )}
                                </Box>

                                <Stack direction="row" spacing={1} alignItems="center" sx={{ ml: 2, flexShrink: 0 }}>
                                    {action.dueDate && (
                                        <Chip
                                            icon={<ScheduleIcon sx={{ fontSize: 14 }} />}
                                            label={format(new Date(action.dueDate), 'MMM d')}
                                            size="small"
                                            variant="outlined"
                                            color={statusColor}
                                        />
                                    )}
                                    <Chip
                                        label={action.status === 'closed' ? 'Closed' : 'Open'}
                                        size="small"
                                        color={action.status === 'closed' ? 'success' : 'default'}
                                    />
                                </Stack>
                            </Stack>
                        </Box>
                    );
                })}
            </Stack>
        </Paper>
    );
}
