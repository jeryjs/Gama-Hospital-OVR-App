'use client';

import { AppLayout } from '@/components/AppLayout';
import type { User, UserUpdate } from '@/lib/api/schemas';
import { useUserManagement, useDepartments } from '@/lib/hooks';
import { fadeIn } from '@/lib/theme';
import { APP_ROLES, ROLE_METADATA, AppRole } from '@/lib/constants';
import { ACCESS_CONTROL } from '@/lib/access-control';
import { hasAnyRole } from '@/lib/auth-helpers';
import {
  AdminPanelSettings,
  CheckCircle,
  Close,
  Edit,
  FilterList,
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
// ENHANCED EDIT USER DIALOG
// ============================================

interface EnhancedEditDialogProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onSave: (userId: number, updates: UserUpdate) => Promise<void>;
}

function EnhancedEditUserDialog({ open, user, onClose, onSave }: EnhancedEditDialogProps) {
  const [activeTab, setActiveTab] = useState(0);
  const [formData, setFormData] = useState<UserUpdate>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
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
        isActive: user.isActive ?? true,
      });
      setActiveTab(0);
      setError('');
      setEmployeeIdValid(true);
      setShowDeactivateWarning(false);
    }
  }, [user]);

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
    if (!user?.roles) return [];
    const perms: Array<{ label: string; allowed: boolean; description: string }> = [];

    // System Administration
    if (hasAnyRole(user.roles as AppRole[], [APP_ROLES.SUPER_ADMIN, APP_ROLES.TECH_ADMIN, APP_ROLES.DEVELOPER])) {
      perms.push({ label: 'User Management', allowed: true, description: 'View and manage all users' });
      perms.push({ label: 'Location Management', allowed: true, description: 'Create and edit locations' });
      perms.push({ label: 'System Settings', allowed: true, description: 'Access system configuration' });
    }

    // Quality roles
    if (hasAnyRole(user.roles as AppRole[], [APP_ROLES.QUALITY_MANAGER, APP_ROLES.QUALITY_ANALYST])) {
      perms.push({ label: 'QI Review', allowed: true, description: 'Review and process incidents' });
      perms.push({ label: 'Assign Investigations', allowed: true, description: 'Create and assign investigations' });
      perms.push({ label: 'Manage Corrective Actions', allowed: true, description: 'Create action items' });
    }

    // Supervisor roles
    if (hasAnyRole(user.roles as AppRole[], [APP_ROLES.SUPERVISOR, APP_ROLES.TEAM_LEAD])) {
      perms.push({ label: 'Team Incidents', allowed: true, description: 'View team incident reports' });
      perms.push({ label: 'Supervisor Review', allowed: true, description: 'Review and approve team reports' });
    }

    // Executive access
    if (hasAnyRole(user.roles as AppRole[], [APP_ROLES.CEO, APP_ROLES.EXECUTIVE])) {
      perms.push({ label: 'Executive Dashboard', allowed: true, description: 'Access executive reports' });
      perms.push({ label: 'All Incidents View', allowed: true, description: 'View all incident data' });
    }

    // All users have these
    perms.push({ label: 'Report Incidents', allowed: true, description: 'Create new incident reports' });
    perms.push({ label: 'My Incidents', allowed: true, description: 'View personal reports' });

    return perms;
  }, [user?.roles]);

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

  const handleSave = async () => {
    if (!user) return;

    if (!employeeIdValid && formData.employeeId !== user.employeeId) {
      setError('Please fix the Employee ID validation error');
      return;
    }

    setSaving(true);
    setError('');

    try {
      await onSave(user.id, formData);
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save user');
    } finally {
      setSaving(false);
    }
  };

  const handleClose = () => {
    if (!saving) {
      onClose();
    }
  };

  if (!user) return null;

  const userInitials = `${user.firstName?.[0] || ''}${user.lastName?.[0] || ''}`.toUpperCase();
  // Note: Azure AD sync time is approximated by last update time
  const lastSyncTime = user.updatedAt
    ? formatDistanceToNow(new Date(user.updatedAt), { addSuffix: true })
    : 'Never';

  return (
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
              helperText="Email cannot be changed (synced from Azure AD)"
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
                Roles are managed through Azure AD security groups and cannot be changed here.
                Contact your IT administrator to modify role assignments.
              </Typography>
            </Alert>

            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Assigned Roles
              </Typography>
              <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mt: 1 }}>
                {user.roles && user.roles.length > 0 ? (
                  user.roles.map((roleValue) => {
                    const meta = ROLE_METADATA[roleValue as AppRole] || {
                      label: roleValue,
                      color: '#6B7280',
                    };
                    return (
                      <Tooltip key={roleValue} title={meta.description || ''}>
                        <Chip
                          label={meta.label}
                          sx={{
                            bgcolor: alpha(meta.color, 0.15),
                            color: meta.color,
                            fontWeight: 600,
                            borderRadius: 1,
                          }}
                        />
                      </Tooltip>
                    );
                  })
                ) : (
                  <Typography variant="body2" color="text.secondary">
                    No roles assigned
                  </Typography>
                )}
              </Stack>
            </Box>

            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 1 }}>
                <Typography variant="subtitle2" color="text.secondary">
                  Last Synced with Azure AD
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
          disabled={saving || (!employeeIdValid && formData.employeeId !== user.employeeId)}
          startIcon={saving ? <CircularProgress size={16} color="inherit" /> : null}
        >
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default function UsersManagementPage() {
  const { data: session } = useSession();
  const router = useRouter();

  // Filters and pagination state
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [role, setRole] = useState('');
  const [isActive, setIsActive] = useState<boolean | undefined>(undefined);
  const [sortBy, setSortBy] = useState<'createdAt' | 'updatedAt' | 'firstName' | 'lastName' | 'email' | 'department'>('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [editUser, setEditUser] = useState<User | null>(null);

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
  const { users, pagination, isLoading, error, updateUser, refresh } = useUserManagement({
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
    async (userId: number, updates: UserUpdate) => {
      await updateUser(userId, updates);
      setEditUser(null);
    },
    [updateUser]
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
            <Stack spacing={1}>
              <Stack direction="row" alignItems="center" spacing={1}>
                <AdminPanelSettings fontSize="large" color="primary" />
                <Typography variant="h4" fontWeight={700}>
                  User Management
                </Typography>
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
              <Paper sx={{ p: 2, bgcolor: alpha('#EF4444', 0.1) }}>
                <Typography color="error">Error loading users: {error.message}</Typography>
              </Paper>
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
    </AppLayout>
  );
}
