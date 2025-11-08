'use client';

import { AppLayout } from '@/components/AppLayout';
import { CardLoadingFallback } from '@/components/LoadingFallback';
import { useDashboardStats } from '@/lib/hooks';
import type { DashboardStats } from '@/lib/hooks';
import {
  CheckCircle,
  Description,
  PendingActions,
  Warning
} from '@mui/icons-material';
import {
  alpha,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  Paper,
  Stack,
  Typography
} from '@mui/material';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { Suspense } from 'react';
import { fadeIn } from '@/lib/theme';
import AdminDashboard from './AdminDashboard';
import QIDashboard from './QIDashboard';
import HODDashboard from './HODDashboard';

export type { DashboardStats };

// Inner component that uses the hook - will suspend while loading
function DashboardContent() {
  const { data: session } = useSession();
  const { stats } = useDashboardStats(); // This will suspend
  const userRole = session?.user?.role;

  // Route to appropriate dashboard based on role
  if (userRole === 'admin') {
    return <AdminDashboard stats={stats} session={session} />;
  }

  if (userRole === 'quality_manager') {
    return <QIDashboard stats={stats} session={session} />;
  }

  if (userRole === 'department_head') {
    return <HODDashboard stats={stats} session={session} />;
  }

  // Default Dashboard for other roles (staff, supervisor)
  return <DefaultDashboard stats={stats} session={session} />;
}

// Main page component with Suspense boundary
export default function DashboardPage() {
  return (
    <Suspense fallback={
      <AppLayout>
        <Box sx={{ maxWidth: 1400, mx: 'auto', py: 4 }}>
          <Stack spacing={3}>
            <CardLoadingFallback />
            <Grid container spacing={3}>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <CardLoadingFallback />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <CardLoadingFallback />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <CardLoadingFallback />
              </Grid>
              <Grid size={{ xs: 12, sm: 6, lg: 3 }}>
                <CardLoadingFallback />
              </Grid>
            </Grid>
          </Stack>
        </Box>
      </AppLayout>
    }>
      <DashboardContent />
    </Suspense>
  );
}

// Admin Dashboard Component


// Default Dashboard for non-admin users
function DefaultDashboard({ stats, session }: { stats: DashboardStats; session: any }) {
  const router = useRouter();

  const statCards = [
    {
      title: 'Total Reports',
      value: stats.total,
      icon: <Description />,
      color: '#00E599',
    },
    {
      title: 'Drafts',
      value: stats.drafts,
      icon: <PendingActions />,
      color: '#F59E0B',
    },
    {
      title: 'Submitted',
      value: stats.submitted,
      icon: <Warning />,
      color: '#3B82F6',
    },
    {
      title: 'Resolved',
      value: stats.resolved,
      icon: <CheckCircle />,
      color: '#10B981',
    },
  ];

  return (
    <AppLayout>
      <Box>
        <motion.div {...{ ...fadeIn, transition: { ...fadeIn.transition, ease: ['easeInOut'] } }}>
          <Stack spacing={3}>
            <Box>
              <Typography variant="h4" gutterBottom fontWeight={700}>
                Welcome back, {session?.user?.name?.split(' ')[0]}
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Here's an overview of your OVR reports
              </Typography>
            </Box>

            <Grid container spacing={3}>
              {statCards.map((stat, index) => (
                <Grid size={{ xs: 12, sm: 6, md: 3 }} key={stat.title}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card
                      sx={{
                        height: '100%',
                        borderLeft: `4px solid ${stat.color}`,
                        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: (theme) =>
                            `0 8px 24px ${alpha(stat.color, 0.2)}`,
                        },
                      }}
                    >
                      <CardContent>
                        <Stack
                          direction="row"
                          justifyContent="space-between"
                          alignItems="flex-start"
                        >
                          <Box>
                            <Typography
                              variant="body2"
                              color="text.secondary"
                              gutterBottom
                            >
                              {stat.title}
                            </Typography>
                            <Typography variant="h3" fontWeight={700}>
                              {stat.value}
                            </Typography>
                          </Box>
                          <Box
                            sx={{
                              p: 1.5,
                              borderRadius: 2,
                              bgcolor: alpha(stat.color, 0.1),
                              color: stat.color,
                            }}
                          >
                            {stat.icon}
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>

            <Paper sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom fontWeight={600}>
                Quick Actions
              </Typography>
              <Stack direction="row" spacing={2} sx={{ mt: 2 }}>
                <Chip
                  label="New Report"
                  clickable
                  color="primary"
                  onClick={() => router.push('/incidents/new')}
                  sx={{ px: 2, py: 3, fontSize: '0.9rem' }}
                />
                <Chip
                  label="View All Reports"
                  clickable
                  variant="outlined"
                  onClick={() => router.push('/incidents')}
                  sx={{ px: 2, py: 3, fontSize: '0.9rem' }}
                />
              </Stack>
            </Paper>
          </Stack>
        </motion.div>
      </Box>
    </AppLayout>
  );
}