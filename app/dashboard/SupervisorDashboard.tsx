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
    submitted: '#3B82F6',
    supervisor_approved: '#10B981',
    hod_assigned: '#F59E0B',
    qi_final_review: '#EC4899',
    closed: '#059669',
  };

  const statusLabels: Record<string, string> = {
    draft: 'Draft',
    submitted: 'Needs Review',
    supervisor_approved: 'Approved',
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
      title: 'Pending Review',
      value: stats.supervisorPending || 0,
      icon: <HourglassEmpty fontSize="large" />,
      color: 'warning.main',
      subtitle: 'Need approval',
      urgent: true,
      action: () => router.push('/incidents?status=submitted'),
    },
    {
      title: 'Approved by Me',
      value: stats.supervisorApproved || 0,
      icon: <ThumbUp fontSize="large" />,
      color: 'success.main',
      subtitle: 'This month',
    },
    {
      title: 'Team Reports',
      value: stats.teamReports || 0,
      icon: <RateReview fontSize="large" />,
      color: 'info.main',
      subtitle: 'All time',
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
                      onClick={stat.action}
                      sx={{
                        height: '100%',
                        transition: 'all 0.3s',
                        border: stat.urgent ? 2 : 0,
                        borderColor: stat.urgent ? stat.color : 'transparent',
                        cursor: stat.action ? 'pointer' : 'default',
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
                            {stat.urgent && (
                              <Chip
                                label="ACTION NEEDED"
                                size="small"
                                color="warning"
                                sx={{ fontWeight: 700, fontSize: '0.65rem' }}
                              />
                            )}
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
                    <Box
                      onClick={() => router.push('/incidents?status=submitted')}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: 2,
                        borderColor: 'warning.main',
                        bgcolor: (theme) => alpha(theme.palette.warning.main, 0.05),
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          bgcolor: (theme) => alpha(theme.palette.warning.main, 0.1),
                          transform: 'translateX(4px)',
                        },
                      }}
                    >
                      <Stack direction="row" spacing={2} alignItems="center">
                        <Box
                          sx={{
                            width: 56,
                            height: 56,
                            borderRadius: 2,
                            bgcolor: 'warning.main',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Typography variant="h4" fontWeight={700}>
                            {stats.supervisorPending || 0}
                          </Typography>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" fontWeight={600}>
                            Review & Approve
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Reports waiting for your review
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>

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

              {/* Pending Approvals */}
              <Grid size={{ xs: 12, md: 8 }}>
                <Paper sx={{ p: 3 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" fontWeight={600}>
                      Reports Pending Your Approval
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => router.push('/incidents?status=submitted')}
                    >
                      View All
                    </Button>
                  </Stack>

                  {stats.supervisorPendingReports && stats.supervisorPendingReports.length > 0 ? (
                    <List>
                      {stats.supervisorPendingReports.slice(0, 5).map((report, index) => (
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
                                  bgcolor: (theme) => alpha(theme.palette.warning.main, 0.2),
                                  color: 'warning.main',
                                }}
                              >
                                <PendingActions fontSize="small" />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Typography variant="body2" fontWeight={600}>
                                    {report.refNo}
                                  </Typography>
                                  <Chip
                                    label="REVIEW NEEDED"
                                    size="small"
                                    color="warning"
                                    sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                                  />
                                </Stack>
                              }
                              secondary={`Reported by ${report.reporter.firstName} ${report.reporter.lastName} • ${format(new Date(report.createdAt), 'MMM dd, HH:mm')}`}
                            />
                            <Chip
                              label="Pending"
                              size="small"
                              sx={{
                                bgcolor: (theme) => alpha(theme.palette.warning.main, 0.1),
                                color: 'warning.main',
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
                      <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary" gutterBottom>
                        All caught up!
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        No reports pending your approval
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>

              {/* Recently Approved */}
              <Grid size={{ xs: 12 }}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Recently Approved by You
                  </Typography>

                  {stats.supervisorApprovedReports && stats.supervisorApprovedReports.length > 0 ? (
                    <List>
                      {stats.supervisorApprovedReports.slice(0, 3).map((report, index) => (
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
                                  bgcolor: (theme) => alpha(theme.palette.success.main, 0.2),
                                  color: 'success.main',
                                }}
                              >
                                <Done fontSize="small" />
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={report.refNo}
                              secondary={`Approved on ${format(new Date(report.supervisorApprovedAt || report.createdAt), 'MMM dd, yyyy')} • Now with QI Department`}
                              primaryTypographyProps={{ fontWeight: 600 }}
                            />
                            <Chip
                              label={statusLabels[report.status]}
                              size="small"
                              sx={{
                                bgcolor: (theme) => alpha(statusColors[report.status], 0.1),
                                color: statusColors[report.status],
                                fontWeight: 600,
                              }}
                            />
                          </ListItem>
                          {index < 2 && <Divider />}
                        </Box>
                      ))}
                    </List>
                  ) : (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <Typography variant="body2" color="text.secondary">
                        No recently approved reports
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>
            </Grid>
          </Stack>
        </motion.div>
      </Box>
    </AppLayout>
  );
}
