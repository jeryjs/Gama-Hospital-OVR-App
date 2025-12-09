/**
 * @fileoverview Corrective Actions List Page
 * 
 * Displays all corrective actions with filtering and status tracking
 * QI staff can manage actions from here
 */

'use client';

import { AppLayout } from '@/components/AppLayout';
import { StatusDisplay } from '@/components/shared';
import { ACCESS_CONTROL } from '@/lib/access-control';
import { formatErrorForAlert } from '@/lib/client/error-handler';
import { Search, Visibility, Warning } from '@mui/icons-material';
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
import { format, isAfter, isPast } from 'date-fns';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

/**
 * Corrective Actions List Page
 * Shows all actions with filtering and quick status view
 */
export default function CorrectiveActionsPage() {
    const { data: session } = useSession();
    const router = useRouter();
    const [searchTerm, setSearchTerm] = useState('');
    const [statusFilter, setStatusFilter] = useState<'all' | 'open' | 'closed'>('all');

    // Check access
    useEffect(() => {
        if (session && !ACCESS_CONTROL.ui.incidentForm.canEditQISection(session?.user.roles || [])) {
            return router.replace('/dashboard');
        }
    }, [session, router]);

    // Fetch actions
    // TODO: Implement useCorrectiveActions hook
    const actions: any[] = [];
    const isLoading = false;
    const error = null;
    // const { actions, isLoading, error } = useCorrectiveActions({
    //     search: searchTerm || undefined,
    //     status: statusFilter === 'all' ? undefined : statusFilter,
    // });

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
                    Failed to load corrective actions. {formatErrorForAlert(error)}
                </Alert>
            </AppLayout>
        );
    }

    const totalCount = actions?.length || 0;
    const openCount = actions?.filter((action) => action.status === 'open').length || 0;
    const closedCount = actions?.filter((action) => action.status === 'closed').length || 0;
    const overdueCount = actions?.filter(
        (action) => action.status === 'open' && isPast(new Date(action.dueDate))
    ).length || 0;

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
                                Corrective Actions
                            </Typography>
                            <Typography variant="body1" color="text.secondary">
                                Track and manage corrective action items
                            </Typography>
                        </Box>

                        {/* Metrics Cards */}
                        <Grid container spacing={2}>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <Card>
                                    <CardContent>
                                        <Typography variant="body2" color="text.secondary" gutterBottom>
                                            Total Actions
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
                                            Open
                                        </Typography>
                                        <Typography variant="h3" fontWeight={700} color="warning.dark">
                                            {openCount}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <Card sx={{ bgcolor: 'success.lighter' }}>
                                    <CardContent>
                                        <Typography variant="body2" color="success.dark" gutterBottom>
                                            Closed
                                        </Typography>
                                        <Typography variant="h3" fontWeight={700} color="success.dark">
                                            {closedCount}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                            <Grid size={{ xs: 12, sm: 6, md: 3 }}>
                                <Card sx={{ bgcolor: overdueCount > 0 ? 'error.lighter' : 'background.paper' }}>
                                    <CardContent>
                                        <Typography variant="body2" color={overdueCount > 0 ? 'error.dark' : 'text.secondary'} gutterBottom>
                                            Overdue
                                        </Typography>
                                        <Typography variant="h3" fontWeight={700} color={overdueCount > 0 ? 'error.dark' : 'text.primary'}>
                                            {overdueCount}
                                        </Typography>
                                    </CardContent>
                                </Card>
                            </Grid>
                        </Grid>

                        {/* Filters */}
                        <Paper sx={{ p: 2 }}>
                            <Stack direction="row" spacing={2}>
                                <TextField
                                    placeholder="Search actions..."
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
                                    <MenuItem value="open">Open</MenuItem>
                                    <MenuItem value="closed">Closed</MenuItem>
                                </Select>
                            </Stack>
                        </Paper>

                        {/* Actions Table */}
                        <Paper>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow>
                                            <TableCell>Action ID</TableCell>
                                            <TableCell>Title</TableCell>
                                            <TableCell>Incident</TableCell>
                                            <TableCell>Handlers</TableCell>
                                            <TableCell>Due Date</TableCell>
                                            <TableCell>Status</TableCell>
                                            <TableCell align="right">Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {!actions || actions.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={7} align="center" sx={{ py: 8 }}>
                                                    <Typography variant="body1" color="text.secondary">
                                                        No corrective actions found
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            actions.map((action) => {
                                                const isOverdue = action.status === 'open' && isPast(new Date(action.dueDate));

                                                return (
                                                    <TableRow key={action.id} hover>
                                                        <TableCell>
                                                            <Typography variant="body2" fontWeight={600}>
                                                                ACT-{action.id}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Typography variant="body2">
                                                                {action.title}
                                                            </Typography>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Button
                                                                component={Link}
                                                                href={`/incidents/view/${action.ovrReportId}`}
                                                                size="small"
                                                                sx={{ textTransform: 'none' }}
                                                            >
                                                                {action.ovrReportId}
                                                            </Button>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                label={`${action.assignedTo?.split(',').length || 0} assigned`}
                                                                size="small"
                                                                variant="outlined"
                                                            />
                                                        </TableCell>
                                                        <TableCell>
                                                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                                                {isOverdue && <Warning fontSize="small" color="error" />}
                                                                <Typography
                                                                    variant="body2"
                                                                    color={isOverdue ? 'error.main' : 'text.primary'}
                                                                >
                                                                    {format(new Date(action.dueDate), 'MMM dd, yyyy')}
                                                                </Typography>
                                                            </Box>
                                                        </TableCell>
                                                        <TableCell>
                                                            <Chip
                                                                label={action.status === 'open' ? 'Open' : 'Closed'}
                                                                size="small"
                                                                color={action.status === 'open' ? 'warning' : 'success'}
                                                            />
                                                        </TableCell>
                                                        <TableCell align="right">
                                                            <Button
                                                                component={Link}
                                                                href={`/actions/${action.id}`}
                                                                size="small"
                                                                startIcon={<Visibility />}
                                                            >
                                                                View
                                                            </Button>
                                                        </TableCell>
                                                    </TableRow>
                                                );
                                            })
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
