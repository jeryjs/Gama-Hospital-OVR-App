/**
 * @fileoverview Investigations List Page
 * 
 * Displays all investigations with filtering and status tracking
 * QI staff can manage investigations from here
 */

'use client';

import { AppLayout } from '@/components/AppLayout';
import { IncidentCard, StatusDisplay } from '@/components/shared';
import { ACCESS_CONTROL } from '@/lib/access-control';
import { formatErrorForAlert } from '@/lib/client/error-handler';
import { useInvestigations } from '@/lib/hooks';
import type { InvestigationListItem } from '@/lib/hooks';
import { Add, FilterList, Search, Visibility } from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    Grid,
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

    return (
        <AppLayout>
            <Box sx={{ maxWidth: 1400, mx: 'auto', pb: 4 }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                >
                    <Stack spacing={3}>
                        {/* Header */}
                        <Box>
                            <Typography variant="h4" fontWeight={700} gutterBottom>
                                Investigations
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                Manage incident investigations and track progress
                            </Typography>
                        </Box>

                        {/* Metrics Cards */}
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Total Investigations
                                        </Typography>
                                        <Typography variant="h3" fontWeight={700}>
                                            {totalCount}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <Card sx={{ bgcolor: 'warning.lighter' }}>
                                    <CardContent>
                                        <Typography variant="body2" color="warning.dark" gutterBottom>
                                            Pending
                                        </Typography>
                                        <Typography variant="h3" fontWeight={700} color="warning.dark">
                                            {pendingCount}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <Card sx={{ bgcolor: 'success.lighter' }}>
                                    <CardContent>
                                        <Typography variant="body2" color="success.dark" gutterBottom>
                                            Completed
                                        </Typography>
                                        <Typography variant="h3" fontWeight={700} color="success.dark">
                                            {completedCount}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>

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
