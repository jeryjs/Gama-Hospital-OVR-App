/**
 * @fileoverview RecentIncidentsList Component
 * 
 * Displays a list of recent incidents with status chips and quick navigation.
 * Used in dashboard views to show latest activity.
 */

'use client';

import {
    Box,
    Button,
    List,
    ListItemButton,
    ListItemText,
    Paper,
    Typography,
} from '@mui/material';
import { alpha, useTheme } from '@mui/material/styles';
import { ArrowForward } from '@mui/icons-material';
import { format } from 'date-fns';
import Link from 'next/link';
import { StatusChip } from './StatusChip';
import { EmptyState } from './EmptyState';
import type { OVRStatus } from '@/lib/utils/status';

export interface RecentIncident {
    id: string;
    status: OVRStatus | string;
    reporter: string;
    createdAt: string | Date;
    occurrenceCategory?: string | null;
}

export interface RecentIncidentsListProps {
    /** Array of incidents to display */
    incidents: RecentIncident[];
    /** Maximum items to show (default: 5) */
    maxItems?: number;
    /** Optional header title */
    title?: string;
    /** Show "View All" button */
    showViewAll?: boolean;
    /** Handler for "View All" click */
    onViewAll?: () => void;
}

export function RecentIncidentsList({
    incidents,
    maxItems = 5,
    title = 'Recent Incidents',
    showViewAll = false,
    onViewAll,
}: RecentIncidentsListProps) {
    const theme = useTheme();
    const displayedIncidents = incidents.slice(0, maxItems);

    return (
        <Paper sx={{ p: 0, overflow: 'hidden' }}>
            {/* Header */}
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    px: 2.5,
                    py: 2,
                    borderBottom: `1px solid ${theme.palette.divider}`,
                }}
            >
                <Typography variant="subtitle1" fontWeight={600}>
                    {title}
                </Typography>
                {showViewAll && (
                    <Button
                        size="small"
                        endIcon={<ArrowForward />}
                        onClick={onViewAll}
                        sx={{ textTransform: 'none' }}
                    >
                        View All
                    </Button>
                )}
            </Box>

            {/* List */}
            {displayedIncidents.length === 0 ? (
                <EmptyState
                    title="No incidents yet"
                    description="Recent incidents will appear here"
                    variant="compact"
                />
            ) : (
                <List disablePadding>
                    {displayedIncidents.map((incident, index) => {
                        const createdDate =
                            typeof incident.createdAt === 'string'
                                ? new Date(incident.createdAt)
                                : incident.createdAt;

                        return (
                            <ListItemButton
                                key={incident.id}
                                component={Link}
                                href={`/incidents/view/${incident.id}`}
                                sx={{
                                    px: 2.5,
                                    py: 1.5,
                                    borderBottom:
                                        index < displayedIncidents.length - 1
                                            ? `1px solid ${theme.palette.divider}`
                                            : 'none',
                                    '&:hover': {
                                        bgcolor: alpha(theme.palette.primary.main, 0.04),
                                    },
                                }}
                            >
                                <ListItemText
                                    primary={
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                gap: 1,
                                                mb: 0.5,
                                            }}
                                        >
                                            <Typography
                                                variant="body2"
                                                fontWeight={500}
                                                sx={{
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                    maxWidth: 180,
                                                }}
                                            >
                                                {incident.id}
                                            </Typography>
                                            <StatusChip status={incident.status} size="small" />
                                        </Box>
                                    }
                                    secondary={
                                        <Box
                                            sx={{
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'space-between',
                                                gap: 1,
                                            }}
                                        >
                                            <Typography
                                                variant="caption"
                                                color="text.secondary"
                                                sx={{
                                                    overflow: 'hidden',
                                                    textOverflow: 'ellipsis',
                                                    whiteSpace: 'nowrap',
                                                }}
                                            >
                                                {incident.occurrenceCategory || 'Uncategorized'} • {incident.reporter}
                                            </Typography>
                                            <Typography variant="caption" color="text.disabled" sx={{ flexShrink: 0 }}>
                                                {format(createdDate, 'MMM d, h:mm a')}
                                            </Typography>
                                        </Box>
                                    }
                                    secondaryTypographyProps={{ component: 'div' }}
                                />
                            </ListItemButton>
                        );
                    })}
                </List>
            )}
        </Paper>
    );
}
