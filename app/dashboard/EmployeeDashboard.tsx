'use client';

import { AppLayout } from '@/components/AppLayout';
import { EmptyState, QuickActionsPanel, RecentIncidentsList, StatCard } from '@/components/shared';
import type { DashboardStats } from '@/lib/hooks';
import { getUserDrafts } from '@/lib/utils/draft-storage';
import { fadeIn } from '@/lib/theme';
import {
  Add,
  CheckCircle,
  Description,
  Edit,
  PendingActions,
  Visibility,
} from '@mui/icons-material';
import { alpha, Box, Button, Divider, Grid, Paper, Stack, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

export default function EmployeeDashboard({ stats, session }: { stats: DashboardStats; session: any }) {
  const router = useRouter();

  // Get draft count from localStorage
  const [localDraftCount, setLocalDraftCount] = useState(0);

  useEffect(() => {
    if (session?.user?.id) {
      const userId = parseInt(session.user.id);
      const drafts = getUserDrafts(userId);
      setLocalDraftCount(drafts.length);
    }
  }, [session?.user?.id]);

  const statCards = [
    { title: 'Total Reports', value: stats.myReports?.total || 0, icon: <Description fontSize="large" />, color: 'primary' as const, subtitle: 'All time' },
    { title: 'Drafts', value: localDraftCount, icon: <Edit fontSize="large" />, color: 'warning' as const, subtitle: 'Saved locally', onClick: () => router.push('/incidents/me') },
    { title: 'In Progress', value: stats.myReports?.inProgress || 0, icon: <PendingActions fontSize="large" />, color: 'info' as const, subtitle: 'Being reviewed' },
    { title: 'Resolved', value: stats.myReports?.resolved || 0, icon: <CheckCircle fontSize="large" />, color: 'success' as const, subtitle: 'Completed' },
  ];

  const quickActions = [
    { label: 'Report New Incident', icon: <Add />, href: '/incidents/new' },
    { label: `Continue Draft (${localDraftCount})`, icon: <Edit />, href: '/incidents/me', count: localDraftCount },
    { label: 'View All My Reports', icon: <Visibility />, href: '/incidents/me' },
  ];

  const myRecentReports = (stats.myRecentReports || []).slice(0, 5).map((report) => ({
    id: String(report.id),
    status: report.status,
    reporter: session?.user?.name || 'You',
    createdAt: report.createdAt,
    occurrenceCategory: report.occurrenceCategory?.replace(/_/g, ' ') || 'Uncategorized',
  }));

  return (
    <AppLayout>
      <Box>
        <motion.div {...{ ...fadeIn, transition: { ...fadeIn.transition, ease: ['easeInOut'] } }}>
          <Stack spacing={3}>
            {/* Welcome Header */}
            <Box>
              <Typography variant="h4" fontWeight={700} gutterBottom>
                Welcome back, {session?.user?.name?.split(' ')[0]}!
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Track your incident reports and create new ones
              </Typography>
            </Box>

            {/* Primary Stats */}
            <Grid container spacing={3}>
              {statCards.map((stat) => (
                <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={stat.title}>
                  <StatCard {...stat} />
                </Grid>
              ))}
            </Grid>

            <Grid container spacing={3}>
              {/* Quick Actions */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <QuickActionsPanel title="Quick Actions" actions={quickActions} />

                  <Divider sx={{ my: 3 }} />

                  <Box
                    sx={{
                      p: 2,
                      borderRadius: 2,
                      bgcolor: (theme) => alpha(theme.palette.info.main, 0.05),
                      border: 1,
                      borderColor: 'divider',
                    }}
                  >
                    <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                      💡 Quick Tip
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Reports are automatically saved as drafts in your browser. You can come back anytime to complete them.
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              {/* My Recent Reports */}
              <Grid size={{ xs: 12, md: 8 }}>
                {myRecentReports.length > 0 ? (
                  <RecentIncidentsList
                    incidents={myRecentReports}
                    title="My Recent Reports"
                    showViewAll
                    onViewAll={() => router.push('/incidents/me')}
                  />
                ) : (
                  <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" fontWeight={600} gutterBottom>
                      My Recent Reports
                    </Typography>
                    <EmptyState
                      icon={<Description sx={{ fontSize: 64 }} />}
                      title="No reports yet"
                      description="Report your first incident to get started"
                      action={
                        <Button variant="contained" startIcon={<Add />} onClick={() => router.push('/incidents/new')}>
                          Create First Report
                        </Button>
                      }
                    />
                  </Paper>
                )}
              </Grid>

              {/* Reporting Guidelines */}
              <Grid size={{ xs: 12 }}>
                <Paper sx={{ p: 3, bgcolor: (theme) => alpha(theme.palette.primary.main, 0.02) }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    📋 Reporting Guidelines
                  </Typography>
                  <Grid container spacing={2} mt={1}>
                    {[
                      { title: 'What to Report', text: 'Any incident, near-miss, or safety concern that could affect patients or staff' },
                      { title: 'When to Report', text: 'As soon as possible after the incident occurs or is discovered' },
                      { title: 'Confidentiality', text: 'All reports are confidential and used for quality improvement only' },
                      { title: 'Non-Punitive', text: 'Reporting helps improve safety - no blame or punishment' },
                    ].map((item) => (
                      <Grid size={{ xs: 12, md: 3 }} key={item.title}>
                        <Box>
                          <Typography variant="subtitle2" fontWeight={600} color="primary" gutterBottom>
                            {item.title}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {item.text}
                          </Typography>
                        </Box>
                      </Grid>
                    ))}
                  </Grid>
                </Paper>
              </Grid>
            </Grid>
          </Stack>
        </motion.div>
      </Box>
    </AppLayout>
  );
}
