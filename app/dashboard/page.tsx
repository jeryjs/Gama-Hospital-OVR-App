'use client';

import { AppLayout } from '@/components/AppLayout';
import { fadeIn } from '@/lib/theme';
import {
  CheckCircle,
  Description,
  PendingActions,
  Warning,
} from '@mui/icons-material';
import {
  alpha,
  Box,
  Card,
  CardContent,
  Chip,
  Grid,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useEffect, useState } from 'react';

interface DashboardStats {
  total: number;
  drafts: number;
  submitted: number;
  resolved: number;
}

export default function DashboardPage() {
  const { data: session } = useSession();
  const [stats, setStats] = useState<DashboardStats>({
    total: 0,
    drafts: 0,
    submitted: 0,
    resolved: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await fetch('/api/stats');
      if (res.ok) {
        const data = await res.json();
        setStats(data);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

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

  if (loading) {
    return (
      <AppLayout>
        <LinearProgress />
      </AppLayout>
    );
  }

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
                  onClick={() => (window.location.href = '/incidents/new')}
                  sx={{ px: 2, py: 3, fontSize: '0.9rem' }}
                />
                <Chip
                  label="View All Reports"
                  clickable
                  variant="outlined"
                  onClick={() => (window.location.href = '/incidents')}
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