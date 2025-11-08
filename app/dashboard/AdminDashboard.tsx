'use client';

import { AppLayout } from '@/components/AppLayout';
import { fadeIn } from '@/lib/theme';
import type { DashboardStats } from '@/lib/hooks';
import {
  Add,
  Assessment,
  Business,
  Description,
  Groups,
  PendingActions,
  Schedule,
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
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from '@mui/material';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function AdminDashboard({ stats, session }: { stats: DashboardStats; session: any }) {
  const router = useRouter();

  const statusLabels: Record<string, string> = {
    draft: 'Draft',
    submitted: 'Submitted',
    supervisor_approved: 'Supervisor Review',
    hod_assigned: 'Investigation',
    qi_final_review: 'QI Review',
    closed: 'Closed',
  };

  const statusColors: Record<string, string> = {
    draft: '#6B7280',
    submitted: '#3B82F6',
    supervisor_approved: '#10B981',
    hod_assigned: '#F59E0B',
    qi_final_review: '#EC4899',
    closed: '#059669',
  };

  const primaryStats = [
    {
      title: 'Total Incidents',
      value: stats.total,
      icon: <Description fontSize="large" />,
      color: 'primary.main',
      trend: '+12%',
    },
    {
      title: 'Active Users',
      value: stats.activeUsers,
      icon: <Groups fontSize="large" />,
      color: 'info.main',
      trend: '+5%',
    },
    {
      title: 'Pending Review',
      value: stats.byStatus.qi_final_review + stats.byStatus.supervisor_approved,
      icon: <PendingActions fontSize="large" />,
      color: 'warning.main',
      trend: '-3%',
    },
    {
      title: 'Avg Resolution',
      value: `${stats.avgResolutionTime}d`,
      icon: <Schedule fontSize="large" />,
      color: 'success.main',
      trend: '-8%',
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
                Admin Dashboard
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Welcome back, {session?.user?.name} • System Overview
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
                              label={stat.trend}
                              size="small"
                              color={stat.trend.startsWith('+') ? 'success' : 'error'}
                              sx={{ fontWeight: 600 }}
                            />
                          </Stack>
                          <Box>
                            <Typography variant="body2" color="text.secondary" gutterBottom>
                              {stat.title}
                            </Typography>
                            <Typography variant="h3" fontWeight={700}>
                              {stat.value}
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
              {/* Incident Pipeline */}
              <Grid size={{ xs: 12, lg: 8 }}>
                <Paper sx={{ p: 3, height: '100%' }}>
                  <Stack spacing={2}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Typography variant="h6" fontWeight={600}>
                        Incident Pipeline
                      </Typography>
                      <Button
                        size="small"
                        startIcon={<Assessment />}
                        onClick={() => router.push('/incidents')}
                      >
                        View All
                      </Button>
                    </Stack>

                    <Stack spacing={2}>
                      {Object.entries(stats.byStatus).map(([status, count]) => (
                        <Box key={status}>
                          <Stack direction="row" justifyContent="space-between" alignItems="center" mb={1}>
                            <Typography variant="body2" fontWeight={500}>
                              {statusLabels[status]}
                            </Typography>
                            <Typography variant="body2" fontWeight={700}>
                              {count}
                            </Typography>
                          </Stack>
                          <LinearProgress
                            variant="determinate"
                            value={(count / stats.total) * 100}
                            sx={{
                              height: 8,
                              borderRadius: 4,
                              bgcolor: (theme) => alpha(statusColors[status], 0.1),
                              '& .MuiLinearProgress-bar': {
                                bgcolor: statusColors[status],
                                borderRadius: 4,
                              },
                            }}
                          />
                        </Box>
                      ))}
                    </Stack>
                  </Stack>
                </Paper>
              </Grid>

              {/* Quick Actions */}
              <Grid size={{ xs: 12, lg: 4 }}>
                <Paper sx={{ p: 3, height: '100%' }}>
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
                      New Incident Report
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Groups />}
                      onClick={() => router.push('/users')}
                      sx={{ justifyContent: 'flex-start', py: 1.5 }}
                    >
                      Manage Users
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<Business />}
                      onClick={() => router.push('/departments')}
                      sx={{ justifyContent: 'flex-start', py: 1.5 }}
                    >
                      Manage Departments
                    </Button>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<TrendingUp />}
                      onClick={() => router.push('/analytics')}
                      sx={{ justifyContent: 'flex-start', py: 1.5 }}
                    >
                      View Analytics
                    </Button>
                  </Stack>
                </Paper>
              </Grid>

              {/* Department Breakdown */}
              <Grid size={{ xs: 12, lg: 6 }}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Incidents by Department
                  </Typography>
                  <TableContainer sx={{ mt: 2 }}>
                    <Table size="small">
                      <TableHead>
                        <TableRow>
                          <TableCell><strong>Department</strong></TableCell>
                          <TableCell align="right"><strong>Count</strong></TableCell>
                          <TableCell align="right"><strong>% of Total</strong></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {stats.byDepartment.slice(0, 5).map((dept) => (
                          <TableRow key={dept.department} hover>
                            <TableCell>{dept.department}</TableCell>
                            <TableCell align="right">
                              <Chip label={dept.count} size="small" />
                            </TableCell>
                            <TableCell align="right">
                              {((dept.count / stats.total) * 100).toFixed(1)}%
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                </Paper>
              </Grid>

              {/* Recent Activity */}
              <Grid size={{ xs: 12, lg: 6 }}>
                <Paper sx={{ p: 3 }}>
                  <Typography variant="h6" fontWeight={600} gutterBottom>
                    Recent Incidents
                  </Typography>
                  <List sx={{ mt: 1 }}>
                    {stats.recentIncidents.slice(0, 5).map((incident, index) => (
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
                              <Description fontSize="small" />
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={incident.refNo}
                            secondary={`${incident.reporter.firstName} ${incident.reporter.lastName} • ${format(new Date(incident.createdAt), 'MMM dd, HH:mm')}`}
                            primaryTypographyProps={{ fontWeight: 600 }}
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
                        {index < stats.recentIncidents.length - 1 && <Divider />}
                      </Box>
                    ))}
                  </List>
                </Paper>
              </Grid>
            </Grid>
          </Stack>
        </motion.div>
      </Box>
    </AppLayout>
  );
}