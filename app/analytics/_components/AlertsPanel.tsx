'use client';

import React, { useState } from 'react';
import {
    Paper,
    Box,
    Typography,
    Alert,
    AlertTitle,
    Collapse,
    IconButton,
    Badge,
    Skeleton,
    Chip,
    Button,
} from '@mui/material';
import {
    ExpandMore,
    ExpandLess,
    TrendingUp,
    Schedule,
    Warning,
    NotificationsActive,
    Refresh,
} from '@mui/icons-material';

interface AlertsPanelProps {
    loading?: boolean;
    maxAlerts?: number;
}

interface AlertData {
    id: string;
    severity: 'error' | 'warning' | 'info' | 'success';
    title: string;
    message: string;
    timestamp: Date;
    type: 'spike' | 'overdue' | 'pattern' | 'compliance';
    actionable?: boolean;
}

// Placeholder data
const placeholderAlerts: AlertData[] = [
    {
        id: '1',
        severity: 'error',
        title: 'Sudden Spike Detected',
        message: 'Fall incidents increased by 150% in Emergency Department over the last 7 days.',
        timestamp: new Date(2025, 11, 8, 14, 30),
        type: 'spike',
        actionable: true,
    },
    {
        id: '2',
        severity: 'warning',
        title: 'Overdue Corrective Actions',
        message: '8 corrective actions are past their due date across 5 departments.',
        timestamp: new Date(2025, 11, 8, 10, 15),
        type: 'overdue',
        actionable: true,
    },
    {
        id: '3',
        severity: 'warning',
        title: 'High-Risk Pattern Identified',
        message: 'Medication errors cluster detected during shift changes (6AM-8AM).',
        timestamp: new Date(2025, 11, 7, 16, 45),
        type: 'pattern',
        actionable: true,
    },
    {
        id: '4',
        severity: 'info',
        title: 'Compliance Notice',
        message: '3 incident reports pending supervisor review for more than 48 hours.',
        timestamp: new Date(2025, 11, 7, 9, 0),
        type: 'compliance',
        actionable: false,
    },
    {
        id: '5',
        severity: 'success',
        title: 'Improvement Trend',
        message: 'Pressure injury incidents reduced by 35% compared to last quarter.',
        timestamp: new Date(2025, 11, 6, 11, 30),
        type: 'pattern',
        actionable: false,
    },
];

const AlertIcon = ({ type }: { type: AlertData['type'] }) => {
    switch (type) {
        case 'spike':
            return <TrendingUp />;
        case 'overdue':
            return <Schedule />;
        case 'pattern':
            return <Warning />;
        case 'compliance':
            return <NotificationsActive />;
        default:
            return <Warning />;
    }
};

const formatTimeAgo = (date: Date): string => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return 'Just now';
};

export default function AlertsPanel({
    loading = false,
    maxAlerts = 5,
}: AlertsPanelProps) {
    const [expanded, setExpanded] = useState(true);
    const alerts = placeholderAlerts.slice(0, maxAlerts);

    const criticalCount = alerts.filter(a => a.severity === 'error').length;
    const warningCount = alerts.filter(a => a.severity === 'warning').length;

    if (loading) {
        return (
            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                }}
            >
                <Skeleton variant="text" width="40%" height={32} sx={{ mb: 2 }} />
                {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton
                        key={i}
                        variant="rectangular"
                        height={80}
                        sx={{ mb: 1, borderRadius: 1 }}
                    />
                ))}
            </Paper>
        );
    }

    if (alerts.length === 0) {
        return (
            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                    textAlign: 'center',
                }}
            >
                <NotificationsActive sx={{ fontSize: 48, color: 'text.disabled', mb: 1 }} />
                <Typography variant="h6" color="text.secondary">
                    No Active Alerts
                </Typography>
                <Typography variant="body2" color="text.secondary">
                    All systems operating normally
                </Typography>
            </Paper>
        );
    }

    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
            }}
        >
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Badge badgeContent={criticalCount} color="error">
                        <Typography variant="h6" fontWeight="bold">
                            Alerts & Anomalies
                        </Typography>
                    </Badge>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {criticalCount > 0 && (
                        <Chip label={`${criticalCount} Critical`} size="small" color="error" />
                    )}
                    {warningCount > 0 && (
                        <Chip label={`${warningCount} Warning`} size="small" color="warning" />
                    )}
                    <IconButton size="small" onClick={() => setExpanded(!expanded)}>
                        {expanded ? <ExpandLess /> : <ExpandMore />}
                    </IconButton>
                </Box>
            </Box>

            <Collapse in={expanded}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1.5 }}>
                    {alerts.map((alert) => (
                        <Alert
                            key={alert.id}
                            severity={alert.severity}
                            icon={<AlertIcon type={alert.type} />}
                            sx={{
                                borderRadius: 1,
                                '& .MuiAlert-message': { width: '100%' },
                                transition: 'all 0.2s ease-in-out',
                                '&:hover': {
                                    transform: 'translateX(4px)',
                                },
                            }}
                            action={
                                alert.actionable && (
                                    <Button
                                        color="inherit"
                                        size="small"
                                        sx={{ whiteSpace: 'nowrap' }}
                                    >
                                        View Details
                                    </Button>
                                )
                            }
                        >
                            <AlertTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                <span>{alert.title}</span>
                                <Typography variant="caption" color="text.secondary">
                                    {formatTimeAgo(alert.timestamp)}
                                </Typography>
                            </AlertTitle>
                            <Typography variant="body2">
                                {alert.message}
                            </Typography>
                        </Alert>
                    ))}
                </Box>
            </Collapse>

            <Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
                <Button
                    startIcon={<Refresh />}
                    size="small"
                    color="inherit"
                >
                    Refresh Alerts
                </Button>
            </Box>
        </Paper>
    );
}
