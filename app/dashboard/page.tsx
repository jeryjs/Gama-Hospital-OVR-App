'use client';

import { AppLayout } from '@/components/AppLayout';
import { CardLoadingFallback } from '@/components/LoadingFallback';
import { getPrimaryRole } from '@/lib/auth-helpers';
import { formatErrorForAlert } from '@/lib/client/error-handler';
import { APP_ROLES } from '@/lib/constants';
import { useDashboardStats } from '@/lib/hooks';
import {
  Box,
  Grid,
  Stack
} from '@mui/material';
import { useSession } from 'next-auth/react';
import AdminDashboard from './AdminDashboard';
import EmployeeDashboard from './EmployeeDashboard';
import HODDashboard from './HODDashboard';
import QIDashboard from './QIDashboard';
import SupervisorDashboard from './SupervisorDashboard';

// Main page component with Suspense boundary
export default function DashboardPage() {
  const { data: session } = useSession();
  const { stats, error, isLoading } = useDashboardStats();

  // Loading skeleton
  if (isLoading) {
    return (
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
    );
  }

  // Error state
  if (error) {
    return (
      <AppLayout>
        <Box sx={{ maxWidth: 1400, mx: 'auto', py: 4 }}>
          <Box color="error.main">
            Failed to load dashboard stats. {formatErrorForAlert(error)}
          </Box>
        </Box>
      </AppLayout>
    );
  }

  // Determine primary role from user's roles array
  const primaryRole = getPrimaryRole(session?.user?.roles || []);

  // Route to appropriate dashboard based on highest priority role
  if (primaryRole === APP_ROLES.SUPER_ADMIN || primaryRole === APP_ROLES.TECH_ADMIN || primaryRole === APP_ROLES.DEVELOPER) {
    return <AdminDashboard stats={stats} session={session} />;
  }

  if (primaryRole === APP_ROLES.QUALITY_MANAGER || primaryRole === APP_ROLES.QUALITY_ANALYST) {
    return <QIDashboard stats={stats} session={session} />;
  }

  if (primaryRole === APP_ROLES.DEPARTMENT_HEAD || primaryRole === APP_ROLES.ASSISTANT_DEPT_HEAD) {
    return <HODDashboard stats={stats} session={session} />;
  }

  if (primaryRole === APP_ROLES.SUPERVISOR || primaryRole === APP_ROLES.TEAM_LEAD) {
    return <SupervisorDashboard stats={stats} session={session} />;
  }

  // Default: Employee/Staff Dashboard
  return <EmployeeDashboard stats={stats} session={session} />;
}
