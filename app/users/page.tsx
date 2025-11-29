'use client';

import { AppLayout } from '@/components/AppLayout';
import { User, UserUpdate } from '@/lib/api/schemas';
import { useUserManagement } from '@/lib/hooks';
import { fadeIn } from '@/lib/theme';
import {
  AdminPanelSettings,
  CheckCircle,
  Close,
  Edit,
  FilterList,
  PersonAdd,
  Refresh,
  Search as SearchIcon,
} from '@mui/icons-material';
import {
  alpha,
  Box,
  Button,
  Chip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  IconButton,
  InputLabel,
  MenuItem,
  Pagination,
  Paper,
  Select,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
  Typography,
} from '@mui/material';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';

const ROLES = [
  { value: '', label: 'All Roles' },
  { value: 'admin', label: 'Admin', color: '#EF4444' },
  { value: 'quality_manager', label: 'Quality Manager', color: '#8B5CF6' },
  { value: 'department_head', label: 'Department Head', color: '#EC4899' },
  { value: 'supervisor', label: 'Supervisor', color: '#3B82F6' },
  { value: 'employee', label: 'Employee', color: '#6B7280' },
];

const STATUS_OPTIONS = [
  { value: '', label: 'All Status' },
  { value: 'true', label: 'Active' },
  { value: 'false', label: 'Inactive' },
];

interface EditUserDialogProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onSave: (userId: number, updates: UserUpdate) => Promise<void>;
}

function EditUserDialog({ open, user, onClose, onSave }: EditUserDialogProps) {
  const [formData, setFormData] = useState<UserUpdate>({});
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setFormData({
        role: user.role,
        department: user.department || '',
        position: user.position || '',
        employeeId: user.employeeId || '',
        isActive: user.isActive,
      });
    }
  }, [user]);

  const handleSave = async () => {
    if (!user) return;

    setSaving(true);
    setError('');

    try {
      await onSave(user.id, formData);
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to update user');
    } finally {
      setSaving(false);
    }
  };

  if (!user) return null;

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        Edit User: {user.firstName} {user.lastName}
      </DialogTitle>
      <DialogContent>
        {error && (
          <Box sx={{ mb: 2, p: 2, bgcolor: alpha('#EF4444', 0.1), borderRadius: 1 }}>
            <Typography color="error" variant="body2">
              {error}
            </Typography>
          </Box>
        )}

        <Stack spacing={2} sx={{ mt: 1 }}>
          <TextField label="Email" value={user.email} disabled fullWidth />

          <FormControl fullWidth>
            <InputLabel>Role</InputLabel>
            <Select
              value={formData.role || ''}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              label="Role"
            >
              {ROLES.slice(1).map((role) => (
                <MenuItem key={role.value} value={role.value}>
                  {role.label}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Employee ID"
            value={formData.employeeId || ''}
            onChange={(e) => setFormData({ ...formData, employeeId: e.target.value })}
            fullWidth
          />

          <TextField
            label="Department"
            value={formData.department || ''}
            onChange={(e) => setFormData({ ...formData, department: e.target.value })}
            fullWidth
          />

          <TextField
            label="Position"
            value={formData.position || ''}
            onChange={(e) => setFormData({ ...formData, position: e.target.value })}
            fullWidth
          />

          <FormControl fullWidth>
            <InputLabel>Status</InputLabel>
            <Select
              value={formData.isActive ? 'true' : 'false'}
              onChange={(e) =>
                setFormData({ ...formData, isActive: e.target.value === 'true' })
              }
              label="Status"
            >
              <MenuItem value="true">Active</MenuItem>
              <MenuItem value="false">Inactive</MenuItem>
            </Select>
          </FormControl>
        </Stack>
      </DialogContent>
      <DialogActions>
        <Button onClick={onClose} disabled={saving}>
          Cancel
        </Button>
        <Button onClick={handleSave} variant="contained" disabled={saving}>
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
    if (session && session.user.role !== 'admin') {
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
    role,
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
    return ROLES.find((r) => r.value === roleValue) || ROLES[ROLES.length - 1];
  };

  if (session === null) return null;
  if (session && session.user.role !== 'admin') return null;

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
                    {ROLES.map((r) => (
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
                        const roleInfo = getRoleInfo(user.role);
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
                              <Chip
                                label={roleInfo.label}
                                size="small"
                                sx={{
                                  bgcolor: alpha(roleInfo.color || '#6B7280', 0.15),
                                  color: roleInfo.color || '#6B7280',
                                  fontWeight: 600,
                                  borderRadius: 1,
                                }}
                              />
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
      <EditUserDialog
        open={!!editUser}
        user={editUser}
        onClose={() => setEditUser(null)}
        onSave={handleSaveUser}
      />
    </AppLayout>
  );
}
