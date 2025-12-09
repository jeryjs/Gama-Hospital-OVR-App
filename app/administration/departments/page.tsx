'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AppLayout } from '@/components/AppLayout';
import { useDepartmentManagement, useUsers } from '@/lib/hooks';
import type { DepartmentWithLocations, DepartmentCreate, DepartmentUpdate } from '@/lib/api/schemas';
import { ACCESS_CONTROL } from '@/lib/access-control';
import {
    Add,
    Business,
    CheckCircle,
    Close,
    Delete,
    Edit,
    Refresh,
    Search as SearchIcon,
    Warning,
    Place,
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
    FormControlLabel,
    IconButton,
    InputLabel,
    MenuItem,
    Pagination,
    Paper,
    Select,
    Skeleton,
    Stack,
    Switch,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TextField,
    Tooltip,
    Typography,
    Alert,
    Grid,
} from '@mui/material';
import { motion } from 'framer-motion';

// ============================================
// CODE SUGGESTION HELPER
// ============================================
function generateCodeSuggestion(name: string): string {
    if (!name) return '';
    // Take first letters of each word, max 5 chars, uppercase
    const words = name.trim().split(/\s+/);
    if (words.length === 1) {
        return name.substring(0, 4).toUpperCase();
    }
    return words
        .map((w) => w[0])
        .join('')
        .substring(0, 5)
        .toUpperCase();
}

// ============================================
// CREATE DEPARTMENT DIALOG
// ============================================
interface CreateDepartmentDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (data: DepartmentCreate) => Promise<void>;
    users: { id: number; firstName: string; lastName: string }[];
}

