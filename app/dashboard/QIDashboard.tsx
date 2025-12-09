'use client';

import { AppLayout } from '@/components/AppLayout';
import { EmptyState, QuickActionsPanel, RecentIncidentsList, StatCard, StatusChip } from '@/components/shared';
import { DashboardStats } from '@/lib/hooks';
import { fadeIn } from '@/lib/theme';
import { getStatusLabel, STATUS_CONFIG } from '@/lib/utils/status';
import {
  Add,
  Assignment,
  AssignmentInd,
  CheckCircle,
  Description,
  Feedback,
  PendingActions,
  TrendingDown,
  TrendingUp,
} from '@mui/icons-material';
import {
  alpha,
  Box,
  Divider,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function QIDashboard({ stats, session }: { stats: DashboardStats; session: any }) {
  const router = useRouter();

  const primaryStats = [
    { title: 'Total Incidents', value: stats.total, icon: <Description fontSize="large" />, color: 'primary' as const, subtitle: 'All time' },
    { title: 'Needs Investigation Assignment', value: stats.byStatus.qi_review, icon: <AssignmentInd fontSize="large" />, color: 'warning' as const, subtitle: 'Awaiting action', urgent: stats.byStatus.qi_review > 0 },
    { title: 'Awaiting Final Actions', value: stats.byStatus.qi_final_actions, icon: <Feedback fontSize="large" />, color: 'secondary' as const, subtitle: 'Needs feedback', urgent: stats.byStatus.qi_final_actions > 0 },
    { title: 'Closed This Month', value: stats.closedThisMonth || 0, icon: <CheckCircle fontSize="large" />, color: 'success' as const, subtitle: 'Successfully resolved' },
  ];

  const actionItems = [
    { title: 'Assign Investigation', count: stats.byStatus.qi_review, description: 'Incidents need investigation assignment', color: '#10B981', action: () => router.push('/incidents/qi/review') },
    { title: 'Review Actions', count: stats.byStatus.qi_final_actions, description: 'Corrective actions need review', color: '#EC4899', action: () => router.push('/actions') },
    { title: 'Under Investigation', count: stats.byStatus.investigating, description: 'Active investigations in progress', color: '#3B82F6', action: () => router.push('/incidents/investigations') },
  ];

  const workflowStatuses = [
    { status: 'submitted', label: 'New Submissions', icon: <Assignment /> },
    { status: 'qi_review', label: 'Pending HOD Assignment', icon: <AssignmentInd /> },
    { status: 'investigating', label: 'Under Investigation', icon: <PendingActions /> },
    { status: 'qi_final_actions', label: 'Awaiting Your Review', icon: <Feedback /> },
    { status: 'closed', label: 'Resolved & Closed', icon: <CheckCircle /> },
  ];

  const quickActions = [
    { label: 'Create New Report', icon: <Add />, href: '/incidents/new' },
    { label: `Assign HODs (${stats.byStatus.qi_review})`, icon: <AssignmentInd />, href: '/incidents?status=qi_review', count: stats.byStatus.qi_review },
    { label: `Review & Close (${stats.byStatus.qi_final_actions})`, icon: <Feedback />, href: '/incidents?status=qi_final_actions', count: stats.byStatus.qi_final_actions },
  ];

  const qiIncidents = stats.recentIncidents
    .filter((inc) => ['qi_review', 'qi_final_actions'].includes(inc.status))
    .slice(0, 6)
    .map((inc) => ({
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
                Quality & Improvement Dashboard
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Welcome back, {session?.user?.name} • Monitor & Review OVR Reports
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
              {/* Action Items */}
              <Grid size={{ xs: 12, lg: 4 }}>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Your Action Items
                  </Typography>
                  <Stack spacing={2} mt={2}>
                    {actionItems.map((item) => (
                      <Box
                        key={item.title}
                        onClick={item.action}
                        sx={{
                          p: 2,
                          borderRadius: 2,
                          border: 1,
                          borderColor: 'divider',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          '&:hover': {
                            borderColor: item.color,
                            bgcolor: (theme) => alpha(item.color, 0.05),
                            transform: 'translateX(4px)',
                          },
                        }}
                      >
                        <Stack direction="row" spacing={2} alignItems="center">
                          <Box
                            sx={{
                              width: 48,
                              height: 48,
                              borderRadius: 2,
                              bgcolor: (theme) => alpha(item.color, 0.1),
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}
                          >
                            <Typography variant="h5" fontWeight={700} color={item.color}>
                              {item.count}
                            </Typography>
                          </Box>
                          <Box sx={{ flex: 1 }}>
                            <Typography variant="subtitle2" fontWeight={600}>
                              {item.title}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {item.description}
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>
                    ))}
                  </Stack>
                </Paper>
              </Grid>

              {/* Workflow Status */}
              <Grid size={{ xs: 12, lg: 8 }}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Incident Workflow Status
                  </Typography>
                  <Stack spacing={2} mt={2}>
                    {workflowStatuses.map((workflow) => {
                      const count = stats.byStatus[workflow.status as keyof typeof stats.byStatus];
                      const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;
                      const config = STATUS_CONFIG[workflow.status as keyof typeof STATUS_CONFIG];

                      return (
                        <Box key={workflow.status}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Box sx={{ color: `${config?.color}.main` }}>{workflow.icon}</Box>
                              <Typography variant="body2" fontWeight={500}>
                                {workflow.label}
                              </Typography>
                            </Stack>
                            <Typography variant="body2" fontWeight={700}>
                              {count} ({percentage.toFixed(0)}%)
                            </Typography>
                          </Stack>
                          <LinearProgress
                            variant="determinate"
                            value={percentage}
                            color={config?.color as any}
                            sx={{ height: 8, borderRadius: 4 }}
                          />
                        </Box>
                      );
                    })}
                  </Stack>
                </Paper>
              </Grid>

              {/* Recent Incidents */}
              <Grid size={{ xs: 12 }}>
                {qiIncidents.length > 0 ? (
                  <RecentIncidentsList
                    incidents={qiIncidents}
                    title="Recent Incidents Requiring Attention"
                    maxItems={6}
                    showViewAll
                    onViewAll={() => router.push('/incidents')}
                  />
                ) : (
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      Recent Incidents Requiring Attention
                    </Typography>
                    <EmptyState
                      icon={<CheckCircle sx={{ fontSize: 64, color: 'success.main' }} />}
                      title="All caught up!"
                      description="No incidents requiring immediate attention"
                    />
                  </Paper>
                )}
              </Grid>

              {/* Quick Actions */}
              <Grid size={{ xs: 12, md: 6 }}>
                <QuickActionsPanel title="Quick Actions" actions={quickActions} />
              </Grid>

              {/* Performance Metrics */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Performance Metrics
                  </Typography>
                  <Stack spacing={2} mt={2}>
                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="text.secondary">
                          Avg Resolution Time
                        </Typography>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <TrendingDown fontSize="small" color="success" />
                          <Typography variant="h6" fontWeight={700} color="success.main">
                            {stats.avgResolutionTime}d
                          </Typography>
                        </Stack>
                      </Stack>
                    </Box>
                    <Divider />
                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="text.secondary">
                          Closure Rate
                        </Typography>
                        <Stack direction="row" spacing={0.5} alignItems="center">
                          <TrendingUp fontSize="small" color="success" />
                          <Typography variant="h6" fontWeight={700} color="success.main">
                            {stats.total > 0 ? ((stats.byStatus.closed / stats.total) * 100).toFixed(0) : 0}%
                          </Typography>
                        </Stack>
                      </Stack>
                    </Box>
                    <Divider />
                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="center">
                        <Typography variant="body2" color="text.secondary">
                          Pending Items
                        </Typography>
                        <Typography variant="h6" fontWeight={700} color="warning.main">
                          {stats.byStatus.qi_review + stats.byStatus.qi_final_actions}
                        </Typography>
                      </Stack>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
            </Grid>
          </Stack>
        </motion.div>
      </Box>
    </AppLayout>
  );
}
