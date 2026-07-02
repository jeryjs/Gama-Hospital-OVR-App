'use client';

import {
  CheckCircle as CheckCircleIcon,
  Lock as LockIcon,
  MailOutline as MailOutlineIcon,
  PersonOutline as PersonOutlineIcon,
  Send as SendIcon,
  VerifiedUser as VerifiedUserIcon,
} from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Divider,
  Grid,
  MenuItem,
  Stack,
  Step,
  StepLabel,
  Stepper,
  TextField,
  Typography,
  alpha,
} from '@mui/material';

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

export function GuidedOnboardingCard({
  employeeId,
  form,
  editable,
  departments,
  otpCode,
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
  const selectedDepartment = departments.find((department) => department.id === form.departmentId);
  const availableUnits = selectedDepartment?.units || [];
  const profileComplete = Boolean(form.firstName.trim() && form.lastName.trim() && form.position.trim() && form.departmentId && form.unitId);
  const passwordReady = password.length >= 8 && password === confirmPassword;
  const activeStep = profileComplete ? (otpVerified ? 2 : 1) : 0;

  const updateForm = (updates: Partial<OnboardingFormState>) => {
    onFormChange({ ...form, ...updates });
  };

  return (
    <Stack spacing={3} sx={{ textAlign: 'left' }}>
      <Box
        sx={{
          p: 2.5,
          borderRadius: 3,
          background: (theme) => `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.12)}, ${alpha(theme.palette.secondary.main, 0.08)})`,
          border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.18)}`,
        }}
      >
        <Stack direction={{ xs: 'column', sm: 'row' }} spacing={1.5} alignItems={{ xs: 'flex-start', sm: 'center' }} justifyContent="space-between">
          <Box>
            <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 800 }}>
              First-time setup
            </Typography>
            <Typography variant="h5" sx={{ fontWeight: 800 }}>
              Activate Staff ID {employeeId}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Confirm your profile, verify email, then create your password.
            </Typography>
          </Box>
          <Chip icon={<VerifiedUserIcon />} label="Guided setup" color="primary" variant="outlined" />
        </Stack>
      </Box>

      <Stepper activeStep={activeStep} alternativeLabel>
        {['Profile', 'Email', 'Password'].map((label) => (
          <Step key={label} completed={(label === 'Profile' && profileComplete) || (label === 'Email' && otpVerified)}>
            <StepLabel>{label}</StepLabel>
          </Step>
        ))}
      </Stepper>

      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent>
          <Stack spacing={2.5}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <PersonOutlineIcon color="primary" />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  1. Confirm your profile
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Pre-filled information is locked. Empty fields can be completed once.
                </Typography>
              </Box>
            </Stack>

            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label="First name" value={form.firstName} onChange={(event) => updateForm({ firstName: event.target.value })} fullWidth disabled={!editable.firstName || submitting} helperText={!editable.firstName ? 'Already set by Quality Dept' : ' '} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label="Last name" value={form.lastName} onChange={(event) => updateForm({ lastName: event.target.value })} fullWidth disabled={!editable.lastName || submitting} helperText={!editable.lastName ? 'Already set by Quality Dept' : ' '} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  label="Department"
                  value={form.departmentId}
                  onChange={(event) => updateForm({ departmentId: Number(event.target.value), unitId: '' })}
                  fullWidth
                  disabled={!editable.department || submitting}
                  helperText={!editable.department ? 'Already assigned' : 'Select your department'}
                >
                  {departments.map((department) => (
                    <MenuItem key={department.id} value={department.id}>
                      {department.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField
                  select
                  label="Unit"
                  value={form.unitId}
                  onChange={(event) => updateForm({ unitId: Number(event.target.value) })}
                  fullWidth
                  disabled={!editable.unit || submitting || !form.departmentId}
                  helperText={!editable.unit ? 'Already assigned' : form.departmentId ? 'Select your unit' : 'Select department first'}
                >
                  {availableUnits.map((unit) => (
                    <MenuItem key={unit.id} value={unit.id}>
                      {unit.name}
                    </MenuItem>
                  ))}
                </TextField>
              </Grid>
              <Grid size={{ xs: 12 }}>
                <TextField label="Position" value={form.position} onChange={(event) => updateForm({ position: event.target.value })} fullWidth disabled={!editable.position || submitting} helperText={!editable.position ? 'Already set by Quality Dept' : 'Your current job title'} />
              </Grid>
            </Grid>
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent>
          <Stack spacing={2.5}>
            <Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
              <Stack direction="row" spacing={1.5} alignItems="center">
                <MailOutlineIcon color="primary" />
                <Box>
                  <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                    2. Verify your email
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    This email is used for password recovery and correspondence.
                  </Typography>
                </Box>
              </Stack>
              {otpVerified ? <Chip icon={<CheckCircleIcon />} label="Verified" color="success" /> : <Chip label="OTP required" color="warning" variant="outlined" />}
            </Stack>

            <Alert severity={otpVerified ? 'success' : 'info'}>
              {otpVerified ? 'Email verified. You can now finish setup.' : 'Send a 6-digit code, then enter it below. Codes expire quickly for safety.'}
            </Alert>

            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, md: 8 }}>
                <TextField
                  label="Email address"
                  value={form.email}
                  onChange={(event) => updateForm({ email: event.target.value })}
                  fullWidth
                  disabled={!editable.email || submitting || otpVerified}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Button fullWidth variant="outlined" startIcon={<SendIcon />} onClick={onSendOtp} disabled={otpSending || submitting || !editable.email || otpVerified} sx={{ height: '100%' }}>
                  {otpSending ? 'Sending...' : 'Send code'}
                </Button>
              </Grid>
              <Grid size={{ xs: 12, md: 8 }}>
                <TextField
                  label="6-digit verification code"
                  value={otpCode}
                  onChange={(event) => onOtpCodeChange(event.target.value.replace(/\D/g, '').slice(0, 6))}
                  fullWidth
                  disabled={otpVerified || submitting}
                  inputProps={{ inputMode: 'numeric', maxLength: 6, style: { letterSpacing: '0.35em', fontWeight: 800 } }}
                />
              </Grid>
              <Grid size={{ xs: 12, md: 4 }}>
                <Button fullWidth variant="contained" onClick={onVerifyOtp} disabled={otpVerifying || otpVerified || submitting || otpCode.length !== 6} sx={{ height: '100%' }}>
                  {otpVerifying ? 'Verifying...' : 'Verify'}
                </Button>
              </Grid>
            </Grid>
          </Stack>
        </CardContent>
      </Card>

      <Card variant="outlined" sx={{ borderRadius: 3 }}>
        <CardContent>
          <Stack spacing={2.5}>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <LockIcon color="primary" />
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 800 }}>
                  3. Create your password
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  Use at least 8 characters. You’ll use this with Staff ID next time.
                </Typography>
              </Box>
            </Stack>
            <Grid container spacing={1.5}>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label="Create password" type="password" value={password} onChange={(event) => onPasswordChange(event.target.value)} fullWidth disabled={submitting} />
              </Grid>
              <Grid size={{ xs: 12, md: 6 }}>
                <TextField label="Confirm password" type="password" value={confirmPassword} onChange={(event) => onConfirmPasswordChange(event.target.value)} fullWidth disabled={submitting} error={Boolean(confirmPassword) && password !== confirmPassword} helperText={confirmPassword && password !== confirmPassword ? 'Passwords do not match' : ' '} />
              </Grid>
            </Grid>
          </Stack>
        </CardContent>
      </Card>

      <Divider />

      <Grid container spacing={1.5}>
        <Grid size={{ xs: 12, md: 5 }}>
          <Button fullWidth variant="outlined" onClick={onBack} disabled={submitting} sx={{ py: 1.25 }}>
            Back
          </Button>
        </Grid>
        <Grid size={{ xs: 12, md: 7 }}>
          <Button fullWidth variant="contained" onClick={onComplete} disabled={submitting || !profileComplete || !otpVerified || !passwordReady} sx={{ py: 1.25, fontWeight: 800 }}>
            {submitting ? 'Activating account...' : 'Finish setup & sign in'}
          </Button>
        </Grid>
      </Grid>
    </Stack>
  );
}
