'use client';

import { AppLayout } from '@/components/AppLayout';
import type { DashboardStats } from '@/lib/hooks';
import { fadeIn } from '@/lib/theme';
import {
  Add,
  CheckCircle,
  Description,
  Done,
  HourglassEmpty,
  PendingActions,
  RateReview,
  ThumbUp,
} from '@mui/icons-material';
import {
  alpha,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  Paper,
  Stack,
  Typography,
} from '@mui/material';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function SupervisorDashboard({ stats, session }: { stats: DashboardStats; session: any }) {
  const router = useRouter();

  const statusColors: Record<string, string> = {
    draft: '#6B7280',
    // submitted: '#3B82F6', // REMOVED: No longer used
    // supervisor_approved: '#10B981', // REMOVED: Supervisor approval eliminated
    hod_assigned: '#F59E0B',
    qi_final_review: '#EC4899',
    closed: '#059669',
  };

  const statusLabels: Record<string, string> = {
    draft: 'Draft',
    // submitted: 'Needs Review', // REMOVED
    // supervisor_approved: 'Approved', // REMOVED
    hod_assigned: 'Under Investigation',
    qi_final_review: 'QI Review',
    closed: 'Closed',
  };

  const statCards = [
    {
      title: 'My Reports',
      value: stats.myReports?.total || 0,
      icon: <Description fontSize="large" />,
      color: 'primary.main',
      subtitle: 'Total submitted',
    },
    {
      title: 'Team Reports',
      value: stats.teamReports || 0,
      icon: <RateReview fontSize="large" />,
      color: 'info.main',
      subtitle: 'All time',
    },
    {
      title: 'In Progress',
      value: stats.myReports?.inProgress || 0,
      icon: <HourglassEmpty fontSize="large" />,
      color: 'warning.main',
      subtitle: 'Currently active',
    },
    {
      title: 'Resolved',
      value: stats.myReports?.resolved || 0,
      icon: <ThumbUp fontSize="large" />,
      color: 'success.main',
      subtitle: 'Closed cases',
    },
  ];

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
              {statCards.map((stat, index) => (
                <Grid size={{ xs: 12, sm: 6, lg: 3 }} key={stat.title}>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Card
                      sx={{
                        height: '100%',
                        transition: 'all 0.3s',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 6,
                        },
                      }}
                    >
                      <CardContent>
                        <Stack spacing={2}>
                          <Stack direction="row" justifyContent="space-between" alignItems="flex-start">
                            <Box
                              sx={{
                                p: 1.5,
                                borderRadius: 2,
                                bgcolor: (theme) => alpha(theme.palette[stat.color.split('.')[0] as 'primary'].main, 0.1),
                                color: stat.color,
                              }}
                            >
                              {stat.icon}
                            </Box>
                            <Chip
                              label={stat.value}
                              sx={{
                                bgcolor: (theme) => alpha(theme.palette[stat.color.split('.')[0] as 'primary'].main, 0.1),
                                color: stat.color,
                                fontWeight: 700,
                                fontSize: '0.875rem',
                              }}
                            />
                          </Stack>
                          <Box>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {stat.title}
                            </Typography>
                            <Typography variant="h3" fontWeight={700} mb={0.5}>
                              {stat.value}
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              {stat.subtitle}
                            </Typography>
                          </Box>
                        </Stack>
                      </CardContent>
                    </Card>
                  </motion.div>
                </Grid>
              ))}
            </Grid>

            <Grid container spacing={3}>
              {/* Action Items */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Supervisor Actions
                  </Typography>
                  <Stack spacing={2} mt={2}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<Add />}
                      onClick={() => router.push('/incidents/new')}
                      sx={{ justifyContent: 'flex-start', py: 2 }}
                    >
                      Report New Incident
                    </Button>

                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Description />}
                      onClick={() => router.push('/incidents?mine=true')}
                      sx={{ justifyContent: 'flex-start', py: 1.5 }}
                    >
                      My Reports ({stats.myReports?.total || 0})
                    </Button>

                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<RateReview />}
                      onClick={() => router.push('/incidents?team=true')}
                      sx={{ justifyContent: 'flex-start', py: 1.5 }}
                    >
                      Team Reports ({stats.teamReports || 0})
                    </Button>
                  </Stack>
                </Paper>
              </Grid>

              {/* Recent Reports */}
              <Grid size={{ xs: 12, md: 8 }}>
                <Paper sx={{ p: 3 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" fontWeight={600}>
                      My Recent Reports
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => router.push('/incidents?mine=true')}
                    >
                      View All
                    </Button>
                  </Stack>

                  {stats.myRecentReports && stats.myRecentReports.length > 0 ? (
                    <List>
                      {stats.myRecentReports.slice(0, 5).map((report, index) => (
                        <Box key={report.id}>
                          <ListItem
                            component={Link}
                            href={`/incidents/view/${report.id}`}
                            sx={{
                              borderRadius: 1,
                              mb: 1,
                              transition: 'all 0.2s',
                              '&:hover': {
                                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
                              },
                            }}
                          >
                            <ListItemAvatar>
                              <Avatar
                                sx={{
                                  bgcolor: (theme) => alpha(theme.palette.primary.main, 0.2),
                                  color: 'primary.main',
                                }}
                              >
                                <Description fontSize="small" />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Typography variant="body2" fontWeight={600}>
                                    {report.refNo}
                                  </Typography>
                                </Stack>
                              }
                              secondary={`${report.occurrenceCategory} • ${format(new Date(report.createdAt), 'MMM dd, HH:mm')}`}
                            />
                            <Chip
                              label={statusLabels[report.status] || report.status}
                              size="small"
                              sx={{
                                bgcolor: (theme) => alpha(statusColors[report.status] || '#6B7280', 0.1),
                                color: statusColors[report.status] || '#6B7280',
                                fontWeight: 600,
                              }}
                            />
                          </ListItem>
                          {index < 4 && <Divider />}
                        </Box>
                      ))}
                    </List>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 6 }}>
                      <Description sx={{ fontSize: 64, color: 'text.disabled', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        No reports yet
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Start by reporting a new incident
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>

              {/* REMOVED: Recently Approved Section - no longer applicable */}
            </Grid>
          </Stack>
        </motion.div>
      </Box>
    </AppLayout>
  );
}
