'use client';

import { AppLayout } from '@/components/AppLayout';
import { EmptyState, QuickActionsPanel, RecentIncidentsList, StatCard, StatusChip } from '@/components/shared';
import type { DashboardStats } from '@/lib/hooks';
import { fadeIn } from '@/lib/theme';
import {
  Add,
  Description,
  HourglassEmpty,
  RateReview,
  ThumbUp,
} from '@mui/icons-material';
import { Box, Grid, Stack, Typography } from '@mui/material';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

export default function SupervisorDashboard({ stats, session }: { stats: DashboardStats; session: any }) {
  const router = useRouter();

  const statCards = [
    { title: 'My Reports', value: stats.myReports?.total || 0, icon: <Description fontSize="large" />, color: 'primary' as const, subtitle: 'Total submitted' },
    { title: 'Team Reports', value: stats.teamReports || 0, icon: <RateReview fontSize="large" />, color: 'info' as const, subtitle: 'All time' },
    { title: 'In Progress', value: stats.myReports?.inProgress || 0, icon: <HourglassEmpty fontSize="large" />, color: 'warning' as const, subtitle: 'Currently active' },
    { title: 'Resolved', value: stats.myReports?.resolved || 0, icon: <ThumbUp fontSize="large" />, color: 'success' as const, subtitle: 'Closed cases' },
  ];

  const quickActions = [
    { label: 'Report New Incident', icon: <Add />, href: '/incidents/new' },
    { label: `My Reports (${stats.myReports?.total || 0})`, icon: <Description />, href: '/incidents?mine=true' },
    { label: `Team Reports (${stats.teamReports || 0})`, icon: <RateReview />, href: '/incidents?team=true' },
  ];

  const myRecentReports = (stats.myRecentReports || []).slice(0, 5).map((report) => ({
    id: String(report.id),
    status: report.status,
    reporter: session?.user?.name || 'You',
    createdAt: report.createdAt,
    occurrenceCategory: report.occurrenceCategory,
  }));

  return (
    <AppLayout>
      <Box>
        <motion.div {...{ ...fadeIn, transition: { ...fadeIn.transition, ease: ['easeInOut'] } }}>
          <Stack spacing={3}>
            {/* Welcome Header */}
            <Box>
              <Typography variant="h4" fontWeight={700} gutterBottom>
                Supervisor Dashboard
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Welcome back, {session?.user?.name} • Review & Approve Incident Reports
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
              {/* Action Items */}
              <Grid size={{ xs: 12, md: 4 }}>
                <QuickActionsPanel title="Supervisor Actions" actions={quickActions} />
              </Grid>

              {/* Recent Reports */}
              <Grid size={{ xs: 12, md: 8 }}>
                {myRecentReports.length > 0 ? (
                  <RecentIncidentsList
                    incidents={myRecentReports}
                    title="My Recent Reports"
                    showViewAll
                    onViewAll={() => router.push('/incidents?mine=true')}
                  />
                ) : (
                  <EmptyState
                    icon={<Description sx={{ fontSize: 64 }} />}
                    title="No reports yet"
                    description="Start by reporting a new incident"
                  />
                )}
              </Grid>
            </Grid>
          </Stack>
        </motion.div>
      </Box>
    </AppLayout>
  );
}
