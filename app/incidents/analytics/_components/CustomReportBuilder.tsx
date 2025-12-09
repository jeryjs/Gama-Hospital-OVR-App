'use client';

import { useState } from 'react';
import {
    alpha,
    Box,
    Button,
    Checkbox,
    Chip,
    Divider,
    FormControlLabel,
    IconButton,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Paper,
    Skeleton,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import {
    Build,
    DragIndicator,
    Add,
    Remove,
    Save,
    Refresh,
    BarChart,
    PieChart,
    Timeline,
    TableChart,
    Map,
    Assessment,
} from '@mui/icons-material';

interface CustomReportBuilderProps {
    loading?: boolean;
}

// Available metrics
const availableMetrics = [
    { id: 'trend', label: 'Incident Trend', icon: <Timeline fontSize="small" />, category: 'charts' },
    { id: 'status', label: 'Status Distribution', icon: <PieChart fontSize="small" />, category: 'charts' },
    { id: 'location', label: 'Location Comparison', icon: <BarChart fontSize="small" />, category: 'charts' },
    { id: 'severity', label: 'Severity Heatmap', icon: <TableChart fontSize="small" />, category: 'charts' },
    { id: 'map', label: 'Hotspot Map', icon: <Map fontSize="small" />, category: 'charts' },
    { id: 'response', label: 'Response Times', icon: <Assessment fontSize="small" />, category: 'metrics' },
    { id: 'compliance', label: 'Compliance Rate', icon: <Assessment fontSize="small" />, category: 'metrics' },
    { id: 'actions', label: 'Corrective Actions', icon: <Assessment fontSize="small" />, category: 'metrics' },
    { id: 'users', label: 'User Activity', icon: <Assessment fontSize="small" />, category: 'tables' },
    { id: 'departments', label: 'Department Performance', icon: <TableChart fontSize="small" />, category: 'tables' },
];

export function CustomReportBuilder({ loading = false }: CustomReportBuilderProps) {
    const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['trend', 'status', 'compliance']);
    const [reportName, setReportName] = useState('My Custom Report');

    const handleToggleMetric = (metricId: string) => {
        setSelectedMetrics((prev) =>
            prev.includes(metricId)
                ? prev.filter((id) => id !== metricId)
                : [...prev, metricId]
        );
    };

    const handleRemoveMetric = (metricId: string) => {
        setSelectedMetrics((prev) => prev.filter((id) => id !== metricId));
    };

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

    const categories = [
        { id: 'charts', label: 'Charts & Visualizations' },
        { id: 'metrics', label: 'Key Metrics' },
        { id: 'tables', label: 'Data Tables' },
    ];

    return (
        <Paper sx={{ p: 3, height: '100%' }}>
            <Stack spacing={3}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Build color="primary" />
                    <Typography variant="h6" fontWeight={600}>
                        Custom Report Builder
                    </Typography>
                </Stack>

                <Typography variant="body2" color="text.secondary">
                    Select metrics to include in your custom report dashboard
                </Typography>

                {/* Report Name */}
                <TextField
                    label="Report Name"
                    value={reportName}
                    onChange={(e) => setReportName(e.target.value)}
                    size="small"
                    fullWidth
                />

                <Divider />

                {/* Available Metrics */}
                <Box>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        Available Metrics
                    </Typography>

                    {categories.map((category) => (
                        <Box key={category.id} sx={{ mb: 2 }}>
                            <Typography variant="caption" color="text.secondary" fontWeight={600}>
                                {category.label}
                            </Typography>
                            <Stack direction="row" flexWrap="wrap" gap={1} mt={1}>
                                {availableMetrics
                                    .filter((m) => m.category === category.id)
                                    .map((metric) => {
                                        const isSelected = selectedMetrics.includes(metric.id);
                                        return (
                                            <Chip
                                                key={metric.id}
                                                icon={metric.icon}
                                                label={metric.label}
                                                onClick={() => handleToggleMetric(metric.id)}
                                                onDelete={isSelected ? () => handleRemoveMetric(metric.id) : undefined}
                                                deleteIcon={isSelected ? <Remove fontSize="small" /> : undefined}
                                                sx={{
                                                    bgcolor: isSelected
                                                        ? (theme) => alpha(theme.palette.primary.main, 0.15)
                                                        : 'transparent',
                                                    borderColor: isSelected ? 'primary.main' : 'divider',
                                                    color: isSelected ? 'primary.main' : 'text.secondary',
                                                    fontWeight: isSelected ? 600 : 400,
                                                    '&:hover': {
                                                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                                                    },
                                                }}
                                                variant={isSelected ? 'filled' : 'outlined'}
                                            />
                                        );
                                    })}
                            </Stack>
                        </Box>
                    ))}
                </Box>

                <Divider />

                {/* Selected Metrics (Drag & Drop placeholder) */}
                <Box>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        Selected Metrics ({selectedMetrics.length})
                    </Typography>

                    {selectedMetrics.length === 0 ? (
                        <Box
                            sx={{
                                p: 3,
                                borderRadius: 2,
                                border: 2,
                                borderStyle: 'dashed',
                                borderColor: 'divider',
                                textAlign: 'center',
                            }}
                        >
                            <Typography variant="body2" color="text.secondary">
                                No metrics selected. Click on metrics above to add them.
                            </Typography>
                        </Box>
                    ) : (
                        <List dense disablePadding>
                            {selectedMetrics.map((metricId, index) => {
                                const metric = availableMetrics.find((m) => m.id === metricId);
                                if (!metric) return null;

                                return (
                                    <ListItem
                                        key={metricId}
                                        sx={{
                                            mb: 0.5,
                                            borderRadius: 1,
                                            bgcolor: (theme) => alpha(theme.palette.background.default, 0.5),
                                            border: 1,
                                            borderColor: 'divider',
                                        }}
                                        secondaryAction={
                                            <IconButton
                                                size="small"
                                                onClick={() => handleRemoveMetric(metricId)}
                                                sx={{ color: 'error.main' }}
                                            >
                                                <Remove fontSize="small" />
                                            </IconButton>
                                        }
                                    >
                                        <ListItemIcon sx={{ minWidth: 32 }}>
                                            <Tooltip title="Drag to reorder">
                                                <DragIndicator fontSize="small" sx={{ color: 'text.disabled', cursor: 'grab' }} />
                                            </Tooltip>
                                        </ListItemIcon>
                                        <ListItemIcon sx={{ minWidth: 32 }}>
                                            {metric.icon}
                                        </ListItemIcon>
                                        <ListItemText
                                            primary={metric.label}
                                            primaryTypographyProps={{ variant: 'body2', fontWeight: 500 }}
                                        />
                                        <Chip
                                            label={index + 1}
                                            size="small"
                                            sx={{ mr: 1, minWidth: 24, fontWeight: 600 }}
                                        />
                                    </ListItem>
                                );
                            })}
                        </List>
                    )}
                </Box>

                {/* Actions */}
                <Stack direction="row" spacing={1}>
                    <Button
                        variant="contained"
                        startIcon={<Save />}
                        disabled={selectedMetrics.length === 0}
                        fullWidth
                    >
                        Save Report
                    </Button>
                    <Button
                        variant="outlined"
                        startIcon={<Refresh />}
                        onClick={() => setSelectedMetrics([])}
                    >
                        Reset
                    </Button>
                </Stack>

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
                        💡 Saved reports will appear in your dashboard for quick access.
                        Drag and drop to reorder metrics in your report layout.
                    </Typography>
                </Box>
            </Stack>
        </Paper>
    );
}
