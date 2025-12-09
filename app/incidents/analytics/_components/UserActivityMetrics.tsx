'use client';

import { useState } from 'react';
import {
    Paper,
    Typography,
    Box,
    Skeleton,
    Avatar,
    Chip,
    Tabs,
    Tab,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    useTheme,
    alpha,
} from '@mui/material';
import {
    Edit as ReporterIcon,
    Search as InvestigatorIcon,
    Verified as ReviewerIcon,
    EmojiEvents as TrophyIcon,
} from '@mui/icons-material';

interface DateRange {
    start: Date;
    end: Date;
}

interface ReportFilters {
    locations: number[];
    departments: number[];
    statuses: string[];
    categories: string[];
}

interface UserActivityMetricsProps {
    dateRange: DateRange;
    filters: ReportFilters;
    loading?: boolean;
}

interface UserActivity {
    id: number;
    name: string;
    initials: string;
    count: number;
    department: string;
    trend: 'up' | 'down' | 'stable';
}

const reporters: UserActivity[] = [
    { id: 1, name: 'Sarah Johnson', initials: 'SJ', count: 34, department: 'ICU', trend: 'up' },
    { id: 2, name: 'Michael Chen', initials: 'MC', count: 28, department: 'ED', trend: 'stable' },
    { id: 3, name: 'Emily Davis', initials: 'ED', count: 24, department: 'Surgery', trend: 'up' },
    { id: 4, name: 'James Wilson', initials: 'JW', count: 19, department: 'Pediatrics', trend: 'down' },
    { id: 5, name: 'Lisa Anderson', initials: 'LA', count: 16, department: 'Radiology', trend: 'stable' },
];

const investigators: UserActivity[] = [
    { id: 1, name: 'Dr. Robert Kim', initials: 'RK', count: 22, department: 'QI', trend: 'up' },
    { id: 2, name: 'Dr. Amanda White', initials: 'AW', count: 18, department: 'Safety', trend: 'stable' },
    { id: 3, name: 'Dr. Thomas Brown', initials: 'TB', count: 15, department: 'Risk', trend: 'up' },
    { id: 4, name: 'Dr. Jennifer Lee', initials: 'JL', count: 12, department: 'QI', trend: 'down' },
    { id: 5, name: 'Dr. David Martinez', initials: 'DM', count: 9, department: 'Safety', trend: 'stable' },
];

const reviewers: UserActivity[] = [
    { id: 1, name: 'Nancy Taylor', initials: 'NT', count: 45, department: 'QI Lead', trend: 'up' },
    { id: 2, name: 'Patricia Moore', initials: 'PM', count: 38, department: 'Safety Officer', trend: 'stable' },
    { id: 3, name: 'Richard Clark', initials: 'RC', count: 31, department: 'Risk Manager', trend: 'up' },
    { id: 4, name: 'Sandra Lewis', initials: 'SL', count: 27, department: 'QI', trend: 'stable' },
    { id: 5, name: 'Kevin Walker', initials: 'KW', count: 21, department: 'Compliance', trend: 'down' },
];

const tabConfig = [
    { label: 'Reporters', icon: <ReporterIcon />, data: reporters, color: 'primary' },
    { label: 'Investigators', icon: <InvestigatorIcon />, data: investigators, color: 'secondary' },
    { label: 'Reviewers', icon: <ReviewerIcon />, data: reviewers, color: 'success' },
];

