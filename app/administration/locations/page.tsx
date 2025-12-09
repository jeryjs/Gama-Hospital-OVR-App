'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AppLayout } from '@/components/AppLayout';
import { useLocationManagement, useDepartments } from '@/lib/hooks';
import type { Location, LocationCreate, LocationUpdate } from '@/lib/api/schemas';
import { ACCESS_CONTROL } from '@/lib/access-control';
import {
    Add,
    CheckCircle,
    Close,
    Delete,
    Edit,
    LocationOn,
    Refresh,
    Search as SearchIcon,
    Warning,
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
// CREATE LOCATION DIALOG
// ============================================
interface CreateLocationDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (data: LocationCreate) => Promise<void>;
    departments: { id: number; name: string; code: string }[];
}

function CreateLocationDialog({ open, onClose, onSave, departments }: CreateLocationDialogProps) {
    const [formData, setFormData] = useState<LocationCreate>({
        name: '',
        departmentId: 0,
        building: '',
        floor: '',
        isActive: true,
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSave = async () => {
        if (!formData.name.trim()) {
            setError('Location name is required');
            return;
        }
        if (!formData.departmentId) {
            setError('Department is required');
            return;
        }

        setSaving(true);
        setError('');
        try {
            await onSave(formData);
            setFormData({ name: '', departmentId: 0, building: '', floor: '', isActive: true });
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create location');
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        setFormData({ name: '', departmentId: 0, building: '', floor: '', isActive: true });
        setError('');
        onClose();
    };

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>Create New Location</DialogTitle>
            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
                        {error}
                    </Alert>
                )}
                <Stack spacing={2} sx={{ mt: 1 }}>
                    <TextField
                        label="Location Name"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        fullWidth
                        required
                        placeholder="e.g., Emergency Room A"
                    />
                    <FormControl fullWidth required>
                        <InputLabel>Department</InputLabel>
                        <Select
                            value={formData.departmentId || ''}
                            onChange={(e) => setFormData({ ...formData, departmentId: Number(e.target.value) })}
                            label="Department"
                        >
                            {departments.map((dept) => (
                                <MenuItem key={dept.id} value={dept.id}>
                                    {dept.name} ({dept.code})
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                label="Building"
                                value={formData.building || ''}
                                onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                                fullWidth
                                placeholder="e.g., Main Building"
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                label="Floor"
                                value={formData.floor || ''}
                                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                                fullWidth
                                placeholder="e.g., 3rd Floor"
                            />
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
                    {saving ? 'Creating...' : 'Create Location'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// ============================================
// EDIT LOCATION DIALOG
// ============================================
interface EditLocationDialogProps {
    open: boolean;
    location: Location | null;
    onClose: () => void;
    onSave: (id: number, data: LocationUpdate) => Promise<void>;
    departments: { id: number; name: string; code: string }[];
}

function EditLocationDialog({ open, location, onClose, onSave, departments }: EditLocationDialogProps) {
    const [formData, setFormData] = useState<LocationUpdate>({});
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (location) {
            setFormData({
                name: location.name,
                departmentId: location.departmentId ?? undefined,
                building: location.building || '',
                floor: location.floor || '',
                isActive: location.isActive,
            });
        }
    }, [location]);

    const handleSave = async () => {
        if (!location) return;
        if (!formData.name?.trim()) {
            setError('Location name is required');
            return;
        }

        setSaving(true);
        setError('');
        try {
            await onSave(location.id, formData);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to update location');
        } finally {
            setSaving(false);
        }
    };

    if (!location) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
            <DialogTitle>Edit Location: {location.name}</DialogTitle>
            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2, mt: 1 }}>
                        {error}
                    </Alert>
                )}
                <Stack spacing={2} sx={{ mt: 1 }}>
                    <TextField
                        label="Location Name"
                        value={formData.name || ''}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        fullWidth
                        required
                    />
                    <FormControl fullWidth required>
                        <InputLabel>Department</InputLabel>
                        <Select
                            value={formData.departmentId || ''}
                            onChange={(e) => setFormData({ ...formData, departmentId: Number(e.target.value) })}
                            label="Department"
                        >
                            {departments.map((dept) => (
                                <MenuItem key={dept.id} value={dept.id}>
                                    {dept.name} ({dept.code})
                                </MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                label="Building"
                                value={formData.building || ''}
                                onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                                fullWidth
                            />
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <TextField
                                label="Floor"
                                value={formData.floor || ''}
                                onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                                fullWidth
                            />
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
interface DeleteLocationDialogProps {
    open: boolean;
    location: Location | null;
    onClose: () => void;
    onConfirm: (id: number) => Promise<void>;
}

function DeleteLocationDialog({ open, location, onClose, onConfirm }: DeleteLocationDialogProps) {
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');

    const handleDelete = async () => {
        if (!location) return;

        setDeleting(true);
        setError('');
        try {
            await onConfirm(location.id);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to delete location');
        } finally {
            setDeleting(false);
        }
    };

    if (!location) return null;

    return (
        <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
            <DialogTitle sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Warning color="warning" />
                Delete Location
            </DialogTitle>
            <DialogContent>
                {error && (
                    <Alert severity="error" sx={{ mb: 2 }}>
                        {error}
                    </Alert>
                )}
                <Typography>
                    Are you sure you want to delete <strong>{location.name}</strong>?
                </Typography>
                <Alert severity="warning" sx={{ mt: 2 }}>
                    This action cannot be undone. Incidents associated with this location will retain their reference but may display &quot;Unknown Location&quot;.
                </Alert>
            </DialogContent>
            <DialogActions>
                <Button onClick={onClose} disabled={deleting}>
                    Cancel
                </Button>
                <Button onClick={handleDelete} color="error" variant="contained" disabled={deleting}>
                    {deleting ? 'Deleting...' : 'Delete'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// ============================================
// MAIN PAGE COMPONENT
// ============================================
export default function LocationsManagementPage() {
    const { data: session } = useSession();
    const router = useRouter();

    // Filters
    const [search, setSearch] = useState('');
    const [debouncedSearch, setDebouncedSearch] = useState('');
    const [departmentFilter, setDepartmentFilter] = useState<number | ''>('');
    const [activeFilter, setActiveFilter] = useState<boolean | ''>('');
    const [page, setPage] = useState(1);
    const pageSize = 10;

    // Dialogs
    const [createDialogOpen, setCreateDialogOpen] = useState(false);
    const [editLocation, setEditLocation] = useState<Location | null>(null);
    const [deleteLocation, setDeleteLocation] = useState<Location | null>(null);

    // Hooks
    const { locations, isLoading, error, createLocation, updateLocation, deleteLocation: removeLocation, mutate } = useLocationManagement();
    const { departments, isLoading: deptLoading } = useDepartments();

    // Permission checks
    const userRoles = session?.user?.roles || [];
    const canCreate = ACCESS_CONTROL.api.locations.canCreate(userRoles);
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

    // Filter locations
    const filteredLocations = locations.filter((loc) => {
        const matchesSearch = debouncedSearch === '' ||
            loc.name.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            loc.building?.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
            loc.floor?.toLowerCase().includes(debouncedSearch.toLowerCase());
        const matchesDepartment = departmentFilter === '' || loc.departmentId === departmentFilter;
        const matchesActive = activeFilter === '' || loc.isActive === activeFilter;
        return matchesSearch && matchesDepartment && matchesActive;
    });

    // Pagination
    const totalPages = Math.ceil(filteredLocations.length / pageSize);
    const paginatedLocations = filteredLocations.slice((page - 1) * pageSize, page * pageSize);

    // Get department name helper
    const getDepartmentName = useCallback((departmentId: number) => {
        const dept = departments.find((d) => d.id === departmentId);
        return dept ? `${dept.name} (${dept.code})` : 'Unknown';
    }, [departments]);

    // Handlers
    const handleCreateLocation = async (data: LocationCreate) => {
        await createLocation(data);
    };

    const handleUpdateLocation = async (id: number, data: LocationUpdate) => {
        await updateLocation(id, data);
        setEditLocation(null);
    };

    const handleDeleteLocation = async (id: number) => {
        await removeLocation(id);
        setDeleteLocation(null);
    };

    const handleClearFilters = () => {
        setSearch('');
        setDebouncedSearch('');
        setDepartmentFilter('');
        setActiveFilter('');
        setPage(1);
    };

    if (session === null) return null;
    if (session && !canAccess) return null;

    const hasActiveFilters = search || departmentFilter !== '' || activeFilter !== '';

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
                                    <LocationOn fontSize="large" color="primary" />
                                    <Typography variant="h4" fontWeight={700}>
                                        Location Management
                                    </Typography>
                                </Stack>
                                {canCreate && (
                                    <Button
                                        variant="contained"
                                        startIcon={<Add />}
                                        onClick={() => setCreateDialogOpen(true)}
                                    >
                                        Add Location
                                    </Button>
                                )}
                            </Stack>
                            <Typography variant="body1" color="text.secondary">
                                Manage hospital locations, buildings, and departments ({filteredLocations.length} locations)
                            </Typography>
                        </Stack>

                        {/* Error Alert */}
                        {error && (
                            <Alert severity="error">
                                Error loading locations: {error}
                            </Alert>
                        )}

                        {/* Filters */}
                        <Paper sx={{ p: 2 }}>
                            <Stack direction="row" spacing={2} alignItems="center" flexWrap="wrap" useFlexGap>
                                <TextField
                                    placeholder="Search locations..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    size="small"
                                    InputProps={{
                                        startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
                                    }}
                                    sx={{ flex: 1, minWidth: 200 }}
                                />

                                <FormControl size="small" sx={{ minWidth: 180 }}>
                                    <InputLabel>Department</InputLabel>
                                    <Select
                                        value={departmentFilter}
                                        onChange={(e) => {
                                            setDepartmentFilter(e.target.value as number | '');
                                            setPage(1);
                                        }}
                                        label="Department"
                                    >
                                        <MenuItem value="">All Departments</MenuItem>
                                        {departments.map((dept) => (
                                            <MenuItem key={dept.id} value={dept.id}>
                                                {dept.name}
                                            </MenuItem>
                                        ))}
                                    </Select>
                                </FormControl>

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
                                            <TableCell sx={{ fontWeight: 600 }}>Name</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Department</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Building</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Floor</TableCell>
                                            <TableCell sx={{ fontWeight: 600 }}>Status</TableCell>
                                            <TableCell align="right" sx={{ fontWeight: 600 }}>Actions</TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        {isLoading || deptLoading ? (
                                            Array.from({ length: 5 }).map((_, i) => (
                                                <TableRow key={i}>
                                                    <TableCell><Skeleton variant="text" width={150} /></TableCell>
                                                    <TableCell><Skeleton variant="text" width={120} /></TableCell>
                                                    <TableCell><Skeleton variant="text" width={100} /></TableCell>
                                                    <TableCell><Skeleton variant="text" width={80} /></TableCell>
                                                    <TableCell><Skeleton variant="rounded" width={60} height={24} /></TableCell>
                                                    <TableCell align="right"><Skeleton variant="circular" width={32} height={32} /></TableCell>
                                                </TableRow>
                                            ))
                                        ) : paginatedLocations.length === 0 ? (
                                            <TableRow>
                                                <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                                                    <Typography color="text.secondary">
                                                        {hasActiveFilters ? 'No locations match your filters' : 'No locations found'}
                                                    </Typography>
                                                </TableCell>
                                            </TableRow>
                                        ) : (
                                            paginatedLocations.map((location) => (
                                                <TableRow
                                                    key={location.id}
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
                                                            {location.name}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2">
                                                            {location.departmentId ? getDepartmentName(location.departmentId) : '—'}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2">
                                                            {location.building || '—'}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        <Typography variant="body2">
                                                            {location.floor || '—'}
                                                        </Typography>
                                                    </TableCell>
                                                    <TableCell>
                                                        {location.isActive ? (
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
                                                                <Tooltip title="Edit location">
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => setEditLocation(location)}
                                                                        color="primary"
                                                                    >
                                                                        <Edit fontSize="small" />
                                                                    </IconButton>
                                                                </Tooltip>
                                                            )}
                                                            {canDelete && (
                                                                <Tooltip title="Delete location">
                                                                    <IconButton
                                                                        size="small"
                                                                        onClick={() => setDeleteLocation(location)}
                                                                        color="error"
                                                                    >
                                                                        <Delete fontSize="small" />
                                                                    </IconButton>
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
                            {totalPages > 1 && (
                                <Box sx={{ p: 2, display: 'flex', justifyContent: 'center' }}>
                                    <Pagination
                                        count={totalPages}
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
            <CreateLocationDialog
                open={createDialogOpen}
                onClose={() => setCreateDialogOpen(false)}
                onSave={handleCreateLocation}
                departments={departments}
            />

            <EditLocationDialog
                open={!!editLocation}
                location={editLocation}
                onClose={() => setEditLocation(null)}
                onSave={handleUpdateLocation}
                departments={departments}
            />

            <DeleteLocationDialog
                open={!!deleteLocation}
                location={deleteLocation}
                onClose={() => setDeleteLocation(null)}
                onConfirm={handleDeleteLocation}
            />
        </AppLayout>
    );
}
