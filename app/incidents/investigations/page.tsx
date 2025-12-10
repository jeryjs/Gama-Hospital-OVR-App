/**
 * @fileoverview Investigations List Page
 * 
 * Displays all investigations with filtering and status tracking
 * QI staff can manage investigations from here
 */

'use client';

import { AppLayout } from '@/components/AppLayout';
import { ACCESS_CONTROL } from '@/lib/access-control';
import { formatErrorForAlert } from '@/lib/client/error-handler';
import { useInvestigations } from '@/lib/hooks';
import type { InvestigationListItem } from '@/lib/hooks';
import { Search, Visibility } from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    Chip,
    LinearProgress,
    MenuItem,
    Paper,
    Select,
    Stack,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Typography,
} from '@mui/material';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { IncidentsHeader, MetricsCards } from '../_shared';

/**
 * Investigations List Page
 * Shows all investigations with filtering and quick actions
 */
export default function InvestigationsPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'completed'>('all');

    // Check access
    useEffect(() => {
        if (session && !ACCESS_CONTROL.ui.incidentForm.canEditQISection(session?.user.roles || [])) {
            return router.replace('/dashboard');
        }
    }, [session, router]);

    // Fetch investigations
    const { investigations, isLoading, error } = useInvestigations({
        search: searchTerm || undefined,
        status: statusFilter,
    });

    if (isLoading) {
        return (
            <AppLayout>
                <LinearProgress />
            </AppLayout>
        );
    }

    if (error) {
        return (
            <AppLayout>
                <Alert severity="error" sx={{ mt: 4 }}>
                    Failed to load investigations. {formatErrorForAlert(error)}
                </Alert>
            </AppLayout>
        );
    }

    const totalCount = investigations?.length || 0;
    const pendingCount = investigations?.filter((inv: InvestigationListItem) => !inv.submittedAt).length || 0;
    const completedCount = investigations?.filter((inv: InvestigationListItem) => inv.submittedAt).length || 0;

    // Build metrics for MetricsCards
    const metrics = [
        { label: 'Total Investigations', value: totalCount, color: 'default' as const },
        { label: 'Pending', value: pendingCount, color: 'warning' as const },
        { label: 'Completed', value: completedCount, color: 'success' as const },
    ];

    return (
        <AppLayout>
            <Box sx={{ maxWidth: 1400, mx: 'auto', pb: 4 }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <Stack spacing={3}>
                        <IncidentsHeader
                            title="Investigations"
                            subtitle="Manage incident investigations and track progress"
                        />

                        <MetricsCards metrics={metrics} />

                        {/* Filters */}
                        <Paper sx={{ p: 2 }}>
                            <Stack direction="row" spacing={2}>
                                <TextField
                                    placeholder="Search investigations..."
                                    size="small"
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    InputProps={{
                                        startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                                    }}
                                    sx={{ flex: 1 }}
                                />
                                <Select
                                    value={statusFilter}
                                    onChange={(e) => setStatusFilter(e.target.value as any)}
                                    size="small"
                                    sx={{ minWidth: 150 }}
                                >
                                    <MenuItem value="all">All Status</MenuItem>
                                    <MenuItem value="pending">Pending</MenuItem>
                                    <MenuItem value="completed">Completed</MenuItem>
                                </Select>
                            </Stack>
                        </Paper>

                        {/* Investigations Table */}
                        <Paper>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Investigation ID</TableCell>
                                            <TableCell>Incident</TableCell>
                                            <TableCell>Investigators</TableCell>
                                            <TableCell>Status</TableCell>
                                            <TableCell>Created</TableCell>
                                            <TableCell align="right">Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {!investigations || investigations.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} align="center" sx={{ py: 8 }}>
                                                    <Typography variant="body1" color="text.secondary">
                                                        No investigations found
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            investigations.map((investigation: InvestigationListItem) => (
                                                <TableRow key={investigation.id} hover>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight={600}>
                                                            INV-{investigation.id}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Button
                                                            component={Link}
                                                            href={`/incidents/view/${investigation.ovrReportId}`}
                                                            size="small"
                                                            sx={{ textTransform: 'none' }}
                                                        >
                                                            {investigation.ovrReportId}
                                                        </Button>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={`${investigation.investigatorCount || 0} assigned`}
                                                            size="small"
                                                            variant="outlined"
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Chip
                                                            label={investigation.submittedAt ? 'Completed' : 'Pending'}
                                                            size="small"
                                                            color={investigation.submittedAt ? 'success' : 'warning'}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        {format(new Date(investigation.createdAt), 'MMM dd, yyyy')}
                                                    </TableCell>
                                                    <TableCell align="right">
                                                        <Button
                                                            component={Link}
                                                            href={`/investigations/${investigation.id}`}
                                                            size="small"
                                                            startIcon={<Visibility />}
                                                        >
                                                            View
                                                        </Button>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </Paper>
                    </Stack>
                </motion.div>
            </Box>
        </AppLayout>
    );
}