function CreateDepartmentDialog({ open, onClose, onSave, users }: CreateDepartmentDialogProps) {
    const [formData, setFormData] = useState<DepartmentCreate>({
        name: '',
        code: '',
        headId: undefined,
        isActive: true,
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');
    const [codeManuallyEdited, setCodeManuallyEdited] = useState(false);

    // Auto-suggest code when name changes (if not manually edited)
    useEffect(() => {
        if (!codeManuallyEdited && formData.name) {
            setFormData((prev) => ({ ...prev, code: generateCodeSuggestion(prev.name) }));
        }
    }, [formData.name, codeManuallyEdited]);

    const handleSave = async () => {
        if (!formData.name.trim()) {
            setError('Department name is required');
            return;
        }
        if (!formData.code.trim()) {
            setError('Department code is required');
            return;
        }

        setSaving(true);
        setError('');
        try {
            await onSave(formData);
            setFormData({ name: '', code: '', headId: undefined, isActive: true });
            setCodeManuallyEdited(false);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create department');
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        setFormData({ name: '', code: '', headId: undefined, isActive: true });
        setCodeManuallyEdited(false);
        setError('');
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>Create New Department</DialogTitle>
            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
                        {error}
                    </Alert>
                )}
                <Stack spacing={2} sx={{ mt: 1 }}>
                    <TextField
                        label="Department Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        fullWidth
                        required
                        placeholder="e.g., Emergency Medicine"
                    />
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                label="Code"
                                value={formData.code}
                                onChange={(e) => {
                                    setFormData({ ...formData, code: e.target.value.toUpperCase() });
                                    setCodeManuallyEdited(true);
                                }}
                                fullWidth
                                required
                                placeholder="e.g., EM"
                                helperText="Auto-generated from name, or enter manually"
                                inputProps={{ maxLength: 20 }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <FormControl fullWidth>
                                <InputLabel>Department Head</InputLabel>
                                <Select
                                    value={formData.headId || ''}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            headId: e.target.value ? Number(e.target.value) : undefined,
                                        })
                                    }
                                    label="Department Head"
                                >
                                    <MenuItem value="">
                                        <em>None</em>
                                    </MenuItem>
                                    {users.map((user) => (
                                        <MenuItem key={user.id} value={user.id}>
                                            {user.firstName} {user.lastName}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={formData.isActive}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            />
                        }
                        label="Active"
                    />
                </Stack>
            </DialogContent>
            <DialogActions>
                <Button onClick={handleClose} disabled={saving}>
                    Cancel
                </Button>
                <Button onClick={handleSave} variant="contained" disabled={saving}>
                    {saving ? 'Creating...' : 'Create Department'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// ============================================
// EDIT DEPARTMENT DIALOG
// ============================================
interface EditDepartmentDialogProps {
    open: boolean;
    department: DepartmentWithLocations | null;
    onClose: () => void;
    onSave: (id: number, data: DepartmentUpdate) => Promise<void>;
    users: { id: number; firstName: string; lastName: string }[];
}

function EditDepartmentDialog({
    open,
    department,
    onClose,
    onSave,
    users,
}: EditDepartmentDialogProps) {
    const [formData, setFormData] = useState<DepartmentUpdate>({});
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (department) {
            setFormData({
                name: department.name,
                code: department.code,
                headId: department.headOfDepartment ?? undefined,
                isActive: department.isActive,
            });
        }
    }, [department]);

    const handleSave = async () => {
        if (!department) return;
        if (!formData.name?.trim()) {
            setError('Department name is required');
            return;
        }
        if (!formData.code?.trim()) {
            setError('Department code is required');
            return;
        }

        setSaving(true);
        setError('');
        try {
            await onSave(department.id, formData);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update department');
        } finally {
            setSaving(false);
        }
    };

    if (!department) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Edit Department: {department.name}</DialogTitle>
            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
                        {error}
                    </Alert>
                )}
                <Stack spacing={2} sx={{ mt: 1 }}>
                    <TextField
                        label="Department Name"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        fullWidth
                        required
                    />
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                label="Code"
                                value={formData.code || ''}
                                onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                fullWidth
                                required
                                inputProps={{ maxLength: 20 }}
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <FormControl fullWidth>
                                <InputLabel>Department Head</InputLabel>
                                <Select
                                    value={formData.headId || ''}
                                    onChange={(e) =>
                                        setFormData({
                                            ...formData,
                                            headId: e.target.value ? Number(e.target.value) : undefined,
                                        })
                                    }
                                    label="Department Head"
                                >
                                    <MenuItem value="">
                                        <em>None</em>
                                    </MenuItem>
                                    {users.map((user) => (
                                        <MenuItem key={user.id} value={user.id}>
                                            {user.firstName} {user.lastName}
                                        </MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                    </Grid>
                    <FormControlLabel
                        control={
                            <Switch
                                checked={formData.isActive ?? true}
                                onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                            />
                        }
                        label="Active"
                    />
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

// ============================================
// DELETE CONFIRMATION DIALOG
// ============================================
interface DeleteDepartmentDialogProps {
    open: boolean;
    department: DepartmentWithLocations | null;
    onClose: () => void;
    onConfirm: (id: number) => Promise<void>;
}

function DeleteDepartmentDialog({
    open,
    department,
    onClose,
    onConfirm,
}: DeleteDepartmentDialogProps) {
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');

    const locationCount = department?.locations?.length || 0;
    const canDelete = locationCount === 0;

    const handleDelete = async () => {
        if (!department || !canDelete) return;

        setDeleting(true);
        setError('');
        try {
            await onConfirm(department.id);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete department');
        } finally {
            setDeleting(false);
        }
    };

    if (!department) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Warning color="warning" />
                Delete Department
            </DialogTitle>
            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}
                <Typography>
                    Are you sure you want to delete <strong>{department.name}</strong>?
                </Typography>
                {!canDelete ? (
                    <Alert severity="error" sx={{ mt: 2 }}>
                        Cannot delete this department. It has {locationCount} active location{locationCount !== 1 ? 's' : ''}.
                        Please reassign or delete the locations first.
                    </Alert>
                ) : (
                    <Alert severity="warning" sx={{ mt: 2 }}>
                        This action cannot be undone.
                    </Alert>
                )}
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={deleting}>
                    Cancel
                </Button>
                <Button
                    onClick={handleDelete}
                    color="error"
                    variant="contained"
                    disabled={deleting || !canDelete}
                >
                    {deleting ? 'Deleting...' : 'Delete'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================
export default function DepartmentsManagementPage() {
    const { data: session } = useSession();
    const router = useRouter();

    // Filters
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [activeFilter, setActiveFilter] = useState<boolean | ''>('');
    const [page, setPage] = useState(1);
    const pageSize = 10;

    // Dialogs
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editDepartment, setEditDepartment] = useState<DepartmentWithLocations | null>(null);
    const [deleteDepartment, setDeleteDepartment] = useState<DepartmentWithLocations | null>(null);

    // Hooks
    const {
        departments,
        pagination,
        isLoading,
        error,
        createDepartment,
        updateDepartment,
        deleteDepartment: removeDepartment,
        mutate,
    } = useDepartmentManagement({
        page,
        pageSize,
        search: debouncedSearch,
        isActive: activeFilter === '' ? undefined : activeFilter,
        includeLocations: true,
    });

    // Fetch users for head selection (simple list)
    const { users, error: usersError, isLoading: usersLoading } = useUsers();

    // Permission checks
    const userRoles = session?.user?.roles || [];
    const canCreate = ACCESS_CONTROL.api.locations.canCreate(userRoles); // Same permissions as locations
    const canEdit = ACCESS_CONTROL.api.locations.canEdit(userRoles);
    const canDelete = ACCESS_CONTROL.api.locations.canDelete(userRoles);
    const canAccess = ACCESS_CONTROL.ui.navigation.showLocationManagement(userRoles);

    // Redirect non-authorized users
    useEffect(() => {
        if (session && !canAccess) {
            router.replace('/dashboard');
        }
    }, [session, canAccess, router]);

    // Debounced search
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);
    useEffect(() => {
        if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        debounceTimerRef.current = setTimeout(() => {
            setDebouncedSearch(search);
            setPage(1);
        }, 300);
        return () => {
            if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
        };
    }, [search]);

    // Handlers
    const handleCreateDepartment = async (data: DepartmentCreate) => {
        await createDepartment(data);
    };

    const handleUpdateDepartment = async (id: number, data: DepartmentUpdate) => {
        await updateDepartment(id, data);
        setEditDepartment(null);
    };

    const handleDeleteDepartment = async (id: number) => {
        await removeDepartment(id);
        setDeleteDepartment(null);
    };

    const handleClearFilters = () => {
        setSearch('');
        setDebouncedSearch('');
        setActiveFilter('');
        setPage(1);
    };

    if (session === null) return null;
    if (session && !canAccess) return null;

    const hasActiveFilters = search || activeFilter !== '';

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
                            <Stack direction="row" alignItems="center" justifyContent="space-between">
                                <Stack direction="row" alignItems="center" spacing={1}>
                                    <Business fontSize="large" color="primary" />
                                    <Typography variant="h4" fontWeight={700}>
                                        Department Management
                                    </Typography>
                                </Stack>
                                {canCreate && (
                                    <Button
                                        variant="contained"
                                        startIcon={<Add />}
                                        onClick={() => setCreateDialogOpen(true)}
                                    >
                                        Add Department
                                    </Button>
                                )}
                            </Stack>
                            <Typography variant="body1" color="text.secondary">
                                Manage hospital departments and their structure ({pagination.total} total
                                departments)
                            </Typography>
                        </Stack>

                        {/* Error Alert */}
                        {error && (
                            <Alert severity="error">
                                Error loading departments: {error}
                            </Alert>
                        )}

                        {/* Filters */}
                        <Paper sx={{ p: 2 }}>
                            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
                                <TextField
                                    placeholder="Search departments..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    size="small"
                                    InputProps={{
                                        startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                                    }}
                                    sx={{ flex: 1, minWidth: 200 }}
                                />

                                <FormControl size="small" sx={{ minWidth: 120 }}>
                                    <InputLabel>Status</InputLabel>
                                    <Select
                                        value={activeFilter}
                                        onChange={(e) => {
                                            const val = e.target.value;
                                            setActiveFilter(val === '' ? '' : val === 'true');
                                            setPage(1);
                                        }}
                                        label="Status"
                                    >
                                        <MenuItem value="">All Status</MenuItem>
                                        <MenuItem value="true">Active</MenuItem>
                                        <MenuItem value="false">Inactive</MenuItem>
                                    </Select>
                                </FormControl>

                                <Tooltip title="Refresh">
                                    <IconButton onClick={() => mutate()} size="small">
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
                        <Paper>
                            <TableContainer>
                                <Table>
                                    <TableHead>
                                        <TableRow sx={{ bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05) }}>
                                            <TableCell sx={{ fontWeight: 600 }}>Code</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Head</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Locations</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {isLoading ? (
                                            Array.from({ length: 5 }).map((_, i) => (
                                                <TableRow key={i}>
                                                    <TableCell><Skeleton variant="text" width={60} /></TableCell>
                                                    <TableCell><Skeleton variant="text" width={150} /></TableCell>
                                                    <TableCell><Skeleton variant="text" width={120} /></TableCell>
                                                    <TableCell><Skeleton variant="rounded" width={40} height={24} /></TableCell>
                                                    <TableCell><Skeleton variant="rounded" width={60} height={24} /></TableCell>
                                                    <TableCell align="right"><Skeleton variant="circular" width={32} height={32} /></TableCell>
                                                </TableRow>
                                            ))
                                        ) : departments.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                                    <Typography color="text.secondary">
                                                        {hasActiveFilters
                                                            ? 'No departments match your filters'
                                                            : 'No departments found'}
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            departments.map((dept) => (
                                                <TableRow
                                                    key={dept.id}
                                                    hover
                                                    sx={{
                                                        transition: 'all 0.2s',
                                                        '&:hover': {
                                                            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.02),
                                                        },
                                                    }}
                                                >
                                                    <TableCell>
                                                        <Chip
                                                            label={dept.code}
                                                            size="small"
                                                            sx={{
                                                                bgcolor: alpha('#6366F1', 0.15),
                                                                color: '#6366F1',
                                                                fontWeight: 600,
                                                                fontFamily: 'monospace',
                                                            }}
                                                        />
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2" fontWeight={600}>
                                                            {dept.name}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2">
                                                            {dept.head
                                                                ? `${dept.head.firstName} ${dept.head.lastName}`
                                                                : '—'}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Tooltip
                                                            title={
                                                                dept.locations && dept.locations.length > 0
                                                                    ? dept.locations.map((l) => l.name).join(', ')
                                                                    : 'No locations'
                                                            }
                                                        >
                                                            <Chip
                                                                icon={<Place fontSize="small" />}
                                                                label={dept.locations?.length || 0}
                                                                size="small"
                                                                variant="outlined"
                                                                sx={{ cursor: 'pointer' }}
                                                            />
                                                        </Tooltip>
                                                    </TableCell>
                                                    <TableCell>
                                                        {dept.isActive ? (
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
                                                    <TableCell align="right">
                                                        <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                                                            {canEdit && (
                                                                <Tooltip title="Edit department">
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => setEditDepartment(dept)}
                                                                        color="primary"
                                                                    >
                                                                        <Edit fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            )}
                                                            {canDelete && (
                                                                <Tooltip
                                                                    title={
                                                                        (dept.locations?.length || 0) > 0
                                                                            ? 'Cannot delete: has locations'
                                                                            : 'Delete department'
                                                                    }
                                                                >
                                                                    <span>
                                                                        <IconButton
                                                                            size="small"
                                                                            onClick={() => setDeleteDepartment(dept)}
                                                                            color="error"
                                                                            disabled={(dept.locations?.length || 0) > 0}
                                                                        >
                                                                            <Delete fontSize="small" />
                                                                        </IconButton>
                                                                    </span>
                                                                </Tooltip>
                                                            )}
                                                        </Stack>
                                                    </TableCell>
                                                </TableRow>
                                            ))
                                        )}
                                    </TableBody>
                                </Table>
                            </TableContainer>

                            {/* Pagination */}
                            {pagination.totalPages > 1 && (
                                <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                                    <Pagination
                                        count={pagination.totalPages}
                                        page={page}
                                        onChange={(_, newPage) => setPage(newPage)}
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

            {/* Dialogs */}
            <CreateDepartmentDialog
                open={createDialogOpen}
                onClose={() => setCreateDialogOpen(false)}
                onSave={handleCreateDepartment}
                users={users}
            />

            <EditDepartmentDialog
                open={!!editDepartment}
                department={editDepartment}
                onClose={() => setEditDepartment(null)}
                onSave={handleUpdateDepartment}
                users={users}
            />

            <DeleteDepartmentDialog
                open={!!deleteDepartment}
                department={deleteDepartment}
                onClose={() => setDeleteDepartment(null)}
                onConfirm={handleDeleteDepartment}
            />
        </AppLayout>
    );
}
