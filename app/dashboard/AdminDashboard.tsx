'use client';

import { AppLayout } from '@/components/AppLayout';
import { QuickActionsPanel, RecentIncidentsList, StatCard } from '@/components/shared';
import type { DashboardStats } from '@/lib/hooks';
import { fadeIn } from '@/lib/theme';
import { getStatusLabel, STATUS_CONFIG } from '@/lib/utils/status';
import {
  Add,
  Assessment,
  Business,
  Description,
  Groups,
  PendingActions,
  Schedule,
  TrendingUp,
} from '@mui/icons-material';
import {
  alpha,
  Box,
  Button,
  Chip,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function AdminDashboard({ stats, session }: { stats: DashboardStats; session: any }) {
  const router = useRouter();

  const primaryStats = [
    { title: 'Total Incidents', value: stats.total, icon: <Description fontSize="large" />, color: 'primary' as const, trend: '+12%' },
    { title: 'Active Users', value: stats.activeUsers, icon: <Groups fontSize="large" />, color: 'info' as const, trend: '+5%' },
    { title: 'Pending Review', value: stats.byStatus.qi_review + stats.byStatus.qi_final_actions, icon: <PendingActions fontSize="large" />, color: 'warning' as const, trend: '-3%' },
    { title: 'Avg Resolution', value: `${stats.avgResolutionTime}d`, icon: <Schedule fontSize="large" />, color: 'success' as const, trend: '-8%' },
  ];

  const quickActions = [
    { label: 'New Incident Report', icon: <Add />, href: '/incidents/new' },
    { label: 'Manage Users', icon: <Groups />, href: '/users' },
    { label: 'Manage Departments', icon: <Business />, href: '/departments' },
    { label: 'View Analytics', icon: <TrendingUp />, href: '/analytics' },
  ];

  const recentIncidents = stats.recentIncidents.slice(0, 5).map((inc) => ({
    id: String(inc.id),
    status: inc.status,
    reporter: `${inc.reporter.firstName} ${inc.reporter.lastName}`,
    createdAt: inc.createdAt,
    occurrenceCategory: inc.occurrenceCategory,
  }));

  return (
    <AppLayout>
      <Box>
        <motion.div {...{ ...fadeIn, transition: { ...fadeIn.transition, ease: ['easeInOut'] } }}>
          <Stack spacing={3}>
            {/* Welcome Header */}
            <Box>
              <Typography variant="h4" fontWeight={700} gutterBottom>
                Admin Dashboard
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Welcome back, {session?.user?.name} • System Overview
              </Typography>
            </Box>

            {/* Primary Stats */}
            <Grid container spacing={3}>
              {primaryStats.map((stat) => (
                <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={stat.title}>
                  <StatCard {...stat} />
                </Grid>
              ))}
            </Grid>

            <Grid container spacing={3}>
              {/* Incident Pipeline */}
              <Grid size={{ xs: 12, lg: 8 }}>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Stack spacing={2}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Typography variant="h6" fontWeight={600}>
                        Incident Pipeline
                      </Typography>
                      <Button size="small" startIcon={<Assessment />} onClick={() => router.push('/incidents')}>
                        View All
                      </Button>
                    </Stack>

                    <Stack spacing={2}>
                      {Object.entries(stats.byStatus).map(([status, count]) => {
                        const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
                        return (
                          <Box key={status}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                              <Typography variant="body2" fontWeight={500}>
                                {getStatusLabel(status)}
                              </Typography>
                              <Typography variant="body2" fontWeight={700}>
                                {count}
                              </Typography>
                            </Stack>
                            <LinearProgress
                              variant="determinate"
                              value={stats.total > 0 ? (count / stats.total) * 100 : 0}
                              color={config?.color as any}
                              sx={{ height: 8, borderRadius: 4 }}
                            />
                          </Box>
                        );
                      })}
                    </Stack>
                  </Stack>
                </Paper>
              </Grid>

              {/* Quick Actions */}
              <Grid size={{ xs: 12, lg: 4 }}>
                <QuickActionsPanel title="Quick Actions" actions={quickActions} />
              </Grid>

              {/* Department Breakdown */}
              <Grid size={{ xs: 12, lg: 6 }}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Incidents by Department
                  </Typography>
                  <TableContainer sx={{ mt: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Department</strong></TableCell>
                          <TableCell align="right"><strong>Count</strong></TableCell>
                          <TableCell align="right"><strong>% of Total</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {stats.byDepartment.slice(0, 5).map((dept) => (
                          <TableRow key={dept.department} hover>
                            <TableCell>{dept.department}</TableCell>
                            <TableCell align="right">
                              <Chip label={dept.count} size="small" />
                            </TableCell>
                            <TableCell align="right">
                              {stats.total > 0 ? ((dept.count / stats.total) * 100).toFixed(1) : 0}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>

              {/* Recent Activity */}
              <Grid size={{ xs: 12, lg: 6 }}>
                <RecentIncidentsList
                  incidents={recentIncidents}
                  title="Recent Incidents"
                  showViewAll
                  onViewAll={() => router.push('/incidents')}
                />
              </Grid>
            </Grid>
          </Stack>
        </motion.div>
      </Box>
    </AppLayout>
  );
}