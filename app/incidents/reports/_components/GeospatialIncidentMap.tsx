'use client';

import {
    alpha,
    Box,
    Button,
    Chip,
    Paper,
    Skeleton,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import { Map, Room, Layers, Info } from '@mui/icons-material';

interface DateRange {
    start: Date;
    end: Date;
}

interface GeospatialIncidentMapProps {
    dateRange: DateRange;
    loading?: boolean;
}

// Placeholder hotspot data
const mockHotspots = [
    { id: 1, name: 'ICU Unit A', incidents: 12, x: 25, y: 30, severity: 'high' },
    { id: 2, name: 'Emergency Dept', incidents: 18, x: 60, y: 45, severity: 'high' },
    { id: 3, name: 'Ward 3B', incidents: 8, x: 40, y: 70, severity: 'medium' },
    { id: 4, name: 'Pharmacy', incidents: 5, x: 75, y: 25, severity: 'low' },
    { id: 5, name: 'Radiology', incidents: 3, x: 15, y: 60, severity: 'low' },
    { id: 6, name: 'Operating Room', incidents: 7, x: 50, y: 20, severity: 'medium' },
];

const severityColors = {
    high: '#EF4444',
    medium: '#F59E0B',
    low: '#10B981',
};

export function GeospatialIncidentMap({ dateRange, loading = false }: GeospatialIncidentMapProps) {
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

    const maxIncidents = Math.max(...mockHotspots.map((h) => h.incidents));

    return (
        <Paper sx={{ p: 3, height: '100%' }}>
            <Stack spacing={3}>
                <Stack direction="row" alignItems="center" justifyContent="space-between">
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Map color="primary" />
                        <Typography variant="h6" fontWeight={600}>
                            Incident Hotspot Map
                        </Typography>
                    </Stack>
                    <Chip
                        icon={<Info fontSize="small" />}
                        label="Integration Ready"
                        size="small"
                        color="info"
                        variant="outlined"
                    />
                </Stack>

                {/* Map Placeholder */}
                <Box
                    sx={{
                        position: 'relative',
                        height: 300,
                        borderRadius: 2,
                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.02),
                        border: 2,
                        borderColor: 'divider',
                        borderStyle: 'dashed',
                        overflow: 'hidden',
                    }}
                >
                    {/* Grid lines for visual effect */}
                    {[20, 40, 60, 80].map((pos) => (
                        <Box
                            key={`h-${pos}`}
                            sx={{
                                position: 'absolute',
                                left: 0,
                                right: 0,
                                top: `${pos}%`,
                                height: 1,
                                bgcolor: 'divider',
                                opacity: 0.3,
                            }}
                        />
                    ))}
                    {[20, 40, 60, 80].map((pos) => (
                        <Box
                            key={`v-${pos}`}
                            sx={{
                                position: 'absolute',
                                top: 0,
                                bottom: 0,
                                left: `${pos}%`,
                                width: 1,
                                bgcolor: 'divider',
                                opacity: 0.3,
                            }}
                        />
                    ))}

                    {/* Floor plan label */}
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{
                            position: 'absolute',
                            top: 8,
                            left: 8,
                            bgcolor: 'background.paper',
                            px: 1,
                            py: 0.5,
                            borderRadius: 1,
                        }}
                    >
                        <Layers fontSize="small" sx={{ mr: 0.5, verticalAlign: 'middle' }} />
                        Main Building - Floor 1
                    </Typography>

                    {/* Hotspot markers */}
                    {mockHotspots.map((hotspot) => {
                        const size = 24 + (hotspot.incidents / maxIncidents) * 24;
                        return (
                            <Tooltip
                                key={hotspot.id}
                                title={
                                    <Box>
                                        <Typography variant="body2" fontWeight={600}>{hotspot.name}</Typography>
                                        <Typography variant="caption">{hotspot.incidents} incidents</Typography>
                                    </Box>
                                }
                                arrow
                            >
                                <Box
                                    sx={{
                                        position: 'absolute',
                                        left: `${hotspot.x}%`,
                                        top: `${hotspot.y}%`,
                                        transform: 'translate(-50%, -50%)',
                                        width: size,
                                        height: size,
                                        borderRadius: '50%',
                                        bgcolor: alpha(severityColors[hotspot.severity as keyof typeof severityColors], 0.3),
                                        border: 2,
                                        borderColor: severityColors[hotspot.severity as keyof typeof severityColors],
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            transform: 'translate(-50%, -50%) scale(1.2)',
                                            zIndex: 10,
                                            boxShadow: `0 0 20px ${alpha(severityColors[hotspot.severity as keyof typeof severityColors], 0.5)}`,
                                        },
                                    }}
                                >
                                    <Room
                                        sx={{
                                            fontSize: size * 0.6,
                                            color: severityColors[hotspot.severity as keyof typeof severityColors],
                                        }}
                                    />
                                </Box>
                            </Tooltip>
                        );
                    })}

                    {/* Integration placeholder message */}
                    <Box
                        sx={{
                            position: 'absolute',
                            bottom: 8,
                            left: '50%',
                            transform: 'translateX(-50%)',
                            bgcolor: 'background.paper',
                            px: 2,
                            py: 1,
                            borderRadius: 1,
                            border: 1,
                            borderColor: 'divider',
                        }}
                    >
                        <Typography variant="caption" color="text.secondary">
                            📍 Connect your building floor plans for precise incident mapping
                        </Typography>
                    </Box>
                </Box>

                {/* Legend and Stats */}
                <Stack direction="row" spacing={3} justifyContent="space-between" flexWrap="wrap">
                    <Stack direction="row" spacing={2}>
                        {Object.entries(severityColors).map(([severity, color]) => (
                            <Stack key={severity} direction="row" alignItems="center" spacing={0.5}>
                                <Box
                                    sx={{
                                        width: 12,
                                        height: 12,
                                        borderRadius: '50%',
                                        bgcolor: alpha(color, 0.3),
                                        border: 2,
                                        borderColor: color,
                                    }}
                                />
                                <Typography variant="caption" color="text.secondary" textTransform="capitalize">
                                    {severity}
                                </Typography>
                            </Stack>
                        ))}
                    </Stack>

                    <Typography variant="caption" color="text.secondary">
                        Marker size indicates incident frequency
                    </Typography>
                </Stack>

                {/* Top Hotspots List */}
                <Box>
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                        Top Incident Locations
                    </Typography>
                    <Stack direction="row" spacing={1} flexWrap="wrap">
                        {mockHotspots
                            .sort((a, b) => b.incidents - a.incidents)
                            .slice(0, 4)
                            .map((hotspot) => (
                                <Chip
                                    key={hotspot.id}
                                    label={`${hotspot.name} (${hotspot.incidents})`}
                                    size="small"
                                    sx={{
                                        bgcolor: alpha(severityColors[hotspot.severity as keyof typeof severityColors], 0.15),
                                        color: severityColors[hotspot.severity as keyof typeof severityColors],
                                        fontWeight: 500,
                                    }}
                                />
                            ))}
                    </Stack>
                </Box>

                {/* Integration CTA */}
                <Button variant="outlined" startIcon={<Layers />} fullWidth>
                    Configure Floor Plans
                </Button>
            </Stack>
        </Paper>
    );
}
