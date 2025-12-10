'use client';

import { useIncidents } from '@/lib/hooks';
import { getStatusColor, getStatusLabel } from '@/lib/utils/status';
import { getUserDrafts, type LocalDraft } from '@/lib/utils/draft-storage';
import {
    Add, ChevronLeft, ChevronRight, Search
} from '@mui/icons-material';
import {
    alpha, Box, Button, Chip, Divider,
    IconButton, InputAdornment, List, ListItemButton,
    Paper, Skeleton, Stack, TextField, Tooltip, Typography
} from '@mui/material';
import { format } from 'date-fns';
import Link from 'next/link';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';

interface IncidentsSidebarProps {
    collapsed: boolean;
    onToggle: () => void;
}

export function IncidentsSidebar({ collapsed, onToggle }: IncidentsSidebarProps) {
    const params = useParams();
    const searchParams = useSearchParams();
    const router = useRouter();
    const { data: session } = useSession();
    const [searchTerm, setSearchTerm] = useState('');

    // Determine source from searchParam
    const source = searchParams.get('source') || 'all';
    const isMyReports = source === 'me';

    // Get user ID safely
    const userId = session?.user?.id ? parseInt(session.user.id) : undefined;

    // Fetch incidents based on source
    const { incidents, isLoading, error } = useIncidents(
        isMyReports && userId
            ? { reporterId: userId }
            : {}
    );

    // Get user's drafts from localStorage (only for My Reports view)
    const drafts = useMemo(() => {
        if (!userId || !isMyReports) return [];
        return getUserDrafts(userId);
    }, [userId, isMyReports]);

    const currentId = params.id as string;

    // Filter by search
    const filteredIncidents = useMemo(() => {
        if (!searchTerm) return incidents;
        const term = searchTerm.toLowerCase();
        return incidents.filter(inc =>
            inc.id.toLowerCase().includes(term) ||
            inc.occurrenceCategory?.toLowerCase().includes(term)
        );
    }, [incidents, searchTerm]);

    // Collapsed view - just toggle button
    if (collapsed) {
        return (
            <Box sx={{
                width: 60,
                borderRight: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                py: 2,
                bgcolor: (theme) => alpha(theme.palette.background.default, 0.5),
            }}>
                <IconButton onClick={onToggle}>
                    <ChevronRight />
                </IconButton>
                <Divider sx={{ my: 2, width: '80%' }} />
                <Tooltip title="New Report" placement="right">
                    <IconButton component={Link} href="/incidents/new" color="primary">
                        <Add />
                    </IconButton>
                </Tooltip>
            </Box>
        );
    }

    return (
        <Paper
            component={motion.div}
            initial={{ width: 0 }}
            animate={{ width: 320 }}
            elevation={0}
            sx={{
                width: 320,
                height: '100%',
                borderRight: '1px solid',
                borderColor: 'divider',
                display: 'flex',
                flexDirection: 'column',
                overflow: 'hidden',
                bgcolor: (theme) => alpha(theme.palette.background.default, 0.5),
            }}
        >
            {/* Header */}
            <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="h6" fontWeight={600}>
                        {isMyReports ? 'My Reports' : 'All Incidents'}
                    </Typography>
                    <IconButton size="small" onClick={onToggle}>
                        <ChevronLeft />
                    </IconButton>
                </Stack>

                {/* Search */}
                <TextField
                    fullWidth
                    size="small"
                    placeholder="Search incidents..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    sx={{ mt: 2 }}
                    slotProps={{
                        input: {
                            startAdornment: (
                                <InputAdornment position="start">
                                    <Search sx={{ fontSize: 20, color: 'text.secondary' }} />
                                </InputAdornment>
                            ),
                        },
                    }}
                />
            </Box>

            {/* New Report Button */}
            <Box sx={{ p: 2 }}>
                <Button
                    fullWidth
                    variant="contained"
                    startIcon={<Add />}
                    component={Link}
                    href="/incidents/new"
                >
                    New Report
                </Button>
            </Box>

            {/* Drafts Section (only for My Reports) */}
            {isMyReports && drafts.length > 0 && (
                <>
                    <Typography variant="caption" sx={{ px: 2, color: 'text.secondary', fontWeight: 600 }}>
                        DRAFTS ({drafts.length})
                    </Typography>
                    <List dense sx={{ px: 1 }}>
                        {drafts.map((draft) => (
                            <ListItemButton
                                key={draft.id}
                                selected={currentId === draft.id}
                                onClick={() => router.push(`/incidents/new?draft=${draft.id}`)}
                                sx={{ borderRadius: 1, mb: 0.5 }}
                            >
                                <Box sx={{ width: '100%' }}>
                                    <Stack direction="row" justifyContent="space-between" alignItems="center">
                                        <Typography variant="body2" fontWeight={500} noWrap>
                                            Draft
                                        </Typography>
                                        <Chip label="Draft" size="small" color="warning" sx={{ height: 20, fontSize: '0.65rem' }} />
                                    </Stack>
                                    <Typography variant="caption" color="text.secondary">
                                        {format(new Date(draft.updatedAt), 'MMM d, h:mm a')}
                                    </Typography>
                                </Box>
                            </ListItemButton>
                        ))}
                    </List>
                    <Divider sx={{ mx: 2, my: 1 }} />
                </>
            )}

            {/* Incidents List */}
            <Box sx={{ flex: 1, overflow: 'auto', px: 1 }}>
                {isLoading ? (
                    Array.from({ length: 5 }).map((_, i) => (
                        <Skeleton key={i} variant="rounded" height={60} sx={{ mb: 1 }} />
                    ))
                ) : error ? (
                    <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="body2" color="error">
                            Failed to load incidents
                        </Typography>
                    </Box>
                ) : filteredIncidents.length === 0 ? (
                    <Box sx={{ p: 2, textAlign: 'center' }}>
                        <Typography variant="body2" color="text.secondary">
                            {searchTerm ? 'No incidents match your search' : 'No incidents found'}
                        </Typography>
                    </Box>
                ) : (
                    <List dense>
                        {filteredIncidents.map((incident) => {
                            const statusColor = getStatusColor(incident.status);
                            return (
                                <ListItemButton
                                    key={incident.id}
                                    selected={currentId === incident.id}
                                    onClick={() => router.push(`/incidents/view/${incident.id}?source=${source}`)}
                                    sx={{
                                        borderRadius: 1,
                                        mb: 0.5,
                                        bgcolor: currentId === incident.id ? (theme) => alpha(theme.palette.primary.main, 0.1) : 'transparent',
                                        '&:hover': {
                                            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
                                        },
                                        '&.Mui-selected': {
                                            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                                            '&:hover': {
                                                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.15),
                                            },
                                        },
                                    }}
                                >
                                    <Box sx={{ width: '100%' }}>
                                        <Stack direction="row" justifyContent="space-between" alignItems="center">
                                            <Typography variant="body2" fontWeight={600} noWrap>
                                                {incident.id}
                                            </Typography>
                                            <Chip
                                                label={getStatusLabel(incident.status)}
                                                size="small"
                                                sx={{
                                                    bgcolor: alpha(statusColor === 'grey' ? '#9E9E9E' : statusColor === 'info' ? '#2196F3' : statusColor === 'warning' ? '#FF9800' : statusColor === 'primary' ? '#6366F1' : statusColor === 'secondary' ? '#9C27B0' : statusColor === 'success' ? '#4CAF50' : '#9E9E9E', 0.15),
                                                    color: statusColor === 'grey' ? '#616161' : statusColor === 'info' ? '#1565C0' : statusColor === 'warning' ? '#E65100' : statusColor === 'primary' ? '#4338CA' : statusColor === 'secondary' ? '#7B1FA2' : statusColor === 'success' ? '#2E7D32' : '#616161',
                                                    fontWeight: 500,
                                                    fontSize: '0.65rem',
                                                    height: 20,
                                                }}
                                            />
                                        </Stack>
                                        <Typography variant="caption" color="text.secondary" noWrap>
                                            {format(new Date(incident.occurrenceDate || incident.createdAt), 'MMM d, yyyy')}
                                        </Typography>
                                    </Box>
                                </ListItemButton>
                            );
                        })}
                    </List>
                )}
            </Box>
        </Paper>
    );
}
