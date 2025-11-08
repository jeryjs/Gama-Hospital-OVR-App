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
import SupervisorDashboard from './SupervisorDashboard';
import EmployeeDashboard from './EmployeeDashboard';

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

  if (userRole === 'supervisor') {
    return <SupervisorDashboard stats={stats} session={session} />;
  }

  // Default: Employee/Staff Dashboard
  return <EmployeeDashboard stats={stats} session={session} />;
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
