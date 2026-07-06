'use client';

import {
  CheckCircle as CheckCircleIcon,
  Lock as LockIcon,
  EmailOutlined as MailOutlineIcon,
  PersonOutlineOutlined as PersonOutlineIcon,
  Refresh as RefreshIcon,
  Send as SendIcon,
  Verified as VerifiedIcon,
  Visibility,
  VisibilityOff,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  IconButton,
  InputAdornment,
  LinearProgress,
  MenuItem,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Tooltip,
  Typography,
  alpha,
} from '@mui/material';
import { useRef, useState } from 'react';

export interface DepartmentOption {
  id: number;
  name: string;
  units: Array<{ id: number; name: string; parentDepartmentId: number | null }>;
}

export interface OnboardingFormState {
  firstName: string;
  lastName: string;
  departmentId: number | '';
  unitId: number | '';
  position: string;
  email: string;
}

export interface OnboardingEditableState {
  firstName: boolean;
  lastName: boolean;
  department: boolean;
  unit: boolean;
  position: boolean;
  email: boolean;
}

interface GuidedOnboardingCardProps {
  employeeId: string;
  form: OnboardingFormState;
  editable: OnboardingEditableState;
  departments: DepartmentOption[];
  otpCode: string;
  otpSent: boolean;
  otpVerified: boolean;
  otpSending: boolean;
  otpVerifying: boolean;
  submitting: boolean;
  password: string;
  confirmPassword: string;
  onFormChange: (nextForm: OnboardingFormState) => void;
  onOtpCodeChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onConfirmPasswordChange: (value: string) => void;
  onSendOtp: () => void;
  onVerifyOtp: () => void;
  onBack: () => void;
  onComplete: () => void;
}

