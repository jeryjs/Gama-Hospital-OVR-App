'use client';

import { AppLayout } from '@/components/AppLayout';
import { DashboardStats } from '@/lib/hooks';
import { fadeIn } from '@/lib/theme';
import {
  Add,
  Assignment,
  CheckCircle,
  Description,
  Gavel,
  PendingActions,
  PersonAdd,
  RateReview,
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

export default function HODDashboard({ stats, session }: { stats: DashboardStats; session: any }) {
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
    supervisor_approved: 'Approved',
    hod_assigned: 'Under Investigation',
    qi_final_review: 'QI Review',
    closed: 'Closed',
  };

  // HOD-specific stats
  const primaryStats = [
    {
      title: 'Assigned to Me',
      value: stats.assignedToMe || 0,
      icon: <Assignment fontSize="large" />,
      color: 'primary.main',
      subtitle: 'Total cases',
    },
    {
      title: 'Pending Action',
      value: stats.myPendingInvestigations || 0,
      icon: <Gavel fontSize="large" />,
      color: 'warning.main',
      subtitle: 'Need investigators',
      urgent: true,
    },
    {
      title: 'Under Investigation',
      value: stats.myActiveInvestigations || 0,
      icon: <PendingActions fontSize="large" />,
      color: 'info.main',
      subtitle: 'In progress',
    },
    {
      title: 'Completed',
      value: stats.myCompletedInvestigations || 0,
      icon: <CheckCircle fontSize="large" />,
      color: 'success.main',
      subtitle: 'Resolved cases',
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
                Department Head Dashboard
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Welcome back, {session?.user?.name} • Manage Your Department's Investigations
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
              {/* Investigation Tasks */}
              <Grid size={{ xs: 12, lg: 4 }}>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Investigation Tasks
                  </Typography>
                  <Stack spacing={2} mt={2}>
                    <Box
                      onClick={() => router.push('/incidents?assignedToMe=true&needsInvestigator=true')}
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
                            {stats.myPendingInvestigations || 0}
                          </Typography>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" fontWeight={600}>
                            Assign Investigators
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Cases need investigation team
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>

                    <Box
                      onClick={() => router.push('/incidents?assignedToMe=true&status=hod_assigned')}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: 1,
                        borderColor: 'divider',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: 'info.main',
                          bgcolor: (theme) => alpha(theme.palette.info.main, 0.05),
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
                            bgcolor: (theme) => alpha(theme.palette.info.main, 0.1),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Typography variant="h5" fontWeight={700} color="info.main">
                            {stats.myActiveInvestigations || 0}
                          </Typography>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" fontWeight={600}>
                            Review Progress
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Active investigations
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>

                    <Box
                      onClick={() => router.push('/incidents?assignedToMe=true&needsFindings=true')}
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        border: 1,
                        borderColor: 'divider',
                        cursor: 'pointer',
                        transition: 'all 0.2s',
                        '&:hover': {
                          borderColor: 'secondary.main',
                          bgcolor: (theme) => alpha(theme.palette.secondary.main, 0.05),
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
                            bgcolor: (theme) => alpha(theme.palette.secondary.main, 0.1),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                          }}
                        >
                          <Typography variant="h5" fontWeight={700} color="secondary.main">
                            {stats.myNeedingFindings || 0}
                          </Typography>
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Typography variant="subtitle2" fontWeight={600}>
                            Submit Findings
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            Ready for final report
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>

              {/* My Assigned Cases */}
              <Grid size={{ xs: 12, lg: 8 }}>
                <Paper sx={{ p: 3 }}>
                  <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                    <Typography variant="h6" fontWeight={600}>
                      Cases Assigned to You
                    </Typography>
                    <Button
                      size="small"
                      onClick={() => router.push('/incidents?assignedToMe=true')}
                    >
                      View All
                    </Button>
                  </Stack>

                  <List>
                    {stats.myAssignedIncidents && stats.myAssignedIncidents.length > 0 ? (
                      stats.myAssignedIncidents.slice(0, 6).map((incident, index) => (
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
                                {incident.needsInvestigator ? (
                                  <PersonAdd fontSize="small" />
                                ) : incident.needsFindings ? (
                                  <RateReview fontSize="small" />
                                ) : (
                                  <PendingActions fontSize="small" />
                                )}
                              </Avatar>
                            </ListItemAvatar>
                            <ListItemText
                              primary={
                                <Stack direction="row" spacing={1} alignItems="center">
                                  <Typography variant="body2" fontWeight={600}>
                                    {incident.refNo}
                                  </Typography>
                                  {incident.needsInvestigator && (
                                    <Chip
                                      label="ASSIGN INVESTIGATOR"
                                      size="small"
                                      color="warning"
                                      sx={{ height: 20, fontSize: '0.65rem', fontWeight: 700 }}
                                    />
                                  )}
                                  {incident.needsFindings && (
                                    <Chip
                                      label="SUBMIT FINDINGS"
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
                      ))
                    ) : (
                      <Box sx={{ textAlign: 'center', py: 6 }}>
                        <CheckCircle sx={{ fontSize: 64, color: 'success.main', mb: 2 }} />
                        <Typography variant="h6" color="text.secondary">
                          No cases assigned
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          You'll see new cases here when they're assigned to you
                        </Typography>
                      </Box>
                    )}
                  </List>
                </Paper>
              </Grid>

              {/* Investigation Progress */}
              <Grid size={{ xs: 12, md: 6 }}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Investigation Progress
                  </Typography>
                  <Stack spacing={2} mt={2}>
                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="body2" fontWeight={500}>
                          Need Investigators
                        </Typography>
                        <Typography variant="body2" fontWeight={700}>
                          {stats.myPendingInvestigations || 0}
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={stats.assignedToMe ? ((stats.myPendingInvestigations || 0) / stats.assignedToMe) * 100 : 0}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: (theme) => alpha(theme.palette.warning.main, 0.1),
                          '& .MuiLinearProgress-bar': {
                            bgcolor: 'warning.main',
                            borderRadius: 4,
                          },
                        }}
                      />
                    </Box>

                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="body2" fontWeight={500}>
                          Under Investigation
                        </Typography>
                        <Typography variant="body2" fontWeight={700}>
                          {stats.myActiveInvestigations || 0}
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={stats.assignedToMe ? ((stats.myActiveInvestigations || 0) / stats.assignedToMe) * 100 : 0}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: (theme) => alpha(theme.palette.info.main, 0.1),
                          '& .MuiLinearProgress-bar': {
                            bgcolor: 'info.main',
                            borderRadius: 4,
                          },
                        }}
                      />
                    </Box>

                    <Box>
                      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                        <Typography variant="body2" fontWeight={500}>
                          Completed
                        </Typography>
                        <Typography variant="body2" fontWeight={700}>
                          {stats.myCompletedInvestigations || 0}
                        </Typography>
                      </Stack>
                      <LinearProgress
                        variant="determinate"
                        value={stats.assignedToMe ? ((stats.myCompletedInvestigations || 0) / stats.assignedToMe) * 100 : 0}
                        sx={{
                          height: 8,
                          borderRadius: 4,
                          bgcolor: (theme) => alpha(theme.palette.success.main, 0.1),
                          '& .MuiLinearProgress-bar': {
                            bgcolor: 'success.main',
                            borderRadius: 4,
                          },
                        }}
                      />
                    </Box>
                  </Stack>
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
                      color="warning"
                      startIcon={<PersonAdd />}
                      onClick={() => router.push('/incidents?assignedToMe=true&needsInvestigator=true')}
                      sx={{ justifyContent: 'flex-start', py: 1.5 }}
                    >
                      Assign Investigators ({stats.myPendingInvestigations || 0})
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<RateReview />}
                      onClick={() => router.push('/incidents?assignedToMe=true&needsFindings=true')}
                      sx={{ justifyContent: 'flex-start', py: 1.5 }}
                    >
                      Submit Findings ({stats.myNeedingFindings || 0})
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Description />}
                      onClick={() => router.push('/incidents?assignedToMe=true')}
                      sx={{ justifyContent: 'flex-start', py: 1.5 }}
                    >
                      View All My Cases ({stats.assignedToMe || 0})
                    </Button>
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
