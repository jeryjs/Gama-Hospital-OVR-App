'use client';

import {
    alpha,
    Avatar,
    Box,
    Chip,
    List,
    ListItem,
    ListItemAvatar,
    ListItemText,
    Paper,
    Skeleton,
    Stack,
    Typography,
} from '@mui/material';
import { ContentCopy, Warning } from '@mui/icons-material';

interface DateRange {
    start: Date;
    end: Date;
}

interface RepeatIncidentDetectorProps {
    dateRange: DateRange;
    loading?: boolean;
}

// Placeholder data - potential duplicate/similar incidents
const mockClusters = [
    {
        id: 1,
        pattern: 'Medication Administration Error - Wrong Dosage',
        incidents: ['OVR-2024-001', 'OVR-2024-015', 'OVR-2024-028'],
        similarity: 92,
        location: 'ICU Unit A',
        risk: 'high',
        lastOccurrence: '2024-12-05',
    },
    {
        id: 2,
        pattern: 'Patient Fall - Bathroom Area',
        incidents: ['OVR-2024-003', 'OVR-2024-019', 'OVR-2024-034', 'OVR-2024-041'],
        similarity: 88,
        location: 'Ward 3B',
        risk: 'high',
        lastOccurrence: '2024-12-08',
    },
    {
        id: 3,
        pattern: 'Equipment Malfunction - IV Pump',
        incidents: ['OVR-2024-007', 'OVR-2024-022'],
        similarity: 85,
        location: 'Multiple Locations',
        risk: 'medium',
        lastOccurrence: '2024-12-02',
    },
    {
        id: 4,
        pattern: 'Communication Gap - Handoff',
        incidents: ['OVR-2024-011', 'OVR-2024-025', 'OVR-2024-038'],
        similarity: 78,
        location: 'Emergency Dept',
        risk: 'medium',
        lastOccurrence: '2024-12-06',
    },
];

const riskColors = {
    high: '#EF4444',
    medium: '#F59E0B',
    low: '#10B981',
};

export function RepeatIncidentDetector({ dateRange, loading = false }: RepeatIncidentDetectorProps) {
    if (loading) {
        return (
            <Paper sx={{ p: 3, height: '100%' }}>
                <Stack spacing={2}>
                    <Skeleton variant="text" width={200} height={32} />
                    <Skeleton variant="rectangular" height={300} />
                </Stack>
            </Paper>
        );
    }

    const highRiskCount = mockClusters.filter((c) => c.risk === 'high').length;

    return (
        <Paper sx={{ p: 3, height: '100%' }}>
            <Stack spacing={3}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <ContentCopy color="primary" />
                        <Typography variant="h6" fontWeight={600}>
                            Repeat Incident Detector
                        </Typography>
                    </Stack>
                    {highRiskCount > 0 && (
                        <Chip
                            icon={<Warning fontSize="small" />}
                            label={`${highRiskCount} High Risk Patterns`}
                            size="small"
                            sx={{
                                bgcolor: alpha('#EF4444', 0.15),
                                color: '#EF4444',
                                fontWeight: 600,
                            }}
                        />
                    )}
                </Stack>

                <Typography variant="body2" color="text.secondary">
                    Similar incidents detected using pattern matching analysis
                </Typography>

                <List disablePadding>
                    {mockClusters.map((cluster) => (
                        <ListItem
                            key={cluster.id}
                            sx={{
                                mb: 1.5,
                                p: 2,
                                borderRadius: 2,
                                bgcolor: (theme) => alpha(theme.palette.background.default, 0.5),
                                border: 1,
                                borderColor: alpha(riskColors[cluster.risk as keyof typeof riskColors], 0.3),
                                borderLeft: 4,
                                borderLeftColor: riskColors[cluster.risk as keyof typeof riskColors],
                                transition: 'all 0.2s',
                                '&:hover': {
                                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
                                },
                            }}
                        >
                            <ListItemAvatar>
                                <Avatar
                                    sx={{
                                        bgcolor: alpha(riskColors[cluster.risk as keyof typeof riskColors], 0.15),
                                        color: riskColors[cluster.risk as keyof typeof riskColors],
                                        fontWeight: 700,
                                    }}
                                >
                                    {cluster.incidents.length}
                                </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                                primary={
                                    <Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
                                        <Typography variant="body2" fontWeight={600}>
                                            {cluster.pattern}
                                        </Typography>
                                        <Chip
                                            label={`${cluster.similarity}% match`}
                                            size="small"
                                            sx={{
                                                bgcolor: alpha('#3B82F6', 0.15),
                                                color: '#3B82F6',
                                                fontWeight: 600,
                                                height: 20,
                                                fontSize: '0.7rem',
                                            }}
                                        />
                                    </Stack>
                                }
                                secondary={
                                    <Stack spacing={0.5} mt={1}>
                                        <Typography variant="caption" color="text.secondary">
                                            📍 {cluster.location} • Last: {cluster.lastOccurrence}
                                        </Typography>
                                        <Stack direction="row" spacing={0.5} flexWrap="wrap">
                                            {cluster.incidents.map((id) => (
                                                <Chip
                                                    key={id}
                                                    label={id}
                                                    size="small"
                                                    variant="outlined"
                                                    sx={{ height: 20, fontSize: '0.65rem' }}
                                                />
                                            ))}
                                        </Stack>
                                    </Stack>
                                }
                            />
                            <Chip
                                label={cluster.risk}
                                size="small"
                                sx={{
                                    bgcolor: alpha(riskColors[cluster.risk as keyof typeof riskColors], 0.15),
                                    color: riskColors[cluster.risk as keyof typeof riskColors],
                                    fontWeight: 600,
                                    textTransform: 'capitalize',
                                }}
                            />
                        </ListItem>
                    ))}
                </List>

                {/* Integration Note */}
                <Box
                    sx={{
                        p: 2,
                        borderRadius: 1,
                        bgcolor: (theme) => alpha(theme.palette.info.main, 0.05),
                        border: 1,
                        borderColor: 'info.main',
                    }}
                >
                    <Typography variant="caption" color="info.main">
                        💡 Pattern detection uses text similarity analysis on incident descriptions.
                        Click on any pattern to view detailed comparison and root cause analysis.
                    </Typography>
                </Box>
            </Stack>
        </Paper>
    );
}
