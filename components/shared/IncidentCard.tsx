/**
 * @fileoverview Incident Card - Reusable Display Component
 * 
 * Flexible card component for displaying incidents in different contexts
 * Supports multiple variants: list, compact, detail
 */

'use client';

import { Visibility } from '@mui/icons-material';
import {
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Stack,
    Typography,
} from '@mui/material';
import { format } from 'date-fns';
import Link from 'next/link';
import { getStatusColor, getStatusLabel } from '@/lib/utils/status';
import type { OVRReportListItem } from '@/lib/types';

export interface IncidentCardProps {
    incident: OVRReportListItem;
    variant?: 'list' | 'compact' | 'detail';
    actions?: React.ReactNode;
    onClick?: () => void;
    showReporter?: boolean;
    showCategory?: boolean;
    showDate?: boolean;
}

/**
 * Incident Card Component
 * 
 * Reusable card for displaying incident information
 * Adapts layout based on variant prop
 * 
 * @example
 * // List view (default)
 * <IncidentCard incident={data} variant="list" />
 * 
 * // Compact view (for sidebars)
 * <IncidentCard incident={data} variant="compact" />
 * 
 * // Detail view (for headers)
 * <IncidentCard incident={data} variant="detail" />
 */
export function IncidentCard({
    incident,
    variant = 'list',
    actions,
    onClick,
    showReporter = true,
    showCategory = true,
    showDate = true,
}: IncidentCardProps) {
    const isCompact = variant === 'compact';
    const isDetail = variant === 'detail';

    const cardContent = (
        <>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: isCompact ? 1 : 2 }}>
                <Box sx={{ flex: 1 }}>
                    <Typography
                        variant={isCompact ? 'body2' : 'h6'}
                        fontWeight={600}
                        sx={{
                            mb: 0.5,
                            cursor: onClick ? 'pointer' : 'default',
                            '&:hover': onClick ? { color: 'primary.main' } : {},
                        }}
                        onClick={onClick}
                    >
                        {incident.id}
                    </Typography>

                    {showCategory && (
                        <Typography
                            variant={isCompact ? 'caption' : 'body2'}
                            color="text.secondary"
                            sx={{ textTransform: 'capitalize' }}
                        >
                            {incident.occurrenceCategory?.replace(/_/g, ' ')}
                        </Typography>
                    )}
                </Box>

                <Chip
                    label={getStatusLabel(incident.status)}
                    color={getStatusColor(incident.status) as any}
                    size={isCompact ? 'small' : 'medium'}
                />
            </Box>

            {/* Metadata */}
            {!isCompact && (
                <Stack spacing={0.5} sx={{ mb: 2 }}>
                    {showReporter && incident.reporter && (
                        <Typography variant="body2" color="text.secondary">
                            Reporter: {incident.reporter.firstName} {incident.reporter.lastName}
                        </Typography>
                    )}

                    {showDate && (
                        <Typography variant="body2" color="text.secondary">
                            Occurred: {format(new Date(incident.occurrenceDate), 'MMM dd, yyyy')}
                        </Typography>
                    )}
                </Stack>
            )}

            {/* Actions */}
            {actions && (
                <Box sx={{ mt: isCompact ? 1 : 2 }}>
                    {actions}
                </Box>
            )}

            {/* Default View Action */}
            {!actions && !isDetail && (
                <Button
                    component={Link}
                    href={`/incidents/view/${incident.id}`}
                    size={isCompact ? 'small' : 'medium'}
                    startIcon={<Visibility />}
                    sx={{ mt: isCompact ? 1 : 2 }}
                >
                    View Details
                </Button>
            )}
        </>
    );

    // Render without card for detail variant
    if (isDetail) {
        return <Box sx={{ p: 2 }}>{cardContent}</Box>;
    }

    return (
        <Card
            elevation={isCompact ? 1 : 2}
            sx={{
                cursor: onClick ? 'pointer' : 'default',
                transition: 'all 0.2s',
                '&:hover': onClick ? {
                    elevation: 4,
                    transform: 'translateY(-2px)',
                } : {},
            }}
        >
            <CardContent sx={{ p: isCompact ? 2 : 3 }}>
                {cardContent}
            </CardContent>
        </Card>
    );
}
