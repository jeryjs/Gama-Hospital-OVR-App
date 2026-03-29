'use client';

import { AppLayout } from '@/components/AppLayout';
import { ErrorLayout } from '@/components/shared';
import type { User, UserCreate, UserUpdate } from '@/lib/api/schemas';
import { useUserManagement, useDepartments } from '@/lib/hooks';
import { APP_ROLES, ROLE_METADATA, AppRole } from '@/lib/constants';
import { ACCESS_CONTROL } from '@/lib/access-control';
import { hasAnyRole } from '@/lib/auth-helpers';
import {
  AdminPanelSettings,
  CheckCircle,
  Close,
  Edit,
  PersonAdd,
  Refresh,
  Search as SearchIcon,
  Person,
  Security,
  History,
  Info,
  Warning,
  CheckCircleOutline,
  Block,
  Assignment,
  TrendingUp,
  CalendarToday,
  AccessTime,
} from '@mui/icons-material';
import {
  alpha,
  Avatar,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  InputLabel,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Snackbar,
  Stack,
  Switch,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  Alert,
} from '@mui/material';
import { format, formatDistanceToNow } from 'date-fns';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';

// Build role filter options from ROLE_METADATA
const ROLE_FILTER_OPTIONS = [
  { value: '', label: 'All Roles' },
  ...Object.entries(ROLE_METADATA).map(([value, meta]) => ({ value, label: meta.label, color: meta.color })),
];

const ROLE_OPTIONS = Object.entries(ROLE_METADATA).map(([value, meta]) => ({
  value: value as AppRole,
  label: meta.label,
  color: meta.color,
  description: meta.description,
}));

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];

// ============================================
// TAB PANEL COMPONENT
// ============================================

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`user-tabpanel-${index}`}
      aria-labelledby={`user-tab-${index}`}
      style={{ paddingTop: 16 }}
    >
      {value === index && children}
    </div>
  );
}

function a11yProps(index: number) {
  return {
    id: `user-tab-${index}`,
    'aria-controls': `user-tabpanel-${index}`,
  };
}

// ============================================
// STAT CARD COMPONENT FOR ACTIVITY TAB
// ============================================

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: string | number;
  color?: string;
}

interface UserAdminAuditEntry {
  id: number;
  action: string;
  reason?: string | null;
  changes: Record<string, any>;
  createdAt: string;
  actor: {
    name: string;
    email: string | null;
  };
}

function StatCard({ icon, label, value, color = '#3B82F6' }: StatCardProps) {
  return (
    <Paper
      variant="outlined"
      sx={{
        p: 2,
        display: 'flex',
        alignItems: 'center',
        gap: 2,
        borderColor: alpha(color, 0.3),
        bgcolor: alpha(color, 0.05),
      }}
    >
      <Box
        sx={{
          p: 1,
          borderRadius: 1,
          bgcolor: alpha(color, 0.15),
          color: color,
          display: 'flex',
        }}
      >
        {icon}
      </Box>
      <Box>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography variant="h6" fontWeight={600}>
          {value}
        </Typography>
      </Box>
    </Paper>
  );
}

// ============================================
// CREATE USER DIALOG
// ============================================

interface CreateUserDialogProps {
  open: boolean;
  onClose: () => void;
  onCreate: (payload: UserCreate, meta?: { reason?: string; confirmHighRisk?: boolean }) => Promise<void>;
  departments: Array<{ id: number; name: string }>;
}

