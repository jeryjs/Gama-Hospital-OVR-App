'use client';

import { AppLayout } from '@/components/AppLayout';
import type { DashboardStats } from '@/lib/hooks';
import { fadeIn } from '@/lib/theme';
import {
  Add,
  CheckCircle,
  Description,
  Edit,
  PendingActions,
  Visibility
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

export default function EmployeeDashboard({ stats, session }: { stats: DashboardStats; session: any }) {
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
    submitted: 'Submitted',
    supervisor_approved: 'Supervisor Approved',
    hod_assigned: 'Under Investigation',
    qi_final_review: 'QI Review',
    closed: 'Closed',
  };

  const statCards = [
    {
      title: 'Total Reports',
      value: stats.myReports?.total || 0,
      icon: <Description fontSize="large" />,
      color: 'primary.main',
      subtitle: 'All time',
    },
    {
      title: 'Drafts',
      value: stats.myReports?.drafts || 0,
      icon: <Edit fontSize="large" />,
      color: 'warning.main',
      subtitle: 'Not submitted',
      action: () => router.push('/incidents?status=draft&mine=true'),
    },
    {
      title: 'In Progress',
      value: stats.myReports?.inProgress || 0,
      icon: <PendingActions fontSize="large" />,
      color: 'info.main',
      subtitle: 'Being reviewed',
    },
    {
      title: 'Resolved',
      value: stats.myReports?.resolved || 0,
      icon: <CheckCircle fontSize="large" />,
      color: 'success.main',
      subtitle: 'Completed',
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
                Welcome back, {session?.user?.name?.split(' ')[0]}!
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Track your incident reports and create new ones
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
                        cursor: stat.action ? 'pointer' : 'default',
                        '&:hover': {
                          transform: 'translateY(-4px)',
                          boxShadow: 6,
                        },
                      }}
                    >
                      <CardContent>
                        <Stack spacing={2}>
                          <Box
                            sx={{
                              p: 1.5,
                              borderRadius: 2,
                              bgcolor: (theme) => alpha(theme.palette[stat.color.split('.')[0] as 'primary'].main, 0.1),
                              color: stat.color,
                              alignSelf: 'flex-start',
                            }}
                          >
                            {stat.icon}
                          </Box>
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
              {/* Quick Actions */}
              <Grid size={{ xs: 12, md: 4 }}>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Quick Actions
                  </Typography>
                  <Stack spacing={2} mt={2}>
                    <Button
                      fullWidth
                      variant="contained"
                      size="large"
                      startIcon={<Add />}
                      onClick={() => router.push('/incidents/new')}
                      sx={{ justifyContent: 'flex-start', py: 2 }}
                    >
                      Report New Incident
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Edit />}
                      onClick={() => router.push('/incidents?status=draft&mine=true')}
                      sx={{ justifyContent: 'flex-start', py: 1.5 }}
                    >
                      Continue Draft ({stats.myReports?.drafts || 0})
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Visibility />}
                      onClick={() => router.push('/incidents?mine=true')}
                      sx={{ justifyContent: 'flex-start', py: 1.5 }}
                    >
                      View All My Reports
                    </Button>
                  </Stack>

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
                      Reports are automatically saved as drafts. You can come back anytime to complete them.
                    </Typography>
                  </Box>
                </Paper>
              </Grid>

              {/* My Recent Reports */}
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
                                  bgcolor: (theme) => alpha(statusColors[report.status], 0.2),
                                  color: statusColors[report.status],
                                }}
                              >
                                {report.status === 'draft' ? (
                                  <Edit fontSize="small" />
                                ) : report.status === 'closed' ? (
                                  <CheckCircle fontSize="small" />
                                ) : (
                                  <PendingActions fontSize="small" />
                                )}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Typography variant="body2" fontWeight={600}>
                                    {report.refNo}
                                  </Typography>
                                  {report.status === 'draft' && (
                                    <Chip
                                      label="DRAFT"
                                      size="small"
                                      color="warning"
                                      sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                                    />
                                  )}
                                </Stack>
                              }
                              secondary={`${format(new Date(report.createdAt), 'MMM dd, yyyy HH:mm')} • ${report.occurrenceCategory?.replace(/_/g, ' ') || 'Uncategorized'}`}
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
                      <Typography variant="body2" color="text.secondary" mb={3}>
                        Report your first incident to get started
                      </Typography>
                      <Button
                        variant="contained"
                        startIcon={<Add />}
                        onClick={() => router.push('/incidents/new')}
                      >
                        Create First Report
                      </Button>
                    </Box>
                  )}
                </Paper>
              </Grid>

              {/* Reporting Guidelines */}
              <Grid size={{ xs: 12 }}>
                <Paper sx={{ p: 3, bgcolor: (theme) => alpha(theme.palette.primary.main, 0.02) }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    📋 Reporting Guidelines
                  </Typography>
                  <Grid container spacing={2} mt={1}>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={600} color="primary" gutterBottom>
                          What to Report
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Any incident, near-miss, or safety concern that could affect patients or staff
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={600} color="primary" gutterBottom>
                          When to Report
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          As soon as possible after the incident occurs or is discovered
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={600} color="primary" gutterBottom>
                          Confidentiality
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          All reports are confidential and used for quality improvement only
                        </Typography>
                      </Box>
                    </Grid>
                    <Grid size={{ xs: 12, md: 3 }}>
                      <Box>
                        <Typography variant="subtitle2" fontWeight={600} color="primary" gutterBottom>
                          Non-Punitive
                        </Typography>
                        <Typography variant="caption" color="text.secondary">
                          Reporting helps improve safety - no blame or punishment
                        </Typography>
                      </Box>
                    </Grid>
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
