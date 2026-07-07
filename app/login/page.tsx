'use client';

import { Microsoft as MicrosoftIcon } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Container,
  Divider,
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
import { useEffect, useRef, useState } from 'react';

import {
  GuidedOnboardingCard,
  type DepartmentOption,
  type OnboardingEditableState,
  type OnboardingFormState,
} from './_components/GuidedOnboardingCard';
import { PasswordSignInCard } from './_components/PasswordSignInCard';
import { useThemeMode } from '@/components/ThemeRegistry';

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
    departmentId: number | null;
    unit: string;
    unitId: number | null;
    position: string;
    email: string;
    emailVerified: boolean;
  };
  editable: OnboardingEditableState;
  options: {
    departments: DepartmentOption[];
  };
}

const EMPTY_ONBOARDING_FORM: OnboardingFormState = {
  firstName: '',
  lastName: '',
  departmentId: '',
  unitId: '',
  position: '',
  email: '',
};

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
  const themeMode = useThemeMode().resolvedMode;

  const [step, setStep] = useState<LoginStep>('staff_id');
  const [lookupResult, setLookupResult] = useState<LookupResponse | null>(null);
  const [staffId, setStaffId] = useState('');
  const [password, setPassword] = useState('');
  const [onboardingPassword, setOnboardingPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpSending, setOtpSending] = useState(false);
  const [otpVerifying, setOtpVerifying] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [onboardingForm, setOnboardingForm] = useState<OnboardingFormState>(EMPTY_ONBOARDING_FORM);

  const staffIdInputRef = useRef<HTMLInputElement>(null);

  const [error, setError] = useState<string | null>(() => {
    if (typeof window === 'undefined') return null;
    const params = new URLSearchParams(window.location.search);
    const errorParam = params.get('error');
    if (errorParam === 'AccessDenied') return 'Access denied. Please contact an administrator if your account was deactivated.';
    if (errorParam === 'Configuration') return 'Authentication configuration error. Please contact support.';
    if (errorParam) return 'An authentication error occurred. Please try again.';
    return null;
  });

  const callbackUrl =
    typeof window === 'undefined'
      ? '/dashboard'
      : sanitizeCallbackUrl(new URLSearchParams(window.location.search).get('callbackUrl'));

  useEffect(() => {
    if (session) router.replace(callbackUrl);
  }, [session, router, callbackUrl]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

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
      const lookupData = data as LookupResponse;
      setLookupResult(lookupData);
      setOnboardingForm({
        firstName: lookupData.profile.firstName || '',
        lastName: lookupData.profile.lastName || '',
        departmentId: lookupData.profile.departmentId ?? '',
        unitId: lookupData.profile.unitId ?? '',
        position: lookupData.profile.position || '',
        email: lookupData.profile.email || '',
      });
      setOtpVerified(Boolean(lookupData.profile.emailVerified));
      setStep(lookupData.hasPassword ? 'password' : 'onboarding');
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
    if (!lookupResult?.employeeId || !onboardingForm.email.trim()) {
      setError('Please enter your email address.');
      return;
    }
    setOtpSending(true);
    setError(null);
    try {
      const response = await fetch('/api/auth/staff-id/send-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ employeeId: lookupResult.employeeId, email: onboardingForm.email.trim() }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data?.error || 'Failed to send verification code.');
        return;
      }
      setOtpSent(true);
      setOtpCode('');
      setOtpVerified(false);
    } catch {
      setError('Failed to send verification code. Please try again.');
    } finally {
      setOtpSending(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!lookupResult?.employeeId || !onboardingForm.email.trim() || otpCode.trim().length !== 6) {
      setError('Enter the 6-digit verification code.');
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
          email: onboardingForm.email.trim(),
          code: otpCode.trim(),
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data?.error || 'Verification failed. Please try again.');
        return;
      }
      setOtpVerified(true);
    } catch {
      setError('Failed to verify code. Please try again.');
    } finally {
      setOtpVerifying(false);
    }
  };

  const handleCompleteOnboarding = async () => {
    if (!lookupResult?.employeeId) return;
    if (!otpVerified) {
      setError('Verify your email before continuing.');
      return;
    }
    if (!onboardingPassword || onboardingPassword.length < 8) {
      setError('Password must be at least 8 characters.');
      return;
    }
    if (onboardingPassword !== confirmPassword) {
      setError('Passwords do not match.');
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
          firstName: onboardingForm.firstName,
          lastName: onboardingForm.lastName,
          departmentId: onboardingForm.departmentId || null,
          unitId: onboardingForm.unitId || null,
          position: onboardingForm.position,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        setError(data?.error || 'Unable to complete setup.');
        return;
      }
      const signInResult = await signIn('credentials', {
        employeeId: lookupResult.employeeId,
        password: onboardingPassword,
        redirect: false,
        callbackUrl,
      });
      if (signInResult?.error) {
        setError('Setup complete! Please sign in with your new password.');
        setStep('password');
        return;
      }
      router.replace(signInResult?.url || callbackUrl);
    } catch {
      setError('Failed to complete setup. Please try again.');
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
    setOtpSent(false);
    setOtpVerified(false);
    setOtpSending(false);
    setOtpVerifying(false);
    setOnboardingForm(EMPTY_ONBOARDING_FORM);
    setError(null);
    setTimeout(() => staffIdInputRef.current?.focus(), 50);
  };

  // ─── Render ─────────────────────────────────────────────────────────────────

  const isOnboarding = step === 'onboarding';

  if (status === 'loading') {
    return (
      <Box sx={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Stack spacing={2} sx={{ alignItems: 'center' }}>
          <CircularProgress size={32} thickness={4} />
          <Typography variant="body2" color="text.secondary">
            Checking authentication…
          </Typography>
        </Stack>
      </Box>
    );
  }

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: isOnboarding ? 'flex-start' : 'center',
        justifyContent: 'center',
        pt: isOnboarding ? { xs: 4, md: 8 } : 0,
        pb: isOnboarding ? 8 : 0,
        background: (theme) =>
          `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${alpha('#00E599', 0.025)} 100%)`,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '-40%',
          right: '-30%',
          width: '80%',
          height: '80%',
          background: `radial-gradient(circle, ${alpha('#00E599', 0.07)} 0%, transparent 70%)`,
          animation: 'subtlePulse 10s ease-in-out infinite',
          pointerEvents: 'none',
        },
        '@keyframes subtlePulse': {
          '0%, 100%': { opacity: 0.4 },
          '50%': { opacity: 0.8 },
        },
      }}
    >
      <Container maxWidth={isOnboarding ? 'md' : 'xs'}>
        <motion.div
          key={step}
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28, ease: 'easeOut' }}
        >
          <Paper
            elevation={0}
            sx={{
              p: { xs: 3, sm: 5 },
              position: 'relative',
              zIndex: 1,
              backdropFilter: 'blur(24px)',
              background: (theme) => alpha(theme.palette.background.paper, 0.88),
              border: (theme) => `1px solid ${theme.palette.divider}`,
              borderRadius: 4,
            }}
          >
            <Stack spacing={4}>
              {/* ── Brand header ── */}
              <Box sx={{ textAlign: 'center' }}>
                {/* <Typography
                  variant={isOnboarding ? 'h5' : 'h4'}
                  gutterBottom
                  sx={{
                    fontWeight: 800,
                    background: (theme) =>
                      `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    backgroundClip: 'text',
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                  }}
                >
                  OVR System
                </Typography> */}
                {!isOnboarding && (
                  <>
                    <Box
                      sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        height: 72,
                        mt: 0.5,
                        borderRadius: 1,
                      }}
                    >
                      <Box
                        aria-label="Gama Hospital"
                        role="img"
                        sx={(theme) => ({
                          width: 256,
                          height: 94,
                          background: `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                          WebkitMaskImage: 'url(/gama_banner.png)',
                          maskImage: 'url(/gama_banner.png)',
                          WebkitMaskRepeat: 'no-repeat',
                          maskRepeat: 'no-repeat',
                          WebkitMaskPosition: 'center',
                          maskPosition: 'center',
                          WebkitMaskSize: 'contain',
                          maskSize: 'contain',
                        })}
                      />
                    </Box>
                    <Typography
                      variant={'body2'}
                      gutterBottom
                      sx={{
                        // fontWeight: 800,
                        background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                        backgroundClip: 'text',
                        WebkitBackgroundClip: 'text',
                        WebkitTextFillColor: 'transparent',
                      }}
                    >
                      Occurrence Variance Reporting
                    </Typography>
                  </>
                )}
              </Box>

              {/* ── Error banner ── */}
              {error && (
                <Alert severity="error" onClose={() => setError(null)} sx={{ borderRadius: 2 }}>
                  {error}
                </Alert>
              )}

              {/* ── Step: Staff ID entry ── */}
              {step === 'staff_id' && (
                <Stack spacing={2.5}>
                  <Stack spacing={0.5}>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      Sign in with your Staff ID
                    </Typography>
                    <Typography variant="body2" color="text.secondary">
                      Enter the ID assigned by the Quality Department.
                    </Typography>
                  </Stack>

                  <TextField
                    label="Staff ID"
                    value={staffId}
                    onChange={(e) => setStaffId(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleStaffIdLookup()}
                    fullWidth
                    autoFocus
                    inputRef={staffIdInputRef}
                    disabled={submitting}
                    placeholder="e.g. EMP-001"
                  />

                  <Button
                    fullWidth
                    variant="contained"
                    size="large"
                    onClick={handleStaffIdLookup}
                    disabled={submitting || !staffId.trim()}
                    sx={{ py: 1.5, fontWeight: 700, borderRadius: 2 }}
                  >
                    {submitting ? 'Looking up…' : 'Continue'}
                  </Button>

                  <Divider>
                    <Typography variant="caption" color="text.disabled">
                      OR
                    </Typography>
                  </Divider>

                  <Tooltip title="Microsoft sign-in is currently disabled. Use your Staff ID above." placement="top">
                    <span>
                      <Button
                        fullWidth
                        variant="outlined"
                        startIcon={<MicrosoftIcon />}
                        disabled
                        sx={{ py: 1.25, borderColor: 'divider', borderRadius: 2, color: 'text.disabled' }}
                      >
                        Continue with Microsoft
                      </Button>
                    </span>
                  </Tooltip>

                  <Typography variant="caption" color="text.disabled" sx={{ textAlign: 'center' }}>
                    Don't have a Staff ID? Contact the Quality Department.
                  </Typography>
                </Stack>
              )}

              {/* ── Step: Password ── */}
              {step === 'password' && lookupResult && (
                <PasswordSignInCard
                  employeeId={lookupResult.employeeId || staffId}
                  displayName={lookupResult.profile.name}
                  submitting={submitting}
                  password={password}
                  onPasswordChange={setPassword}
                  onSignIn={handlePasswordSignIn}
                  onBack={handleReset}
                />
              )}

              {/* ── Step: Onboarding ── */}
              {step === 'onboarding' && lookupResult && (
                <GuidedOnboardingCard
                  employeeId={lookupResult.employeeId || staffId}
                  form={onboardingForm}
                  editable={lookupResult.editable}
                  departments={lookupResult.options.departments}
                  otpCode={otpCode}
                  otpSent={otpSent}
                  otpVerified={otpVerified}
                  otpSending={otpSending}
                  otpVerifying={otpVerifying}
                  submitting={submitting}
                  password={onboardingPassword}
                  confirmPassword={confirmPassword}
                  onFormChange={setOnboardingForm}
                  onOtpCodeChange={setOtpCode}
                  onPasswordChange={setOnboardingPassword}
                  onConfirmPasswordChange={setConfirmPassword}
                  onSendOtp={handleSendOtp}
                  onVerifyOtp={handleVerifyOtp}
                  onBack={handleReset}
                  onComplete={handleCompleteOnboarding}
                />
              )}
            </Stack>
          </Paper>
        </motion.div>
      </Container>
    </Box>
  );
}