function CreateUserDialog({ open, onClose, onCreate, departments }: CreateUserDialogProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [auditReason, setAuditReason] = useState('');
  const [confirmHighRisk, setConfirmHighRisk] = useState(false);
  const [formData, setFormData] = useState<UserCreate>({
    email: '',
    firstName: '',
    lastName: '',
    roles: [APP_ROLES.EMPLOYEE],
    department: '',
    position: '',
    employeeId: '',
    isActive: true,
  });

  useEffect(() => {
    if (!open) return;

    setError('');
    setSaving(false);
    setAuditReason('');
    setConfirmHighRisk(false);
    setFormData({
      email: '',
      firstName: '',
      lastName: '',
      roles: [APP_ROLES.EMPLOYEE],
      department: '',
      position: '',
      employeeId: '',
      isActive: true,
    });
  }, [open]);

  const isEmailValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email.trim());
  const hasRoles = Array.isArray(formData.roles) && formData.roles.length > 0;
  const selectedRoles = (formData.roles || []) as string[];
  const privilegedRoles: AppRole[] = [APP_ROLES.SUPER_ADMIN, APP_ROLES.TECH_ADMIN, APP_ROLES.DEVELOPER];
  const isPrivilegedCreate = selectedRoles.some((role) =>
    privilegedRoles.includes(role as AppRole)
  );
  const includesSuperAdmin = selectedRoles.includes(APP_ROLES.SUPER_ADMIN);

  const isFormValid =
    formData.firstName.trim().length > 0 &&
    formData.lastName.trim().length > 0 &&
    isEmailValid &&
    hasRoles &&
    (!isPrivilegedCreate || auditReason.trim().length >= 10) &&
    (!includesSuperAdmin || confirmHighRisk);

  const handleSubmit = async () => {
    if (!isFormValid) {
      setError('Please complete all required fields and select at least one role.');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await onCreate({
        ...formData,
        email: formData.email.trim().toLowerCase(),
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
      }, {
        reason: auditReason.trim() || undefined,
        confirmHighRisk,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create user');
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={saving ? undefined : onClose} maxWidth="sm" fullWidth>
      <DialogTitle sx={{ pb: 1 }}>
        <Stack direction="row" spacing={1} alignItems="center">
          <PersonAdd color="primary" />
          <Typography variant="h6" fontWeight={700}>Create User</Typography>
        </Stack>
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Alert severity="info">
            <Typography variant="body2">
              Users with approved company emails can also be auto-provisioned on first sign-in. Use this form for proactive setup and role assignment.
            </Typography>
          </Alert>

          {error && (
            <Alert severity="error" onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          <TextField
            label="Email *"
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
            placeholder="user@gamahospital.com"
            error={formData.email.length > 0 && !isEmailValid}
            helperText={formData.email.length > 0 && !isEmailValid ? 'Enter a valid email address' : 'Recommended: company email'}
            fullWidth
            autoFocus
          />

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="First Name *"
                value={formData.firstName}
                onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                fullWidth
              />
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Last Name *"
                value={formData.lastName}
                onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                fullWidth
              />
            </Grid>
          </Grid>

          <FormControl fullWidth>
            <InputLabel id="create-user-roles-label">Roles *</InputLabel>
            <Select
              labelId="create-user-roles-label"
              multiple
              label="Roles *"
              value={(formData.roles as string[]) || []}
              onChange={(e) => {
                const nextRoles = Array.isArray(e.target.value) ? e.target.value : [e.target.value];
                setFormData({ ...formData, roles: nextRoles as AppRole[] });
              }}
              renderValue={(selected) => (
                <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                  {(selected as string[]).map((roleValue) => {
                    const role = ROLE_OPTIONS.find((r) => r.value === roleValue);
                    return (
                      <Chip
                        key={roleValue}
                        label={role?.label || roleValue}
                        size="small"
                        sx={{
                          bgcolor: alpha(role?.color || '#6B7280', 0.15),
                          color: role?.color || '#6B7280',
                          fontWeight: 600,
                        }}
                      />
                    );
                  })}
                </Stack>
              )}
            >
              {ROLE_OPTIONS.map((role) => (
                <MenuItem key={role.value} value={role.value}>
                  <Checkbox checked={((formData.roles as string[]) || []).includes(role.value)} />
                  <Stack spacing={0}>
                    <Typography variant="body2" fontWeight={600}>{role.label}</Typography>
                    <Typography variant="caption" color="text.secondary">{role.description}</Typography>
                  </Stack>
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Grid container spacing={2}>
            <Grid size={{ xs: 12, sm: 6 }}>
              <FormControl fullWidth>
                <InputLabel>Department</InputLabel>
                <Select
                  value={formData.department || ''}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  label="Department"
                >
                  <MenuItem value="">
                    <em>No Department</em>
                  </MenuItem>
                  {departments.map((dept) => (
                    <MenuItem key={dept.id} value={dept.name}>{dept.name}</MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Grid>
            <Grid size={{ xs: 12, sm: 6 }}>
              <TextField
                label="Employee ID"
                value={formData.employeeId || ''}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                fullWidth
              />
            </Grid>
          </Grid>

          <TextField
            label="Position"
            value={formData.position || ''}
            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
            fullWidth
          />

          <TextField
            label="Audit reason"
            value={auditReason}
            onChange={(e) => setAuditReason(e.target.value)}
            fullWidth
            multiline
            minRows={2}
            required={isPrivilegedCreate}
            helperText={
              isPrivilegedCreate
                ? 'Required (minimum 10 characters) for privileged role assignment'
                : 'Optional'
            }
          />

          {includesSuperAdmin && (
            <Alert severity="warning">
              <Typography variant="body2" fontWeight={600}>High-risk action</Typography>
              <Typography variant="body2">
                Assigning Super Admin requires explicit confirmation.
              </Typography>
              <FormControlLabel
                sx={{ mt: 1 }}
                control={
                  <Checkbox
                    checked={confirmHighRisk}
                    onChange={(e) => setConfirmHighRisk(e.target.checked)}
                  />
                }
                label="I confirm this Super Admin assignment"
              />
            </Alert>
          )}

          <FormControlLabel
            control={
              <Switch
                checked={formData.isActive ?? true}
                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                color="success"
              />
            }
            label="Account active"
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 2 }}>
        <Button onClick={onClose} disabled={saving}>Cancel</Button>
        <Button
          onClick={handleSubmit}
          variant="contained"
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : <PersonAdd />}
          disabled={saving || !isFormValid}
        >
          {saving ? 'Creating...' : 'Create User'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

// ============================================
// ENHANCED EDIT USER DIALOG
// ============================================

interface EnhancedEditDialogProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onSave: (userId: number, updates: UserUpdate, meta?: { reason?: string; confirmHighRisk?: boolean }) => Promise<void>;
}

function EnhancedEditUserDialog({ open, user, onClose, onSave }: EnhancedEditDialogProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState<UserUpdate>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [changeReason, setChangeReason] = useState('');
  const [confirmHighRiskOpen, setConfirmHighRiskOpen] = useState(false);
  const [auditLoading, setAuditLoading] = useState(false);
  const [auditLogs, setAuditLogs] = useState<UserAdminAuditEntry[]>([]);
  const [employeeIdValid, setEmployeeIdValid] = useState(true);
  const [employeeIdChecking, setEmployeeIdChecking] = useState(false);
  const [showDeactivateWarning, setShowDeactivateWarning] = useState(false);

  const { departments, isLoading: departmentsLoading } = useDepartments();

  // Reset form when user changes
  useEffect(() => {
    if (user) {
      setFormData({
        employeeId: user.employeeId || '',
        department: user.department || '',
        position: user.position || '',
        roles: user.roles || [APP_ROLES.EMPLOYEE],
        isActive: user.isActive ?? true,
      });
      setActiveTab(0);
      setError('');
      setChangeReason('');
      setConfirmHighRiskOpen(false);
      setEmployeeIdValid(true);
      setShowDeactivateWarning(false);
      setAuditLogs([]);
      setAuditLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (!open || !user || activeTab !== 2) {
      return;
    }

    let cancelled = false;

    const loadAuditLogs = async () => {
      setAuditLoading(true);

      try {
        const res = await fetch(`/api/users/audit?userId=${user.id}&limit=25`);
        if (!res.ok) {
          throw new Error('Failed to fetch user activity');
        }

        const payload = await res.json();
        if (!cancelled) {
          setAuditLogs(payload.data || []);
        }
      } catch {
        if (!cancelled) {
          setAuditLogs([]);
        }
      } finally {
        if (!cancelled) {
          setAuditLoading(false);
        }
      }
    };

    void loadAuditLogs();

    return () => {
      cancelled = true;
    };
  }, [activeTab, open, user]);

  // Debounced employee ID validation
  useEffect(() => {
    if (!formData.employeeId || formData.employeeId === user?.employeeId) {
      setEmployeeIdValid(true);
      setEmployeeIdChecking(false);
      return;
    }

    const timer = setTimeout(async () => {
      setEmployeeIdChecking(true);
      try {
        // Simulated uniqueness check - in production, call an API endpoint
        // For now, assume valid if not empty
        const isValid = Boolean(formData.employeeId && formData.employeeId.trim().length > 0);
        setEmployeeIdValid(isValid);
      } catch {
        setEmployeeIdValid(false);
      } finally {
        setEmployeeIdChecking(false);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [formData.employeeId, user?.employeeId]);

  // Calculate permissions based on roles
  const permissionPreview = useMemo(() => {
    const selectedRoles = ((formData.roles as AppRole[] | undefined) || user?.roles || []) as AppRole[];
    if (!selectedRoles.length) return [];

    const perms: Array<{ label: string; allowed: boolean; description: string }> = [];

    // System Administration
    if (hasAnyRole(selectedRoles, [APP_ROLES.SUPER_ADMIN, APP_ROLES.TECH_ADMIN, APP_ROLES.DEVELOPER])) {
      perms.push({ label: 'User Management', allowed: true, description: 'View and manage all users' });
      perms.push({ label: 'Location Management', allowed: true, description: 'Create and edit locations' });
      perms.push({ label: 'System Settings', allowed: true, description: 'Access system configuration' });
    }

    // Quality roles
    if (hasAnyRole(selectedRoles, [APP_ROLES.QUALITY_MANAGER, APP_ROLES.QUALITY_ANALYST])) {
      perms.push({ label: 'QI Review', allowed: true, description: 'Review and process incidents' });
      perms.push({ label: 'Assign Investigations', allowed: true, description: 'Create and assign investigations' });
      perms.push({ label: 'Manage Corrective Actions', allowed: true, description: 'Create action items' });
    }

    // Supervisor roles
    if (hasAnyRole(selectedRoles, [APP_ROLES.SUPERVISOR, APP_ROLES.TEAM_LEAD])) {
      perms.push({ label: 'Team Incidents', allowed: true, description: 'View team incident reports' });
      perms.push({ label: 'Supervisor Review', allowed: true, description: 'Review and approve team reports' });
    }

    // Executive access
    if (hasAnyRole(selectedRoles, [APP_ROLES.CEO, APP_ROLES.EXECUTIVE])) {
      perms.push({ label: 'Executive Dashboard', allowed: true, description: 'Access executive reports' });
      perms.push({ label: 'All Incidents View', allowed: true, description: 'View all incident data' });
    }

    // All users have these
    perms.push({ label: 'Report Incidents', allowed: true, description: 'Create new incident reports' });
    perms.push({ label: 'My Incidents', allowed: true, description: 'View personal reports' });

    return perms;
  }, [formData.roles, user?.roles]);

  // Handle status change with warning
  const handleStatusChange = (newStatus: boolean) => {
    if (!newStatus && user?.isActive) {
      // User is being deactivated - show warning
      setShowDeactivateWarning(true);
    } else {
      setFormData({ ...formData, isActive: newStatus });
      setShowDeactivateWarning(false);
    }
  };

  const confirmDeactivation = () => {
    setFormData({ ...formData, isActive: false });
    setShowDeactivateWarning(false);
  };

  const beforeRoles = (user?.roles || []) as AppRole[];
  const afterRoles = ((formData.roles as AppRole[] | undefined) || beforeRoles) as AppRole[];
  const rolesChanged = JSON.stringify(beforeRoles) !== JSON.stringify(afterRoles);
  const statusChanged = !!user && (formData.isActive ?? true) !== (user.isActive ?? true);
  const requiresReason = rolesChanged || statusChanged;

  const togglesSuperAdmin =
    beforeRoles.includes(APP_ROLES.SUPER_ADMIN) !== afterRoles.includes(APP_ROLES.SUPER_ADMIN);

  const targetHasManagementAccess = hasAnyRole(beforeRoles, [
    APP_ROLES.SUPER_ADMIN,
    APP_ROLES.TECH_ADMIN,
    APP_ROLES.DEVELOPER,
  ]);

  const isHighRiskChange =
    togglesSuperAdmin ||
    (statusChanged && formData.isActive === false && targetHasManagementAccess);

  const performSave = async (confirmedHighRisk = false) => {
    if (!user) return;

    if (!employeeIdValid && formData.employeeId !== user.employeeId) {
      setError('Please fix the Employee ID validation error');
      return;
    }

    if (!Array.isArray(formData.roles) || formData.roles.length === 0) {
      setError('At least one role is required');
      return;
    }

    if (requiresReason && changeReason.trim().length < 10) {
      setError('Please provide a clear reason (minimum 10 characters) for this role/status change.');
      return;
    }

    if (isHighRiskChange && !confirmedHighRisk) {
      setConfirmHighRiskOpen(true);
      return;
    }

    setSaving(true);
    setError('');

    try {
      await onSave(user.id, formData, {
        reason: changeReason.trim() || undefined,
        confirmHighRisk: isHighRiskChange,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const handleSave = async () => {
    await performSave(false);
  };

  const handleClose = () => {
    if (!saving) {
      onClose();
    }
  };

  if (!user) return null;

  const userInitials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
  // Note: profile sync time is approximated by last update time
  const lastSyncTime = user.updatedAt
    ? formatDistanceToNow(new Date(user.updatedAt), { addSuffix: true })
    : 'Never';

  return (
    <>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: { minHeight: '60vh' },
        }}
      >
        <DialogTitle sx={{ pb: 1 }}>
          <Stack direction="row" alignItems="center" spacing={2}>
            <Avatar
              src={user.profilePicture || undefined}
              sx={{
                width: 48,
                height: 48,
                bgcolor: 'primary.main',
                fontSize: '1.2rem',
              }}
            >
              {userInitials}
            </Avatar>
            <Box>
              <Typography variant="h6" fontWeight={600}>
                {user.firstName} {user.lastName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {user.email}
              </Typography>
            </Box>
            {!user.isActive && (
              <Chip
                label="Inactive"
                size="small"
                sx={{
                  bgcolor: alpha('#EF4444', 0.15),
                  color: '#EF4444',
                  fontWeight: 600,
                }}
              />
            )}
          </Stack>
        </DialogTitle>

        <Divider />

        <Box sx={{ borderBottom: 1, borderColor: 'divider', px: 2 }}>
          <Tabs
            value={activeTab}
            onChange={(_, newValue) => setActiveTab(newValue)}
            aria-label="user edit tabs"
          >
            <Tab icon={<Person fontSize="small" />} iconPosition="start" label="Basic Info" {...a11yProps(0)} />
            <Tab icon={<Security fontSize="small" />} iconPosition="start" label="Roles & Permissions" {...a11yProps(1)} />
            <Tab icon={<History fontSize="small" />} iconPosition="start" label="Activity" {...a11yProps(2)} />
          </Tabs>
        </Box>

        <DialogContent sx={{ pt: 2 }}>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
              {error}
            </Alert>
          )}

          {/* Basic Info Tab */}
          <TabPanel value={activeTab} index={0}>
            <Stack spacing={3}>
              <TextField
                label="Email"
                value={user.email}
                disabled
                fullWidth
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <Info fontSize="small" color="disabled" />
                    </InputAdornment>
                  ),
                }}
                helperText="Email cannot be changed once linked to identity"
              />

              <TextField
                label="Employee ID"
                value={formData.employeeId || ''}
                onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
                fullWidth
                error={!employeeIdValid}
                helperText={
                  employeeIdChecking
                    ? 'Checking availability...'
                    : !employeeIdValid
                      ? 'This Employee ID may already be in use'
                      : 'Unique identifier for this employee'
                }
                InputProps={{
                  endAdornment: (
                    <InputAdornment position="end">
                      {employeeIdChecking ? (
                        <CircularProgress size={20} />
                      ) : employeeIdValid && formData.employeeId ? (
                        <CheckCircleOutline fontSize="small" color="success" />
                      ) : null}
                    </InputAdornment>
                  ),
                }}
              />

              <FormControl fullWidth>
                <InputLabel>Department</InputLabel>
                <Select
                  value={formData.department || ''}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  label="Department"
                  disabled={departmentsLoading}
                >
                  <MenuItem value="">
                    <em>No Department</em>
                  </MenuItem>
                  {departments.map((dept) => (
                    <MenuItem key={dept.id} value={dept.name}>
                      {dept.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Position / Job Title"
                value={formData.position || ''}
                onChange={(e) => setFormData({ ...formData, position: e.target.value })}
                fullWidth
                placeholder="e.g., Senior Nurse, Lab Technician"
              />

              <Paper
                variant="outlined"
                sx={{
                  p: 2,
                  bgcolor: showDeactivateWarning ? alpha('#EF4444', 0.05) : 'transparent',
                  borderColor: showDeactivateWarning ? '#EF4444' : 'divider',
                }}
              >
                <Stack spacing={2}>
                  <FormControlLabel
                    control={
                      <Switch
                        checked={formData.isActive ?? true}
                        onChange={(e) => handleStatusChange(e.target.checked)}
                        color={formData.isActive ? 'success' : 'error'}
                      />
                    }
                    label={
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Typography fontWeight={500}>
                          Account Status: {formData.isActive ? 'Active' : 'Inactive'}
                        </Typography>
                        {formData.isActive ? (
                          <CheckCircle fontSize="small" color="success" />
                        ) : (
                          <Block fontSize="small" color="error" />
                        )}
                      </Stack>
                    }
                  />

                  {showDeactivateWarning && (
                    <Alert
                      severity="warning"
                      icon={<Warning />}
                      action={
                        <Stack direction="row" spacing={1}>
                          <Button
                            size="small"
                            onClick={() => setShowDeactivateWarning(false)}
                          >
                            Cancel
                          </Button>
                          <Button
                            size="small"
                            color="warning"
                            variant="contained"
                            onClick={confirmDeactivation}
                          >
                            Confirm
                          </Button>
                        </Stack>
                      }
                    >
                      <Typography variant="body2" fontWeight={500}>
                        Deactivating this account will:
                      </Typography>
                      <ul style={{ margin: '4px 0', paddingLeft: 20 }}>
                        <li>Prevent the user from logging in</li>
                        <li>Remove them from active assignments</li>
                        <li>Keep their historical data intact</li>
                      </ul>
                    </Alert>
                  )}
                </Stack>
              </Paper>
            </Stack>
          </TabPanel>

          {/* Roles & Permissions Tab */}
          <TabPanel value={activeTab} index={1}>
            <Stack spacing={3}>
              <Alert severity="info" icon={<Info />}>
                <Typography variant="body2">
                  Manage role access here. Changes take effect on the user&apos;s next authenticated request.
                </Typography>
              </Alert>

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Assigned Roles
                </Typography>
                <FormControl fullWidth sx={{ mt: 1 }}>
                  <InputLabel id="roles-select-label">Roles</InputLabel>
                  <Select
                    labelId="roles-select-label"
                    multiple
                    label="Roles"
                    value={(formData.roles as string[]) || []}
                    onChange={(e) => {
                      const nextRoles = Array.isArray(e.target.value)
                        ? e.target.value
                        : [e.target.value];
                      setFormData({ ...formData, roles: nextRoles as any });
                    }}
                    renderValue={(selected) => (
                      <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                        {(selected as string[]).map((roleValue) => {
                          const role = ROLE_OPTIONS.find((r) => r.value === roleValue);
                          return (
                            <Chip
                              key={roleValue}
                              label={role?.label || roleValue}
                              size="small"
                              sx={{
                                bgcolor: alpha(role?.color || '#6B7280', 0.15),
                                color: role?.color || '#6B7280',
                                fontWeight: 600,
                              }}
                            />
                          );
                        })}
                      </Stack>
                    )}
                  >
                    {ROLE_OPTIONS.map((role) => (
                      <MenuItem key={role.value} value={role.value}>
                        <Checkbox checked={((formData.roles as string[]) || []).includes(role.value)} />
                        <Stack spacing={0}>
                          <Typography variant="body2" fontWeight={600}>{role.label}</Typography>
                          <Typography variant="caption" color="text.secondary">{role.description}</Typography>
                        </Stack>
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                  Tip: Keep at least one administrative role on your own account to avoid lockout.
                </Typography>

                <TextField
                  sx={{ mt: 2 }}
                  label="Audit reason"
                  value={changeReason}
                  onChange={(e) => setChangeReason(e.target.value)}
                  multiline
                  minRows={2}
                  fullWidth
                  required={requiresReason}
                  helperText={
                    requiresReason
                      ? 'Required (minimum 10 characters) when changing roles or account status'
                      : 'Optional unless role/status changes are made'
                  }
                />

                {isHighRiskChange && (
                  <Alert severity="warning" sx={{ mt: 2 }}>
                    <Typography variant="body2" fontWeight={600}>High-risk change detected</Typography>
                    <Typography variant="body2">
                      This change affects Super Admin access or deactivates a management-level account. Secondary confirmation is required.
                    </Typography>
                  </Alert>
                )}
              </Box>

              <Box>
                <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                  <Typography variant="subtitle2" color="text.secondary">
                    Last profile sync
                  </Typography>
                  <Chip
                    label={lastSyncTime}
                    size="small"
                    variant="outlined"
                    icon={<AccessTime fontSize="small" />}
                  />
                </Stack>
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Permission Preview
                </Typography>
                <Typography variant="caption" color="text.secondary" sx={{ mb: 2, display: 'block' }}>
                  Based on current roles, this user has access to:
                </Typography>

                <Grid container spacing={1}>
                  {permissionPreview.map((perm, idx) => (
                    <Grid key={idx} size={{ xs: 12, sm: 6 }}>
                      <Paper
                        variant="outlined"
                        sx={{
                          p: 1.5,
                          display: 'flex',
                          alignItems: 'center',
                          gap: 1,
                          bgcolor: alpha('#10B981', 0.05),
                          borderColor: alpha('#10B981', 0.3),
                        }}
                      >
                        <CheckCircle fontSize="small" sx={{ color: '#10B981' }} />
                        <Box>
                          <Typography variant="body2" fontWeight={500}>
                            {perm.label}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {perm.description}
                          </Typography>
                        </Box>
                      </Paper>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            </Stack>
          </TabPanel>

          {/* Activity Tab */}
          <TabPanel value={activeTab} index={2}>
            <Stack spacing={3}>
              <Alert severity="info" icon={<Info />} sx={{ mb: 1 }}>
                Detailed activity statistics will be available in a future update.
                Currently showing account information only.
              </Alert>

              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <StatCard
                    icon={<Assignment />}
                    label="Total Incidents Reported"
                    value="—"
                    color="#3B82F6"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <StatCard
                    icon={<TrendingUp />}
                    label="Incidents in Progress"
                    value="—"
                    color="#F59E0B"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <StatCard
                    icon={<CalendarToday />}
                    label="Last Updated"
                    value={format(new Date(user.updatedAt), 'MMM dd, yyyy')}
                    color="#8B5CF6"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <StatCard
                    icon={<AccessTime />}
                    label="Account Created"
                    value={format(new Date(user.createdAt), 'MMM dd, yyyy')}
                    color="#10B981"
                  />
                </Grid>
              </Grid>

              <Divider />

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Account Timeline
                </Typography>
                <Stack spacing={1.5} sx={{ mt: 1 }}>
                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: '#10B981',
                      }}
                    />
                    <Typography variant="body2">
                      Account created on {format(new Date(user.createdAt), 'MMMM dd, yyyy')}
                    </Typography>
                  </Stack>

                  <Stack direction="row" alignItems="center" spacing={2}>
                    <Box
                      sx={{
                        width: 8,
                        height: 8,
                        borderRadius: '50%',
                        bgcolor: '#8B5CF6',
                      }}
                    />
                    <Typography variant="body2">
                      Profile updated on {format(new Date(user.updatedAt), 'MMMM dd, yyyy')}
                    </Typography>
                  </Stack>
                </Stack>
              </Box>

              <Divider />

              <Box>
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                  Admin Activity Audit
                </Typography>

                {auditLoading ? (
                  <Stack direction="row" spacing={1} alignItems="center">
                    <CircularProgress size={16} />
                    <Typography variant="body2" color="text.secondary">Loading activity...</Typography>
                  </Stack>
                ) : auditLogs.length === 0 ? (
                  <Typography variant="body2" color="text.secondary">
                    No admin activity logged yet for this user.
                  </Typography>
                ) : (
                  <Stack spacing={1.5} sx={{ mt: 1 }}>
                    {auditLogs.map((log) => {
                      const entries = Object.entries(log.changes || {});

                      return (
                        <Paper key={log.id} variant="outlined" sx={{ p: 1.5 }}>
                          <Stack spacing={0.5}>
                            <Stack direction="row" justifyContent="space-between" alignItems="center">
                              <Typography variant="body2" fontWeight={600}>
                                {log.action === 'user_created' ? 'User created' : 'User updated'}
                              </Typography>
                              <Typography variant="caption" color="text.secondary">
                                {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                              </Typography>
                            </Stack>

                            <Typography variant="caption" color="text.secondary">
                              By {log.actor?.name || 'Unknown'}{log.actor?.email ? ` (${log.actor.email})` : ''}
                            </Typography>

                            {log.reason && (
                              <Typography variant="caption" color="text.secondary">
                                Reason: {log.reason}
                              </Typography>
                            )}

                            {entries.length > 0 && (
                              <Box component="ul" sx={{ m: 0, mt: 0.5, pl: 2.5 }}>
                                {entries.slice(0, 5).map(([field, value]) => {
                                  const isDiff = value && typeof value === 'object' && 'from' in value && 'to' in value;
                                  const line = isDiff
                                    ? `${field}: ${JSON.stringify((value as any).from)} → ${JSON.stringify((value as any).to)}`
                                    : `${field}: ${JSON.stringify(value)}`;

                                  return (
                                    <Typography key={`${log.id}-${field}`} component="li" variant="caption" color="text.secondary">
                                      {line}
                                    </Typography>
                                  );
                                })}
                              </Box>
                            )}
                          </Stack>
                        </Paper>
                      );
                    })}
                  </Stack>
                )}
              </Box>

              {!user.isActive && (
                <Alert severity="warning" icon={<Warning />}>
                  This account is currently deactivated. The user cannot log in or access the system.
                </Alert>
              )}
            </Stack>
          </TabPanel>
        </DialogContent>

        <Divider />

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleClose} disabled={saving}>
            Cancel
          </Button>
          <Button
            onClick={handleSave}
            variant="contained"
            disabled={
              saving ||
              (!employeeIdValid && formData.employeeId !== user.employeeId) ||
              !Array.isArray(formData.roles) ||
              formData.roles.length === 0
            }
            startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={confirmHighRiskOpen} onClose={() => setConfirmHighRiskOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle>Confirm High-Risk Change</DialogTitle>
        <DialogContent>
          <Alert severity="warning" sx={{ mt: 1 }}>
            This action affects critical access and requires explicit confirmation.
          </Alert>
          <Typography variant="body2" sx={{ mt: 2 }}>
            Please confirm to proceed. Your reason will be recorded in the audit log.
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmHighRiskOpen(false)}>Cancel</Button>
          <Button
            color="warning"
            variant="contained"
            onClick={async () => {
              setConfirmHighRiskOpen(false);
              await performSave(true);
            }}
          >
            Confirm and Save
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}

export default function UsersManagementPage() {
  const { data: session } = useSession();
  const router = useRouter();
  const { departments } = useDepartments();

  // Filters and pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [role, setRole] = useState('');
  const [isActive, setIsActive] = useState<boolean | undefined>(undefined);
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'firstName' | 'lastName' | 'email' | 'department'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [createUserOpen, setCreateUserOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);
  const [toast, setToast] = useState<{ open: boolean; message: string; severity: 'success' | 'error' }>({
    open: false,
    message: '',
    severity: 'success',
  });

  // Redirect non-admins
  useEffect(() => {
    if (session && !ACCESS_CONTROL.ui.userManagement.canAccess(session.user.roles)) {
      router.replace('/dashboard');
    }
  }, [session, router]);

  // Debounced search
  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(1);
    }, 500);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [search]);

  // Fetch users with current filters
  const { users, pagination, isLoading, error, updateUser, createUser, refresh } = useUserManagement({
    page,
    pageSize,
    search: debouncedSearch,
    roles: role ? [role] : undefined,
    isActive,
    sortBy,
    sortOrder,
  });

  const handlePageChange = useCallback((_: unknown, newPage: number) => {
    setPage(newPage);
  }, []);

  const handleSortChange = useCallback((field: string) => {
    const validFields = ['createdAt', 'updatedAt', 'firstName', 'lastName', 'email', 'department'] as const;
    if (validFields.includes(field as any)) {
      setSortBy(field as typeof validFields[number]);
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    }
  }, []);

  const handleClearFilters = useCallback(() => {
    setSearch('');
    setDebouncedSearch('');
    setRole('');
    setIsActive(undefined);
    setSortBy('createdAt');
    setSortOrder('desc');
    setPage(1);
  }, []);

  const handleEditUser = useCallback((user: User) => {
    setEditUser(user);
  }, []);

  const handleSaveUser = useCallback(
    async (userId: number, updates: UserUpdate, meta?: { reason?: string; confirmHighRisk?: boolean }) => {
      try {
        await updateUser(userId, updates, meta);
        setEditUser(null);
        setToast({ open: true, message: 'User updated successfully', severity: 'success' });
      } catch (error) {
        setToast({ open: true, message: 'Failed to update user', severity: 'error' });
        throw error;
      }
    },
    [updateUser]
  );

  const handleCreateUser = useCallback(
    async (payload: UserCreate, meta?: { reason?: string; confirmHighRisk?: boolean }) => {
      try {
        await createUser(payload, meta);
        setCreateUserOpen(false);
        setToast({ open: true, message: 'User created successfully', severity: 'success' });
      } catch (error) {
        setToast({ open: true, message: 'Failed to create user', severity: 'error' });
        throw error;
      }
    },
    [createUser]
  );

  const getRoleInfo = (roleValue: string) => {
    const meta = ROLE_METADATA[roleValue as AppRole];
    if (meta) {
      return { value: roleValue, label: meta.label, color: meta.color };
    }
    // Fallback for unknown roles
    return { value: roleValue, label: roleValue, color: '#6B7280' };
  };

  if (session === null) return null;
  if (session && !ACCESS_CONTROL.ui.userManagement.canAccess(session.user.roles)) {
    return null;
  }

  const hasActiveFilters = search || role || isActive || sortBy !== 'createdAt';

  return (
    <AppLayout>
      <Box>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
        >
          <Stack spacing={3}>
            {/* Header */}
            <Stack spacing={1.5}>
              <Stack direction="row" alignItems="center" justifyContent="space-between" spacing={2}>
                <Stack direction="row" alignItems="center" spacing={1}>
                  <AdminPanelSettings fontSize="large" color="primary" />
                  <Typography variant="h4" fontWeight={700}>
                    User Management
                  </Typography>
                </Stack>
                <Button
                  variant="contained"
                  startIcon={<PersonAdd />}
                  onClick={() => setCreateUserOpen(true)}
                >
                  Create User
                </Button>
              </Stack>
              <Typography variant="body1" color="text.secondary">
                Manage user roles, permissions, and account status ({pagination.total} total
                users)
              </Typography>
            </Stack>

            {/* Filters */}
            <Paper sx={{ p: 2 }}>
              <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap">
                <TextField
                  placeholder="Search users..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  size="small"
                  InputProps={{
                    startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                  }}
                  sx={{ flex: 1, minWidth: 200 }}
                />

                <FormControl size="small" sx={{ minWidth: 150 }}>
                  <InputLabel>Role</InputLabel>
                  <Select value={role} onChange={(e) => setRole(e.target.value)} label="Role">
                    {ROLE_FILTER_OPTIONS.map((r) => (
                      <MenuItem key={r.value} value={r.value}>
                        {r.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <FormControl size="small" sx={{ minWidth: 120 }}>
                  <InputLabel>Status</InputLabel>
                  <Select
                    value={isActive === undefined ? '' : String(isActive)}
                    onChange={(e) => {
                      const value = e.target.value;
                      setIsActive(value === '' ? undefined : value === 'true');
                    }}
                    label="Status"
                  >
                    {STATUS_OPTIONS.map((s) => (
                      <MenuItem key={s.value} value={s.value}>
                        {s.label}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>

                <Tooltip title="Refresh">
                  <IconButton onClick={() => refresh()} size="small">
                    <Refresh />
                  </IconButton>
                </Tooltip>

                {hasActiveFilters && (
                  <Button
                    size="small"
                    startIcon={<Close />}
                    onClick={handleClearFilters}
                    variant="outlined"
                  >
                    Clear
                  </Button>
                )}
              </Stack>
            </Paper>

            {/* Table */}
            {error && (
              <ErrorLayout error={error} variant="inline" onRetry={() => refresh()} showBack={false} showHome={false} />
            )}

            <Paper>
              <TableContainer>
                <Table>
                  <TableHead>
                    <TableRow sx={{ bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05) }}>
                      <TableCell
                        onClick={() => handleSortChange('firstName')}
                        sx={{ cursor: 'pointer', fontWeight: 600 }}
                      >
                        Name {sortBy === 'firstName' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </TableCell>
                      <TableCell
                        onClick={() => handleSortChange('email')}
                        sx={{ cursor: 'pointer', fontWeight: 600 }}
                      >
                        Email {sortBy === 'email' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Employee ID</TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Role</TableCell>
                      <TableCell
                        onClick={() => handleSortChange('department')}
                        sx={{ cursor: 'pointer', fontWeight: 600 }}
                      >
                        Department {sortBy === 'department' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </TableCell>
                      <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                      <TableCell
                        onClick={() => handleSortChange('updatedAt')}
                        sx={{ cursor: 'pointer', fontWeight: 600 }}
                      >
                        Last Updated {sortBy === 'updatedAt' && (sortOrder === 'asc' ? '↑' : '↓')}
                      </TableCell>
                      <TableCell align="right" sx={{ fontWeight: 600 }}>
                        Actions
                      </TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {isLoading && (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                          Loading users...
                        </TableCell>
                      </TableRow>
                    )}
                    {!isLoading && users.length === 0 && (
                      <TableRow>
                        <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                          <Typography color="text.secondary">
                            No users found matching your filters
                          </Typography>
                        </TableCell>
                      </TableRow>
                    )}
                    {!isLoading &&
                      users.map((user) => {
                        return (
                          <TableRow
                            key={user.id}
                            hover
                            sx={{
                              transition: 'all 0.2s',
                              '&:hover': {
                                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.02),
                              },
                            }}
                          >
                            <TableCell>
                              <Typography variant="body2" fontWeight={600}>
                                {user.firstName} {user.lastName}
                              </Typography>
                              {user.position && (
                                <Typography variant="caption" color="text.secondary">
                                  {user.position}
                                </Typography>
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{user.email}</Typography>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">{user.employeeId || 'N/A'}</Typography>
                            </TableCell>
                            <TableCell>
                              <Stack direction="row" spacing={0.5} flexWrap="wrap" useFlexGap>
                                {user.roles?.map((roleValue) => {
                                  const roleInfo = getRoleInfo(roleValue);
                                  return (
                                    <Chip
                                      key={roleValue}
                                      label={roleInfo.label}
                                      size="small"
                                      sx={{
                                        bgcolor: alpha(roleInfo.color, 0.15),
                                        color: roleInfo.color,
                                        fontWeight: 600,
                                        borderRadius: 1,
                                      }}
                                    />
                                  );
                                })}
                              </Stack>
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {user.department || 'N/A'}
                              </Typography>
                            </TableCell>
                            <TableCell>
                              {user.isActive ? (
                                <Chip
                                  icon={<CheckCircle fontSize="small" />}
                                  label="Active"
                                  size="small"
                                  sx={{
                                    bgcolor: alpha('#10B981', 0.15),
                                    color: '#10B981',
                                    fontWeight: 600,
                                  }}
                                />
                              ) : (
                                <Chip
                                  label="Inactive"
                                  size="small"
                                  sx={{
                                    bgcolor: alpha('#EF4444', 0.15),
                                    color: '#EF4444',
                                    fontWeight: 600,
                                  }}
                                />
                              )}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2">
                                {format(new Date(user.updatedAt), 'MMM dd, yyyy')}
                              </Typography>
                            </TableCell>
                            <TableCell align="right">
                              <Tooltip title="Edit user">
                                <IconButton
                                  size="small"
                                  onClick={() => handleEditUser(user)}
                                  color="primary"
                                >
                                  <Edit fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                  </TableBody>
                </Table>
              </TableContainer>

              {/* Pagination */}
              {pagination.totalPages > 1 && (
                <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                  <Pagination
                    count={pagination.totalPages}
                    page={page}
                    onChange={handlePageChange}
                    color="primary"
                    showFirstButton
                    showLastButton
                  />
                </Box>
              )}
            </Paper>
          </Stack>
        </motion.div>
      </Box>

      {/* Edit Dialog */}
      <EnhancedEditUserDialog
        open={!!editUser}
        user={editUser}
        onClose={() => setEditUser(null)}
        onSave={handleSaveUser}
      />

      <CreateUserDialog
        open={createUserOpen}
        onClose={() => setCreateUserOpen(false)}
        onCreate={handleCreateUser}
        departments={departments.map((d) => ({ id: d.id, name: d.name }))}
      />

      <Snackbar
        open={toast.open}
        autoHideDuration={3500}
        onClose={() => setToast((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'right' }}
      >
        <Alert
          onClose={() => setToast((prev) => ({ ...prev, open: false }))}
          severity={toast.severity}
          variant="filled"
          sx={{ minWidth: 260 }}
        >
          {toast.message}
        </Alert>
      </Snackbar>
    </AppLayout>
  );
}
