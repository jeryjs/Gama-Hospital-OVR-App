'use client';

import { AppLayout } from '@/components/AppLayout';
import { DashboardStats } from '@/lib/hooks';
import { fadeIn } from '@/lib/theme';
import {
  Add,
  Assignment,
  AssignmentInd,
  CheckCircle,
  Description,
  Feedback,
  PendingActions,
  TrendingDown,
  TrendingUp
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
  LinearProgress,
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

export default function QIDashboard({ stats, session }: { stats: DashboardStats; session: any }) {
  const router = useRouter();

  const statusColors: Record<string, string> = {
    draft: '#6B7280',
    submitted: '#3B82F6',
    qi_review: '#10B981',
    investigating: '#F59E0B',
    qi_final_actions: '#EC4899',
    closed: '#059669',
  };

  const statusLabels: Record<string, string> = {
    draft: 'Draft',
    submitted: 'Submitted',
    qi_review: 'QI Review',
    investigating: 'Investigating',
    qi_final_actions: 'Final Actions',
    closed: 'Closed',
  };

  // QI-specific stats
  const primaryStats = [
    {
      title: 'Total Incidents',
      value: stats.total,
      icon: <Description fontSize="large" />,
      color: 'primary.main',
      subtitle: 'All time',
    },
    {
      title: 'Needs Investigation Assignment',
      value: stats.byStatus.qi_review,
      icon: <AssignmentInd fontSize="large" />,
      color: 'warning.main',
      subtitle: 'Awaiting action',
      urgent: true,
    },
    {
      title: 'Awaiting Final Actions',
      value: stats.byStatus.qi_final_actions,
      icon: <Feedback fontSize="large" />,
      color: 'secondary.main',
      subtitle: 'Needs feedback',
      urgent: true,
    },
    {
      title: 'Closed This Month',
      value: stats.closedThisMonth || 0,
      icon: <CheckCircle fontSize="large" />,
      color: 'success.main',
      subtitle: 'Successfully resolved',
    },
  ];

  // Action items for QI
  const actionItems = [
    {
      title: 'Assign Investigation',
      count: stats.byStatus.qi_review,
      description: 'Incidents need investigation assignment',
      color: '#10B981',
      action: () => router.push('/incidents/qi/review'),
    },
    {
      title: 'Review Actions',
      count: stats.byStatus.qi_final_actions,
      description: 'Corrective actions need review',
      color: '#EC4899',
      action: () => router.push('/actions'),
    },
    {
      title: 'Under Investigation',
      count: stats.byStatus.investigating,
      description: 'Active investigations in progress',
      color: '#3B82F6',
      action: () => router.push('/investigations'),
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
                Quality & Improvement Dashboard
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Welcome back, {session?.user?.name} • Monitor & Review OVR Reports
              </Typography>
            </Box>

            {/* Primary Stats */}
            <Grid container spacing={3}>
              {primaryStats.map((stat, index) => (
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
                        border: (stat.urgent && stat.value > 0) ? 2 : 0,
                        borderColor: (stat.urgent && stat.value > 0) ? stat.color : 'transparent',
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
                            {stat.urgent && stat.value > 0 && (
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
              <Grid size={{ xs: 12, lg: 4 }}>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Your Action Items
                  </Typography>
                  <Stack spacing={2} mt={2}>
                    {actionItems.map((item, index) => (
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
                    {[
                      { status: 'submitted', label: 'New Submissions', icon: <Assignment /> },
                      { status: 'qi_review', label: 'Pending HOD Assignment', icon: <AssignmentInd /> },
                      { status: 'investigating', label: 'Under Investigation', icon: <PendingActions /> },
                      { status: 'qi_final_actions', label: 'Awaiting Your Review', icon: <Feedback /> },
                      { status: 'closed', label: 'Resolved & Closed', icon: <CheckCircle /> },
                    ].map((workflow) => {
                      const count = stats.byStatus[workflow.status as keyof typeof stats.byStatus];
                      const percentage = stats.total > 0 ? (count / stats.total) * 100 : 0;

                      return (
                        <Box key={workflow.status}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                            <Stack direction="row" spacing={1} alignItems="center">
                              <Box sx={{ color: statusColors[workflow.status] }}>
                                {workflow.icon}
                              </Box>
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
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              bgcolor: (theme) => alpha(statusColors[workflow.status], 0.1),
                              '& .MuiLinearProgress-bar': {
                                bgcolor: statusColors[workflow.status],
                                borderRadius: 4,
                              },
                            }}
                          />
                        </Box>
                      );
                    })}
                  </Stack>
                </Paper>
              </Grid>

              {/* Recent Incidents */}
              <Grid size={{ xs: 12 }}>
                <Paper sx={{ p: 3 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" fontWeight={600}>
                      Recent Incidents Requiring Attention
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => router.push('/incidents')}
                    >
                      View All
                    </Button>
                  </Stack>
                  <List>
                    {stats.recentIncidents
                      .filter((inc) => ['qi_review', 'qi_final_actions'].includes(inc.status))
                      .slice(0, 6)
                      .map((incident, index) => (
                        <Box key={incident.id}>
                          <ListItem
                            component={Link}
                            href={`/incidents/view/${incident.id}`}
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
                                  bgcolor: (theme) => alpha(statusColors[incident.status], 0.2),
                                  color: statusColors[incident.status],
                                }}
                              >
                                {incident.status === 'qi_review' ? (
                                  <AssignmentInd fontSize="small" />
                                ) : (
                                  <Feedback fontSize="small" />
                                )}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Typography variant="body2" fontWeight={600}>
                                    {incident.id}
                                  </Typography>
                                  {incident.status === 'qi_review' && (
                                    <Chip
                                      label="ASSIGN HOD"
                                      size="small"
                                      color="warning"
                                      sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                                    />
                                  )}
                                  {incident.status === 'qi_final_actions' && (
                                    <Chip
                                      label="REVIEW NEEDED"
                                      size="small"
                                      color="secondary"
                                      sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                                    />
                                  )}
                                </Stack>
                              }
                              secondary={`${incident.reporter.firstName} ${incident.reporter.lastName} • ${format(new Date(incident.createdAt), 'MMM dd, HH:mm')} • ${incident.occurrenceCategory.replace(/_/g, ' ')}`}
                            />
                            <Chip
                              label={statusLabels[incident.status]}
                              size="small"
                              sx={{
                                bgcolor: (theme) => alpha(statusColors[incident.status], 0.1),
                                color: statusColors[incident.status],
                                fontWeight: 600,
                              }}
                            />
                          </ListItem>
                          {index < 5 && <Divider />}
                        </Box>
                      ))}
                  </List>

                  {stats.recentIncidents.filter((inc) => ['qi_review', 'qi_final_actions'].includes(inc.status)).length === 0 && (
                    <Box sx={{ textAlign: 'center', py: 4 }}>
                      <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                      <Typography variant="h6" color="text.secondary">
                        All caught up!
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        No incidents requiring immediate attention
                      </Typography>
                    </Box>
                  )}
                </Paper>
              </Grid>

              {/* Quick Actions */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Quick Actions
                  </Typography>
                  <Stack spacing={2} mt={2}>
                    <Button
                      fullWidth
                      variant="contained"
                      startIcon={<Add />}
                      onClick={() => router.push('/incidents/new')}
                      sx={{ justifyContent: 'flex-start', py: 1.5 }}
                    >
                      Create New Report
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<AssignmentInd />}
                      onClick={() => router.push('/incidents?status=qi_review')}
                      sx={{ justifyContent: 'flex-start', py: 1.5 }}
                    >
                      Assign HODs ({stats.byStatus.qi_review})
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Feedback />}
                      onClick={() => router.push('/incidents?status=qi_final_actions')}
                      sx={{ justifyContent: 'flex-start', py: 1.5 }}
                    >
                      Review & Close ({stats.byStatus.qi_final_actions})
                    </Button>
                  </Stack>
                </Paper>
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