export default function UserActivityMetrics({
    dateRange,
    filters,
    loading = false,
}: UserActivityMetricsProps) {
    const theme = useTheme();
    const [activeTab, setActiveTab] = useState(0);

    if (loading) {
        return (
            <Paper sx={{ p: 3, height: '100%' }}>
                <Skeleton variant="text" width="60%" height={32} />
                <Skeleton variant="rectangular" height={48} sx={{ mt: 2 }} />
                {Array.from({ length: 5 }).map((_, i) => (
                    <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 2, mt: 2 }}>
                        <Skeleton variant="circular" width={40} height={40} />
                        <Box sx={{ flex: 1 }}>
                            <Skeleton variant="text" width="60%" />
                            <Skeleton variant="text" width="40%" />
                        </Box>
                    </Box>
                ))}
            </Paper>
        );
    }

    const currentData = tabConfig[activeTab].data;
    const maxCount = Math.max(...currentData.map((u) => u.count));
    const tabColor = tabConfig[activeTab].color as 'primary' | 'secondary' | 'success';

    return (
        <Paper sx={{ p: 3, height: '100%' }}>
            <Typography variant="h6" fontWeight={600} gutterBottom>
                User Activity Metrics
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                Top contributors by role
            </Typography>

            <Tabs
                value={activeTab}
                onChange={(_, v) => setActiveTab(v)}
                variant="fullWidth"
                sx={{ mb: 2, borderBottom: 1, borderColor: 'divider' }}
            >
                {tabConfig.map((tab, index) => (
                    <Tab
                        key={tab.label}
                        icon={tab.icon}
                        label={tab.label}
                        iconPosition="start"
                        sx={{ minHeight: 48 }}
                    />
                ))}
            </Tabs>

            <List disablePadding>
                {currentData.map((user, index) => (
                    <ListItem
                        key={user.id}
                        sx={{
                            px: 1,
                            py: 1.5,
                            borderRadius: 1,
                            mb: 0.5,
                            transition: 'background-color 0.2s',
                            '&:hover': { bgcolor: 'action.hover' },
                        }}
                    >
                        <Box sx={{ position: 'relative', mr: 2 }}>
                            <ListItemAvatar sx={{ minWidth: 'auto' }}>
                                <Avatar
                                    sx={{
                                        bgcolor: alpha(theme.palette[tabColor].main, 0.15),
                                        color: theme.palette[tabColor].main,
                                        fontWeight: 600,
                                    }}
                                >
                                    {user.initials}
                                </Avatar>
                            </ListItemAvatar>
                            {index === 0 && (
                                <TrophyIcon
                                    sx={{
                                        position: 'absolute',
                                        top: -6,
                                        right: -6,
                                        fontSize: 18,
                                        color: 'warning.main',
                                    }}
                                />
                            )}
                        </Box>

                        <ListItemText
                            primary={
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Typography variant="body2" fontWeight={500}>
                                        {user.name}
                                    </Typography>
                                    {index < 3 && (
                                        <Chip
                                            label={`#${index + 1}`}
                                            size="small"
                                            sx={{
                                                height: 18,
                                                fontSize: '0.65rem',
                                                fontWeight: 700,
                                                bgcolor:
                                                    index === 0
                                                        ? 'warning.main'
                                                        : index === 1
                                                            ? 'grey.400'
                                                            : '#cd7f32',
                                                color: 'white',
                                            }}
                                        />
                                    )}
                                </Box>
                            }
                            secondary={user.department}
                            secondaryTypographyProps={{ variant: 'caption' }}
                        />

                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            {/* Mini bar */}
                            <Box
                                sx={{
                                    width: 60,
                                    height: 6,
                                    borderRadius: 3,
                                    bgcolor: alpha(theme.palette[tabColor].main, 0.1),
                                    overflow: 'hidden',
                                }}
                            >
                                <Box
                                    sx={{
                                        width: `${(user.count / maxCount) * 100}%`,
                                        height: '100%',
                                        bgcolor: theme.palette[tabColor].main,
                                        borderRadius: 3,
                                    }}
                                />
                            </Box>
                            <Chip
                                label={user.count}
                                size="small"
                                color={tabColor}
                                sx={{ fontWeight: 600, minWidth: 40 }}
                            />
                        </Box>
                    </ListItem>
                ))}
            </List>

            <Box
                sx={{
                    mt: 2,
                    pt: 2,
                    borderTop: 1,
                    borderColor: 'divider',
                    display: 'flex',
                    justifyContent: 'space-between',
                }}
            >
                <Typography variant="caption" color="text.secondary">
                    Total {tabConfig[activeTab].label.toLowerCase()}:{' '}
                    {currentData.reduce((sum, u) => sum + u.count, 0)}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    Showing top 5
                </Typography>
            </Box>
        </Paper>
    );
}
