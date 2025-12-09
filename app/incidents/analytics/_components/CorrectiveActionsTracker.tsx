'use client';

import {
    alpha,
    Box,
    Chip,
    CircularProgress,
    Divider,
    LinearProgress,
    List,
    ListItem,
    ListItemText,
    Paper,
    Skeleton,
    Stack,
    Typography,
} from '@mui/material';
import { CheckCircle, Schedule, Warning, Error as ErrorIcon, Task } from '@mui/icons-material';

interface DateRange {
    start: Date;
    end: Date;
}

interface CorrectiveActionsTrackerProps {
    dateRange: DateRange;
    loading?: boolean;
}

// Placeholder data
const mockData = {
    total: 45,
    completed: 28,
    inProgress: 12,
    overdue: 5,
    upcoming: [
        { id: 1, title: 'Safety protocol update', dueDate: '2024-12-15', priority: 'high' },
        { id: 2, title: 'Equipment maintenance check', dueDate: '2024-12-18', priority: 'medium' },
        { id: 3, title: 'Staff training completion', dueDate: '2024-12-20', priority: 'low' },
    ],
};

const statusConfig = {
    completed: { color: '#10B981', icon: <CheckCircle fontSize="small" />, label: 'Completed' },
    inProgress: { color: '#3B82F6', icon: <Schedule fontSize="small" />, label: 'In Progress' },
    overdue: { color: '#EF4444', icon: <ErrorIcon fontSize="small" />, label: 'Overdue' },
};

const priorityColors = {
    high: '#EF4444',
    medium: '#F59E0B',
    low: '#10B981',
};

export function CorrectiveActionsTracker({ dateRange, loading = false }: CorrectiveActionsTrackerProps) {
    const completionRate = Math.round((mockData.completed / mockData.total) * 100);

    if (loading) {
        return (
            <Paper sx={{ p: 3, height: '100%' }}>
                <Stack spacing={2}>
                    <Skeleton variant="text" width={200} height={32} />
                    <Skeleton variant="circular" width={120} height={120} sx={{ mx: 'auto' }} />
                    <Skeleton variant="rectangular" height={100} />
                </Stack>
            </Paper>
        );
    }

    return (
        <Paper sx={{ p: 3, height: '100%' }}>
            <Stack spacing={3}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Task color="primary" />
                    <Typography variant="h6" fontWeight={600}>
                        Corrective Actions Tracker
                    </Typography>
                </Stack>

                {/* Completion Donut */}
                <Stack direction="row" spacing={3} alignItems="center">
                    <Box sx={{ position: 'relative', display: 'inline-flex' }}>
                        <CircularProgress
                            variant="determinate"
                            value={100}
                            size={100}
                            thickness={8}
                            sx={{ color: (theme) => alpha(theme.palette.grey[300], 0.3) }}
                        />
                        <CircularProgress
                            variant="determinate"
                            value={completionRate}
                            size={100}
                            thickness={8}
                            sx={{
                                color: '#10B981',
                                position: 'absolute',
                                left: 0,
                            }}
                        />
                        <Box
                            sx={{
                                top: 0,
                                left: 0,
                                bottom: 0,
                                right: 0,
                                position: 'absolute',
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                flexDirection: 'column',
                            }}
                        >
                            <Typography variant="h5" fontWeight={700}>
                                {completionRate}%
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                                Complete
                            </Typography>
                        </Box>
                    </Box>

                    {/* Status Breakdown */}
                    <Stack spacing={1} flex={1}>
                        {Object.entries(statusConfig).map(([key, config]) => {
                            const count = mockData[key as keyof typeof mockData] as number;
                            const percentage = Math.round((count / mockData.total) * 100);

                            return (
                                <Box key={key}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center" mb={0.5}>
                                        <Stack direction="row" spacing={0.5} alignItems="center">
                                            <Box sx={{ color: config.color }}>{config.icon}</Box>
                                            <Typography variant="body2">{config.label}</Typography>
                                        </Stack>
                                        <Typography variant="body2" fontWeight={600}>
                                            {count}
                                        </Typography>
                                    </Stack>
                                    <LinearProgress
                                        variant="determinate"
                                        value={percentage}
                                        sx={{
                                            height: 6,
                                            borderRadius: 3,
                                            bgcolor: alpha(config.color, 0.1),
                                            '& .MuiLinearProgress-bar': {
                                                bgcolor: config.color,
                                                borderRadius: 3,
                                            },
                                        }}
                                    />
                                </Box>
                            );
                        })}
                    </Stack>
                </Stack>

                <Divider />

                {/* Upcoming Due */}
                <Box>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        Upcoming Due Dates
                    </Typography>
                    <List dense disablePadding>
                        {mockData.upcoming.map((action) => (
                            <ListItem
                                key={action.id}
                                disablePadding
                                sx={{
                                    py: 1,
                                    px: 1.5,
                                    borderRadius: 1,
                                    mb: 0.5,
                                    bgcolor: (theme) => alpha(theme.palette.background.default, 0.5),
                                    '&:hover': {
                                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
                                    },
                                }}
                            >
                                <ListItemText
                                    primary={action.title}
                                    secondary={`Due: ${action.dueDate}`}
                                    primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                                    secondaryTypographyProps={{ variant: 'caption' }}
                                />
                                <Chip
                                    label={action.priority}
                                    size="small"
                                    sx={{
                                        bgcolor: alpha(priorityColors[action.priority as keyof typeof priorityColors], 0.15),
                                        color: priorityColors[action.priority as keyof typeof priorityColors],
                                        fontWeight: 600,
                                        fontSize: '0.7rem',
                                        height: 20,
                                    }}
                                />
                            </ListItem>
                        ))}
                    </List>
                </Box>

                {/* Overdue Alert */}
                {mockData.overdue > 0 && (
                    <Box
                        sx={{
                            p: 1.5,
                            borderRadius: 1,
                            bgcolor: alpha('#EF4444', 0.1),
                            border: 1,
                            borderColor: alpha('#EF4444', 0.3),
                        }}
                    >
                        <Stack direction="row" spacing={1} alignItems="center">
                            <Warning sx={{ color: '#EF4444', fontSize: 20 }} />
                            <Typography variant="body2" color="error.main" fontWeight={500}>
                                {mockData.overdue} overdue action{mockData.overdue > 1 ? 's' : ''} requiring attention
                            </Typography>
                        </Stack>
                    </Box>
                )}
            </Stack>
        </Paper>
    );
}