/** Six individual digit boxes for OTP entry */
function OtpDigitInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (value: string) => void;
  disabled: boolean;
}) {
  const digits = value.padEnd(6, '').split('').slice(0, 6);
  const inputRefs = useRef<Array<HTMLInputElement | null>>([]);

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace') {
      e.preventDefault();
      const next = digits.map((d, i) => (i === index ? '' : d));
      if (!digits[index] && index > 0) {
        // Already empty — move back and clear previous
        const prev = digits.map((d, i) => (i === index - 1 ? '' : d));
        onChange(prev.join(''));
        inputRefs.current[index - 1]?.focus();
      } else {
        onChange(next.join(''));
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }
  };

  const handleChange = (index: number, raw: string) => {
    // Accept paste of full code
    const cleaned = raw.replace(/\D/g, '');
    if (cleaned.length > 1) {
      const next = cleaned.slice(0, 6).padEnd(6, '').split('').slice(0, 6);
      onChange(next.join(''));
      inputRefs.current[Math.min(5, cleaned.length - 1)]?.focus();
      return;
    }
    if (!cleaned) return;
    const next = digits.map((d, i) => (i === index ? cleaned : d));
    onChange(next.join(''));
    if (index < 5) inputRefs.current[index + 1]?.focus();
  };

  return (
    <Stack direction="row" spacing={1} sx={{ justifyContent: 'center' }}>
      {Array.from({ length: 6 }).map((_, index) => (
        <Box
          key={index}
          component="input"
          ref={(el: HTMLInputElement | null) => { inputRefs.current[index] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={6}
          value={digits[index]}
          disabled={disabled}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onChange={(e) => handleChange(index, e.target.value)}
          onFocus={(e) => e.target.select()}
          sx={{
            width: { xs: 42, sm: 48 },
            height: { xs: 52, sm: 60 },
            border: (theme) =>
              `2px solid ${digits[index] ? theme.palette.primary.main : theme.palette.divider}`,
            borderRadius: 2,
            background: (theme) =>
              digits[index]
                ? alpha(theme.palette.primary.main, 0.06)
                : theme.palette.background.paper,
            color: 'text.primary',
            fontSize: { xs: '1.4rem', sm: '1.6rem' },
            fontWeight: 800,
            textAlign: 'center',
            outline: 'none',
            transition: 'border-color 0.15s, background 0.15s',
            cursor: disabled ? 'not-allowed' : 'text',
            opacity: disabled ? 0.5 : 1,
            '&:focus': {
              borderColor: 'primary.main',
              background: (theme) => alpha(theme.palette.primary.main, 0.08),
              boxShadow: (theme) => `0 0 0 3px ${alpha(theme.palette.primary.main, 0.15)}`,
            },
            fontFamily: 'monospace',
          }}
        />
      ))}
    </Stack>
  );
}

function PasswordStrengthBar({ password }: { password: string }) {
  const hasLength = password.length >= 8;
  const hasUpper = /[A-Z]/.test(password);
  const hasLower = /[a-z]/.test(password);
  const hasNumber = /\d/.test(password);
  const hasSymbol = /[^A-Za-z0-9]/.test(password);
  const score = [hasLength, hasUpper, hasLower, hasNumber, hasSymbol].filter(Boolean).length;

  if (!password) return null;

  const color = score <= 2 ? 'error' : score <= 3 ? 'warning' : 'success';
  const label = score <= 2 ? 'Weak' : score <= 3 ? 'Fair' : score === 4 ? 'Good' : 'Strong';
  const value = (score / 5) * 100;

  return (
    <Stack spacing={0.5}>
      <LinearProgress
        variant="determinate"
        value={value}
        color={color}
        sx={{ borderRadius: 1, height: 4 }}
      />
      <Typography variant="caption" color={`${color}.main`} sx={{ fontWeight: 600 }}>
        {label} password
      </Typography>
    </Stack>
  );
}

export function GuidedOnboardingCard({
  employeeId,
  form,
  editable,
  departments,
  otpCode,
  otpSent,
  otpVerified,
  otpSending,
  otpVerifying,
  submitting,
  password,
  confirmPassword,
  onFormChange,
  onOtpCodeChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onSendOtp,
  onVerifyOtp,
  onBack,
  onComplete,
}: GuidedOnboardingCardProps) {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const selectedDepartment = departments.find((d) => d.id === form.departmentId);
  const availableUnits = selectedDepartment?.units || [];

  const profileComplete = Boolean(
    form.firstName.trim() &&
    form.lastName.trim() &&
    form.position.trim() &&
    form.departmentId &&
    form.unitId
  );
  const passwordReady = password.length >= 8 && password === confirmPassword;
  const canComplete = profileComplete && otpVerified && passwordReady;

  const activeStep = !profileComplete ? 0 : !otpVerified ? 1 : 2;

  const updateForm = (updates: Partial<OnboardingFormState>) =>
    onFormChange({ ...form, ...updates });

  return (
    <Stack spacing={3} sx={{ textAlign: 'left' }}>
      {/* ── Identity banner ── */}
      <Box
        sx={{
          p: 2.5,
          borderRadius: 3,
          background: (theme) =>
            `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)}, ${alpha(theme.palette.secondary.main, 0.08)})`,
          border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
        }}
      >
        <Stack
          direction={{ xs: 'column', sm: 'row' }}
          spacing={1.5}
          sx={{
            alignItems: { xs: 'flex-start', sm: 'center' },
            justifyContent: 'space-between',
          }}
        >
          <Box>
            <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800, lineHeight: 1 }}>
              First-time setup
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800, mt: 0.25 }}>
              Activate your account
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Staff ID: <strong>{employeeId}</strong> — complete 3 quick steps to get started.
            </Typography>
          </Box>
          <Chip
            icon={<VerifiedIcon />}
            label="Guided setup"
            color="primary"
            variant="outlined"
            sx={{ flexShrink: 0 }}
          />
        </Stack>
      </Box>

      {/* ── Stepper ── */}
      <Stepper activeStep={activeStep} alternativeLabel>
        {[
          { label: 'Profile', done: profileComplete },
          { label: 'Email', done: otpVerified },
          { label: 'Password', done: canComplete },
        ].map(({ label, done }) => (
          <Step key={label} completed={done}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      {/* ── Section 1: Profile ── */}
      <Card
        variant="outlined"
        sx={{
          borderRadius: 3,
          borderColor: profileComplete ? 'success.main' : 'divider',
          borderWidth: profileComplete ? 1.5 : 1,
          transition: 'border-color 0.2s',
        }}
      >
        <CardContent>
          <Stack spacing={2.5}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <PersonOutlineIcon color={profileComplete ? 'success' : 'primary'} />
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    1. Confirm your profile
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Pre-filled fields are locked. Fill in any blanks.
                  </Typography>
                </Box>
              </Stack>
              {profileComplete && (
                <CheckCircleIcon color="success" fontSize="small" />
              )}
            </Stack>

            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="First name"
                  value={form.firstName}
                  onChange={(e) => updateForm({ firstName: e.target.value })}
                  fullWidth
                  disabled={!editable.firstName || submitting}
                  error={editable.firstName && !form.firstName.trim()}
                  helperText={!editable.firstName ? 'Set by Quality Dept' : !form.firstName.trim() ? 'First name is required' : ' '}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Last name"
                  value={form.lastName}
                  onChange={(e) => updateForm({ lastName: e.target.value })}
                  fullWidth
                  disabled={!editable.lastName || submitting}
                  error={editable.lastName && !form.lastName.trim()}
                  helperText={!editable.lastName ? 'Set by Quality Dept' : !form.lastName.trim() ? 'Last name is required' : ' '}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  label="Department"
                  value={form.departmentId}
                  onChange={(e) => updateForm({ departmentId: Number(e.target.value), unitId: '' })}
                  fullWidth
                  disabled={!editable.department || submitting}
                  error={editable.department && !form.departmentId}
                  helperText={!editable.department ? 'Already assigned' : !form.departmentId ? 'Department selection is required' : 'Select your department'}
                >
                  {departments.map((dept) => (
                    <MenuItem key={dept.id} value={dept.id}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  label="Unit"
                  value={form.unitId}
                  onChange={(e) => updateForm({ unitId: Number(e.target.value) })}
                  fullWidth
                  disabled={!editable.unit || submitting || !form.departmentId}
                  error={editable.unit && Boolean(form.departmentId) && !form.unitId}
                  helperText={
                    !editable.unit
                      ? 'Already assigned'
                      : !form.departmentId
                        ? 'Select department first'
                        : !form.unitId
                          ? 'Unit selection is required'
                          : 'Select your unit'
                  }
                >
                  {availableUnits.map((unit) => (
                    <MenuItem key={unit.id} value={unit.id}>
                      {unit.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField
                  label="Position / Job title"
                  value={form.position}
                  onChange={(e) => updateForm({ position: e.target.value })}
                  fullWidth
                  disabled={!editable.position || submitting}
                  error={editable.position && !form.position.trim()}
                  helperText={!editable.position ? 'Set by Quality Dept' : !form.position.trim() ? 'Position is required' : 'Your current job title'}
                />
              </Grid>
            </Grid>
          </Stack>
        </CardContent>
      </Card>

      {/* ── Section 2: Email verification ── */}
      <Card
        variant="outlined"
        sx={{
          borderRadius: 3,
          borderColor: otpVerified ? 'success.main' : 'divider',
          borderWidth: otpVerified ? 1.5 : 1,
          transition: 'border-color 0.2s',
        }}
      >
        <CardContent>
          <Stack spacing={2.5}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <MailOutlineIcon color={otpVerified ? 'success' : 'primary'} />
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    2. Verify your email
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Used for password recovery and notifications.
                  </Typography>
                </Box>
              </Stack>
              {otpVerified ? (
                <Chip icon={<CheckCircleIcon />} label="Verified" color="success" size="small" />
              ) : (
                <Chip label="Required" color="warning" variant="outlined" size="small" />
              )}
            </Stack>

            {otpVerified ? (
              <Alert severity="success" icon={<CheckCircleIcon />} sx={{ borderRadius: 2 }}>
                <strong>{form.email}</strong> has been verified. You're good to go!
              </Alert>
            ) : (
              <>
                <Alert severity="info" sx={{ borderRadius: 2 }}>
                  We'll send a 6-digit code to confirm you own this address. Codes expire in 10 minutes.
                </Alert>

                {/* Email input + send button */}
                <Grid container spacing={1.5} sx={{ alignItems: 'flex-start' }}>
                  <Grid size={{ xs: 12, sm: 8 }}>
                    <TextField
                      label="Email address"
                      type="email"
                      value={form.email}
                      onChange={(e) => updateForm({ email: e.target.value })}
                      fullWidth
                      disabled={!editable.email || submitting || otpVerified}
                      helperText={!editable.email ? 'Already verified — cannot change' : ' '}
                    />
                  </Grid>
                  <Grid size={{ xs: 12, sm: 4 }}>
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={otpSent ? <RefreshIcon /> : <SendIcon />}
                      onClick={onSendOtp}
                      disabled={otpSending || submitting || !form.email.trim()}
                      sx={{ height: 56, borderRadius: 2, fontWeight: 600 }}
                    >
                      {otpSending ? 'Sending…' : otpCode ? 'Resend' : 'Send code'}
                    </Button>
                  </Grid>
                </Grid>

                {/* OTP digit input — only shown after first send */}
                {(otpSent || otpSending) && (
                  <Stack spacing={2} sx={{ alignItems: 'center' }}>
                    <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center' }}>
                      Enter the 6-digit code sent to your email
                    </Typography>
                    <OtpDigitInput
                      value={otpCode}
                      onChange={onOtpCodeChange}
                      disabled={otpVerified || submitting || otpVerifying}
                    />
                    <Button
                      variant="contained"
                      onClick={onVerifyOtp}
                      disabled={otpVerifying || otpVerified || submitting || otpCode.replace(/\D/g, '').length !== 6}
                      sx={{ minWidth: 160, fontWeight: 700, borderRadius: 2 }}
                    >
                      {otpVerifying ? 'Verifying…' : 'Verify code'}
                    </Button>
                  </Stack>
                )}
              </>
            )}
          </Stack>
        </CardContent>
      </Card>

      {/* ── Section 3: Password ── */}
      <Card
        variant="outlined"
        sx={{
          borderRadius: 3,
          borderColor: passwordReady ? 'success.main' : 'divider',
          borderWidth: passwordReady ? 1.5 : 1,
          transition: 'border-color 0.2s',
        }}
      >
        <CardContent>
          <Stack spacing={2.5}>
            <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
              <Stack direction="row" spacing={1.5} sx={{ alignItems: 'center' }}>
                <LockIcon color={passwordReady ? 'success' : 'primary'} />
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    3. Create your password
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    At least 8 characters. You'll use this with your Staff ID to sign in.
                  </Typography>
                </Box>
              </Stack>
              {passwordReady && <CheckCircleIcon color="success" fontSize="small" />}
            </Stack>

            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Create password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => onPasswordChange(e.target.value)}
                  fullWidth
                  disabled={submitting}
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title={showPassword ? 'Hide password' : 'Show password'}>
                            <IconButton size="small" onClick={() => setShowPassword((p) => !p)} edge="end" tabIndex={-1}>
                              {showPassword ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  label="Confirm password"
                  type={showConfirm ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => onConfirmPasswordChange(e.target.value)}
                  fullWidth
                  disabled={submitting}
                  error={Boolean(confirmPassword) && password !== confirmPassword}
                  helperText={
                    confirmPassword && password !== confirmPassword ? 'Passwords do not match' : ' '
                  }
                  slotProps={{
                    input: {
                      endAdornment: (
                        <InputAdornment position="end">
                          <Tooltip title={showConfirm ? 'Hide password' : 'Show password'}>
                            <IconButton size="small" onClick={() => setShowConfirm((p) => !p)} edge="end" tabIndex={-1}>
                              {showConfirm ? <VisibilityOff fontSize="small" /> : <Visibility fontSize="small" />}
                            </IconButton>
                          </Tooltip>
                        </InputAdornment>
                      ),
                    },
                  }}
                />
              </Grid>
            </Grid>

            <PasswordStrengthBar password={password} />
          </Stack>
        </CardContent>
      </Card>

      {/* ── Actions ── */}
      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, md: 4 }}>
          <Button
            fullWidth
            variant="outlined"
            onClick={onBack}
            disabled={submitting}
            sx={{ py: 1.5, borderRadius: 2 }}
          >
            Back
          </Button>
        </Grid>
        <Grid size={{ xs: 12, md: 8 }}>
          <Tooltip
            title={
              !profileComplete
                ? 'Complete your profile first'
                : !otpVerified
                  ? 'Verify your email first'
                  : !passwordReady
                    ? 'Create a valid password first'
                    : ''
            }
          >
            <span style={{ display: 'block' }}>
              <Button
                fullWidth
                variant="contained"
                size="large"
                onClick={onComplete}
                disabled={submitting || !canComplete}
                sx={{ py: 1.5, fontWeight: 800, borderRadius: 2 }}
              >
                {submitting ? 'Activating account…' : 'Finish setup & sign in'}
              </Button>
            </span>
          </Tooltip>
        </Grid>
      </Grid>
    </Stack>
  );
}
