'use client';

import { fadeIn } from '@/lib/theme';
import { Microsoft as MicrosoftIcon } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Chip,
  Container,
  Divider,
  Grid,
  Link,
  Paper,
  Stack,
  TextField,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import { motion } from 'framer-motion';
import { signIn, useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

type LoginStep = 'staff_id' | 'password' | 'onboarding';

interface LookupResponse {
  employeeId: string | null;
  hasPassword: boolean;
  needsOnboarding: boolean;
  profile: {
    name: string;
    firstName: string;
    lastName: string;
    department: string;
    unit: string;
    position: string;
    email: string;
    emailVerified: boolean;
  };
  editable: {
    firstName: boolean;
    lastName: boolean;
    department: boolean;
    unit: boolean;
    position: boolean;
    email: boolean;
  };
}

function sanitizeCallbackUrl(rawUrl: string | null): string {
  const candidate = rawUrl || '/dashboard';
  if (candidate.includes('/login') || candidate.includes('%2Flogin') || candidate.length > 200) {
    return '/dashboard';
  }
  return candidate;
}

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [step, setStep] = useState<LoginStep>('staff_id');
  const [lookupResult, setLookupResult] = useState<LookupResponse | null>(null);
  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');
  const [onboardingPassword, setOnboardingPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    department: '',
    unit: '',
    position: '',
    email: '',
  });

  const [error, setError] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;

    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get('error');

    if (errorParam === 'AccessDenied') {
      return 'Access denied. Please contact an administrator if your account was deactivated.';
    }

    if (errorParam === 'Configuration') {
      return 'Authentication configuration error. Please contact support.';
    }

    if (errorParam) {
      return 'An authentication error occurred. Please try again.';
    }

    return null;
  });

  useEffect(() => {
    // Redirect if already authenticated
    if (session) {
      if (typeof window === 'undefined') return;
      const callbackUrl = sanitizeCallbackUrl(new URLSearchParams(window.location.search).get('callbackUrl'));
      router.replace(callbackUrl);
    }
  }, [session, router]);

  const handleStaffIdLookup = async () => {
    if (!staffId.trim()) {
      setError('Please enter your Staff ID.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/staff-id/lookup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: staffId.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || 'Unable to find this Staff ID.');
        return;
      }

      setLookupResult(data);
      setForm({
        firstName: data.profile.firstName || '',
        lastName: data.profile.lastName || '',
        department: data.profile.department || '',
        unit: data.profile.unit || '',
        position: data.profile.position || '',
        email: data.profile.email || '',
      });
      setOtpVerified(Boolean(data.profile.emailVerified));
      setStep(data.hasPassword ? 'password' : 'onboarding');
    } catch {
      setError('Failed to check Staff ID. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handlePasswordSignIn = async () => {
    if (!lookupResult?.employeeId || !password) {
      setError('Password is required.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const callbackUrl = typeof window === 'undefined'
        ? '/dashboard'
        : sanitizeCallbackUrl(new URLSearchParams(window.location.search).get('callbackUrl'));

      const result = await signIn('credentials', {
        employeeId: lookupResult.employeeId,
        password,
        redirect: false,
        callbackUrl,
      });

      if (result?.error) {
        setError('Invalid Staff ID or password.');
        return;
      }

      router.replace(result?.url || callbackUrl);
    } catch {
      setError('Failed to sign in. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSendOtp = async () => {
    if (!lookupResult?.employeeId || !form.email.trim()) {
      setError('Please enter your email.');
      return;
    }

    setOtpSending(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/staff-id/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: lookupResult.employeeId, email: form.email.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || 'Failed to send OTP.');
        return;
      }

      setOtpVerified(false);
    } catch {
      setError('Failed to send OTP. Please try again.');
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!lookupResult?.employeeId || !form.email.trim() || otpCode.trim().length !== 6) {
      setError('Enter the 6-digit OTP code.');
      return;
    }

    setOtpVerifying(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/staff-id/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: lookupResult.employeeId,
          email: form.email.trim(),
          code: otpCode.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || 'OTP verification failed.');
        return;
      }

      setOtpVerified(true);
    } catch {
      setError('Failed to verify OTP. Please try again.');
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleCompleteOnboarding = async () => {
    if (!lookupResult?.employeeId) {
      return;
    }

    if (!otpVerified) {
      setError('Verify your email OTP before continuing.');
      return;
    }

    if (!onboardingPassword || onboardingPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }

    if (onboardingPassword !== confirmPassword) {
      setError('Password confirmation does not match.');
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/auth/staff-id/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          employeeId: lookupResult.employeeId,
          password: onboardingPassword,
          firstName: form.firstName,
          lastName: form.lastName,
          department: form.department,
          unit: form.unit,
          position: form.position,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data?.error || 'Unable to complete onboarding.');
        return;
      }

      const callbackUrl = typeof window === 'undefined'
        ? '/dashboard'
        : sanitizeCallbackUrl(new URLSearchParams(window.location.search).get('callbackUrl'));

      const signInResult = await signIn('credentials', {
        employeeId: lookupResult.employeeId,
        password: onboardingPassword,
        redirect: false,
        callbackUrl,
      });

      if (signInResult?.error) {
        setError('Onboarding completed, but sign in failed. Please try logging in again.');
        setStep('password');
        return;
      }

      router.replace(signInResult?.url || callbackUrl);
    } catch {
      setError('Failed to complete onboarding. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset = () => {
    setStep('staff_id');
    setLookupResult(null);
    setPassword('');
    setOnboardingPassword('');
    setConfirmPassword('');
    setOtpCode('');
    setOtpVerified(false);
    setError(null);
  };

  // Loading state while checking session
  if (status === 'loading') {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: (theme) =>
            `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${alpha(theme.palette.primary.main, 0.03)} 100%)`,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, sm: 6 },
            textAlign: 'center',
            backdropFilter: 'blur(20px)',
            background: (theme) => alpha(theme.palette.background.paper, 0.8),
            border: (theme) => `1px solid ${theme.palette.divider}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Typography
            variant="h6"
            sx={{
              color: "text.secondary",
              mb: 2
            }}>
            Checking authentication...
          </Typography>
          <Box
            sx={{
              width: 32,
              height: 32,
              border: (theme) => `3px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              borderTop: (theme) => `3px solid ${theme.palette.primary.main}`,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              '@keyframes spin': {
                to: { transform: 'rotate(360deg)' },
              },
            }}
          />
        </Paper>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: (theme) =>
          `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${alpha(
            '#00E599',
            0.03
          )} 100%)`,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '-50%',
          right: '-50%',
          width: '100%',
          height: '100%',
          background: `radial-gradient(circle, ${alpha('#00E599', 0.08)} 0%, transparent 70%)`,
          animation: 'pulse 8s ease-in-out infinite',
        },
        '@keyframes pulse': {
          '0%, 100%': { opacity: 0.3 },
          '50%': { opacity: 0.6 },
        },
      }}
    >
      <Container maxWidth="sm">
        <motion.div {...{ ...fadeIn, transition: { ...fadeIn.transition, ease: ['easeInOut'] } }}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 4, sm: 6 },
              textAlign: 'center',
              position: 'relative',
              zIndex: 1,
              backdropFilter: 'blur(20px)',
              background: (theme) => alpha(theme.palette.background.paper, 0.8),
              border: (theme) => `1px solid ${theme.palette.divider}`,
            }}
          >
            <Stack spacing={4}>
              {/* Logo/Brand */}
              <Box>
                <Typography
                  variant="h3"
                  gutterBottom
                  sx={{
                    fontWeight: 700,
                    background: (theme) =>
                      `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  OVR System
                </Typography>
                <Typography variant="h6" sx={{ color: 'text.secondary', mb: 1 }}>
                  Gama Hospital
                </Typography>
                <Typography variant="body2" sx={{
                  color: "text.secondary"
                }}>
                  Occurrence Variance Reporting System
                </Typography>
              </Box>

              {/* Error Alert */}
              {error && (
                <Alert
                  severity="error"
                  onClose={() => setError(null)}
                  sx={{ textAlign: 'left' }}
                >
                  {error}
                </Alert>
              )}

              <Stack spacing={2}>
                <Typography variant="body1" sx={{ color: 'text.secondary' }}>
                  Sign in with your Staff ID
                </Typography>

                {step === 'staff_id' && (
                  <>
                    <TextField
                      label="Staff ID"
                      value={staffId}
                      onChange={(e) => setStaffId(e.target.value)}
                      fullWidth
                      autoFocus
                    />
                    <Button
                      fullWidth
                      variant="contained"
                      onClick={handleStaffIdLookup}
                      disabled={submitting}
                      sx={{ py: 1.3, fontWeight: 700 }}
                    >
                      {submitting ? 'Checking...' : 'Continue'}
                    </Button>
                  </>
                )}

                {step === 'password' && (
                  <>
                    <Alert severity="info">Staff ID: <strong>{lookupResult?.employeeId}</strong></Alert>
                    <TextField
                      label="Password"
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      fullWidth
                      autoFocus
                    />
                    <Grid container spacing={1}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Button fullWidth variant="outlined" onClick={handleReset}>
                          Back
                        </Button>
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Button fullWidth variant="contained" onClick={handlePasswordSignIn} disabled={submitting}>
                          {submitting ? 'Signing in...' : 'Sign in'}
                        </Button>
                      </Grid>
                    </Grid>
                  </>
                )}

                {step === 'onboarding' && lookupResult && (
                  <Stack spacing={2}>
                    <Alert severity="info">
                      Complete quick onboarding for Staff ID <strong>{lookupResult.employeeId}</strong>.
                    </Alert>

                    <Grid container spacing={1.5}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          label="First Name"
                          value={form.firstName}
                          onChange={(e) => setForm((prev) => ({ ...prev, firstName: e.target.value }))}
                          fullWidth
                          disabled={!lookupResult.editable.firstName}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          label="Last Name"
                          value={form.lastName}
                          onChange={(e) => setForm((prev) => ({ ...prev, lastName: e.target.value }))}
                          fullWidth
                          disabled={!lookupResult.editable.lastName}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          label="Department"
                          value={form.department}
                          onChange={(e) => setForm((prev) => ({ ...prev, department: e.target.value }))}
                          fullWidth
                          disabled={!lookupResult.editable.department}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <TextField
                          label="Unit"
                          value={form.unit}
                          onChange={(e) => setForm((prev) => ({ ...prev, unit: e.target.value }))}
                          fullWidth
                          disabled={!lookupResult.editable.unit}
                        />
                      </Grid>
                      <Grid size={{ xs: 12 }}>
                        <TextField
                          label="Position"
                          value={form.position}
                          onChange={(e) => setForm((prev) => ({ ...prev, position: e.target.value }))}
                          fullWidth
                          disabled={!lookupResult.editable.position}
                        />
                      </Grid>
                    </Grid>

                    <Divider />

                    <Stack direction="row" spacing={1} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
                      <Typography variant="subtitle2">Email verification</Typography>
                      {otpVerified ? <Chip label="Verified" color="success" size="small" /> : <Chip label="Pending" color="warning" size="small" />}
                    </Stack>

                    <Grid container spacing={1}>
                      <Grid size={{ xs: 12, md: 8 }}>
                        <TextField
                          label="Email"
                          value={form.email}
                          onChange={(e) => {
                            const nextEmail = e.target.value;
                            setForm((prev) => ({ ...prev, email: nextEmail }));
                            if (lookupResult.editable.email) {
                              setOtpVerified(false);
                            }
                          }}
                          fullWidth
                          disabled={!lookupResult.editable.email || submitting}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Button
                          fullWidth
                          variant="outlined"
                          onClick={handleSendOtp}
                          disabled={otpSending || submitting || !lookupResult.editable.email}
                          sx={{ height: '100%' }}
                        >
                          {otpSending ? 'Sending...' : 'Send OTP'}
                        </Button>
                      </Grid>
                    </Grid>

                    <Grid container spacing={1}>
                      <Grid size={{ xs: 12, md: 8 }}>
                        <TextField
                          label="OTP Code"
                          value={otpCode}
                          onChange={(e) => setOtpCode(e.target.value)}
                          fullWidth
                          disabled={otpVerified || submitting}
                        />
                      </Grid>
                      <Grid size={{ xs: 12, md: 4 }}>
                        <Button
                          fullWidth
                          variant="outlined"
                          onClick={handleVerifyOtp}
                          disabled={otpVerifying || otpVerified || submitting}
                          sx={{ height: '100%' }}
                        >
                          {otpVerifying ? 'Verifying...' : 'Verify OTP'}
                        </Button>
                      </Grid>
                    </Grid>

                    <TextField
                      label="Create Password"
                      type="password"
                      value={onboardingPassword}
                      onChange={(e) => setOnboardingPassword(e.target.value)}
                      fullWidth
                    />
                    <TextField
                      label="Confirm Password"
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      fullWidth
                    />

                    <Grid container spacing={1}>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Button fullWidth variant="outlined" onClick={handleReset} disabled={submitting}>
                          Back
                        </Button>
                      </Grid>
                      <Grid size={{ xs: 12, md: 6 }}>
                        <Button fullWidth variant="contained" onClick={handleCompleteOnboarding} disabled={submitting || !otpVerified}>
                          {submitting ? 'Finishing...' : 'Finish & Sign in'}
                        </Button>
                      </Grid>
                    </Grid>
                  </Stack>
                )}
              </Stack>

              <Divider />

              <Box>
                <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                  Microsoft login
                </Typography>
                <Tooltip title="Microsoft sign-in is currently disabled. Use Staff ID.">
                  <span>
                    <Button
                      fullWidth
                      size="large"
                      variant="contained"
                      startIcon={<MicrosoftIcon />}
                      disabled
                      sx={{ py: 1.5, fontSize: '1rem', fontWeight: 600 }}
                    >
                      Sign in with Microsoft
                    </Button>
                  </span>
                </Tooltip>
              </Box>

              {/* Footer Note */}
              <Typography
                variant="caption"
                sx={{
                  color: "text.secondary",
                  pt: 2
                }}>
                Need help with Staff ID access? Contact Quality Department.
              </Typography>
              {step !== 'staff_id' && (
                <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                  <Link component="button" type="button" underline="hover" onClick={handleReset}>
                    Use a different Staff ID
                  </Link>
                </Typography>
              )}
            </Stack>
          </Paper>
        </motion.div>

        {/* Decorative elements */}
        <Box
          sx={{
            position: 'absolute',
            bottom: '10%',
            left: '10%',
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: (theme) => alpha(theme.palette.primary.main, 0.1),
            filter: 'blur(40px)',
            animation: 'float 6s ease-in-out infinite',
            '@keyframes float': {
              '0%, 100%': { transform: 'translateY(0px)' },
              '50%': { transform: 'translateY(-20px)' },
            },
          }}
        />
      </Container>
    </Box>
  );
}