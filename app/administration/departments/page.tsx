'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { AppLayout } from '@/components/AppLayout';
import { useDepartmentManagement, useDepartmentsWithLocations } from '@/lib/hooks';
import type { DepartmentWithLocations, DepartmentCreate, DepartmentUpdate, LocationForDepartment, LocationCreate, UserSearchResult } from '@/lib/api/schemas';
import { ACCESS_CONTROL } from '@/lib/access-control';
import { LOCATION_OPTIONS } from '@/lib/constants';
import { PeoplePicker } from '@/components/shared/PeoplePicker';
import {
    Add,
    Business,
    Delete,
    DragIndicator,
    Edit,
    LocationOn,
    Refresh,
    Search as SearchIcon,
    Warning,
    Apartment,
    KeyboardArrowRight,
    FolderOff,
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
    Divider,
    FormControl,
    FormControlLabel,
    IconButton,
    InputLabel,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    MenuItem,
    Paper,
    Select,
    Skeleton,
    Stack,
    Switch,
    TextField,
    Tooltip,
    Typography,
    Alert,
    Grid,
    Card,
    CardContent,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';

// ============================================
// CREATE DEPARTMENT DIALOG
// ============================================
interface CreateDepartmentDialogProps {
    open: boolean;
    onClose: () => void;
    onSave: (data: DepartmentCreate) => Promise<void>;
}

function CreateDepartmentDialog({ open, onClose, onSave }: CreateDepartmentDialogProps) {
    const [formData, setFormData] = useState<DepartmentCreate>({
        name: '',
        code: undefined,
        headId: undefined,
        isActive: true,
    });
    const [selectedHead, setSelectedHead] = useState<UserSearchResult | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSave = async () => {
        if (!formData.name.trim()) {
            setError('Department name is required');
            return;
        }

        setSaving(true);
        setError('');
        try {
            await onSave({
                ...formData,
                headId: selectedHead?.id,
            });
            setFormData({ name: '', code: undefined, headId: undefined, isActive: true });
            setSelectedHead(null);
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create department');
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        setFormData({ name: '', code: undefined, headId: undefined, isActive: true });
        setSelectedHead(null);
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
                    <PeoplePicker
                        value={selectedHead}
                        onChange={(val) => setSelectedHead(val as UserSearchResult | null)}
                        label="Department Head (Optional)"
                        placeholder="Search for department head..."
                        filterByRoles={['supervisor', 'quality_manager', 'executive', 'facility_manager']}
                        variant="ms-modern"
                    />
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
// ADD LOCATION DIALOG
// ============================================
interface AddLocationDialogProps {
    open: boolean;
    department: DepartmentWithLocations | null;
    onClose: () => void;
    onSave: (departmentId: number, data: Omit<LocationCreate, 'departmentId'>) => Promise<void>;
}

function AddLocationDialog({ open, department, onClose, onSave }: AddLocationDialogProps) {
    const [formData, setFormData] = useState({
        name: '',
        building: '',
        floor: '',
        isActive: true,
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    const handleSave = async () => {
        if (!department) return;
        if (!formData.name.trim()) {
            setError('Location name is required');
            return;
        }

        setSaving(true);
        setError('');
        try {
            await onSave(department.id, formData);
            setFormData({ name: '', building: '', floor: '', isActive: true });
            onClose();
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Failed to create location');
        } finally {
            setSaving(false);
        }
    };

    const handleClose = () => {
        setFormData({ name: '', building: '', floor: '', isActive: true });
        setError('');
        onClose();
    };

    if (!department) return null;

    return (
        <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
            <DialogTitle>
                Add Location to <strong>{department.name}</strong>
            </DialogTitle>
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
                        autoFocus
                    />
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <FormControl fullWidth>
                                <InputLabel>Building</InputLabel>
                                <Select
                                    value={formData.building}
                                    onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                                    label="Building"
                                >
                                    <MenuItem value="">
                                        <em>None</em>
                                    </MenuItem>
                                    {LOCATION_OPTIONS.buildings.map((building) => (
                                        <MenuItem key={building} value={building}>{building}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <FormControl fullWidth>
                                <InputLabel>Floor</InputLabel>
                                <Select
                                    value={formData.floor}
                                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                                    label="Floor"
                                >
                                    <MenuItem value="">
                                        <em>None</em>
                                    </MenuItem>
                                    {LOCATION_OPTIONS.floors.map((floor) => (
                                        <MenuItem key={floor} value={floor}>Floor {floor}</MenuItem>
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
                    {saving ? 'Creating...' : 'Add Location'}
                </Button>
            </DialogActions>
        </Dialog>
    );
}

// ============================================
// DELETE CONFIRMATION DIALOGS
// ============================================
interface DeleteDepartmentDialogProps {
    open: boolean;
    department: DepartmentWithLocations | null;
    onClose: () => void;
    onConfirm: (id: number) => Promise<void>;
}

function DeleteDepartmentDialog({ open, department, onClose, onConfirm }: DeleteDepartmentDialogProps) {
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
                        Cannot delete: {locationCount} location{locationCount !== 1 ? 's' : ''} exist in this department.
                        Delete all locations first.
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

interface DeleteLocationDialogProps {
    open: boolean;
    location: LocationForDepartment | null;
    departmentId: number | null;
    onClose: () => void;
    onConfirm: (departmentId: number, locationId: number) => Promise<void>;
}

function DeleteLocationDialog({ open, location, departmentId, onClose, onConfirm }: DeleteLocationDialogProps) {
    const [deleting, setDeleting] = useState(false);
    const [error, setError] = useState('');

    const handleDelete = async () => {
        if (!location || !departmentId) return;

        setDeleting(true);
        setError('');
        try {
            await onConfirm(departmentId, location.id);
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
                    This action cannot be undone. If incidents are associated with this location,
                    they will show &quot;Unknown Location&quot;.
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
// LOCATION CARD COMPONENT
// ============================================
interface LocationCardProps {
    location: LocationForDepartment;
    canEdit: boolean;
    canDelete: boolean;
    onEdit: () => void;
    onDelete: () => void;
}

function LocationCard({ location, canEdit, canDelete, onEdit, onDelete }: LocationCardProps) {
    return (
        <Card
            variant="outlined"
            sx={{
                transition: 'all 0.2s',
                '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: (theme) => `0 0 0 1px ${alpha(theme.palette.primary.main, 0.2)}`,
                },
            }}
        >
            <CardContent sx={{ py: 1.5, px: 2, '&:last-child': { pb: 1.5 } }}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <Box sx={{ cursor: 'grab', color: 'text.disabled', display: 'flex' }}>
                        <DragIndicator fontSize="small" />
                    </Box>
                    <Box sx={{ flex: 1, minWidth: 0 }}>
                        <Typography variant="body2" fontWeight={600} noWrap>
                            {location.name}
                        </Typography>
                        {(location.building || location.floor) && (
                            <Typography variant="caption" color="text.secondary" noWrap>
                                {[location.building, location.floor].filter(Boolean).join(' • ')}
                            </Typography>
                        )}
                    </Box>
                    {!location.isActive && (
                        <Chip
                            label="Inactive"
                            size="small"
                            sx={{
                                bgcolor: alpha('#EF4444', 0.15),
                                color: '#EF4444',
                                fontWeight: 600,
                                fontSize: '0.65rem',
                                height: 20,
                            }}
                        />
                    )}
                    <Stack direction="row" spacing={0.5}>
                        {canEdit && (
                            <Tooltip title="Edit">
                                <IconButton size="small" onClick={onEdit} color="primary">
                                    <Edit fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}
                        {canDelete && (
                            <Tooltip title="Delete">
                                <IconButton size="small" onClick={onDelete} color="error">
                                    <Delete fontSize="small" />
                                </IconButton>
                            </Tooltip>
                        )}
                    </Stack>
                </Stack>
            </CardContent>
        </Card>
    );
}

// ============================================
// EDIT LOCATION DIALOG
// ============================================
interface EditLocationDialogProps {
    open: boolean;
    location: LocationForDepartment | null;
    departmentId: number | null;
    onClose: () => void;
    onSave: (departmentId: number, locationId: number, data: Partial<LocationCreate>) => Promise<void>;
}

function EditLocationDialog({ open, location, departmentId, onClose, onSave }: EditLocationDialogProps) {
    const [formData, setFormData] = useState({
        name: '',
        building: '',
        floor: '',
        isActive: true,
    });
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (location) {
            setFormData({
                name: location.name,
                building: location.building || '',
                floor: location.floor || '',
                isActive: location.isActive ?? true,
            });
        }
    }, [location]);

    const handleSave = async () => {
        if (!location || !departmentId) return;
        if (!formData.name.trim()) {
            setError('Location name is required');
            return;
        }

        setSaving(true);
        setError('');
        try {
            await onSave(departmentId, location.id, formData);
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
            <DialogTitle>Edit Location</DialogTitle>
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
                    />
                    <Grid container spacing={2}>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <FormControl fullWidth>
                                <InputLabel>Building</InputLabel>
                                <Select
                                    value={formData.building}
                                    onChange={(e) => setFormData({ ...formData, building: e.target.value })}
                                    label="Building"
                                >
                                    <MenuItem value="">
                                        <em>None</em>
                                    </MenuItem>
                                    {LOCATION_OPTIONS.buildings.map((building) => (
                                        <MenuItem key={building} value={building}>{building}</MenuItem>
                                    ))}
                                </Select>
                            </FormControl>
                        </Grid>
                        <Grid size={{ xs: 12, md: 6 }}>
                            <FormControl fullWidth>
                                <InputLabel>Floor</InputLabel>
                                <Select
                                    value={formData.floor}
                                    onChange={(e) => setFormData({ ...formData, floor: e.target.value })}
                                    label="Floor"
                                >
                                    <MenuItem value="">
                                        <em>None</em>
                                    </MenuItem>
                                    {LOCATION_OPTIONS.floors.map((floor) => (
                                        <MenuItem key={floor} value={floor}>Floor {floor}</MenuItem>
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
// EDIT DEPARTMENT DIALOG (Inline name edit)
// ============================================
interface EditDepartmentDialogProps {
    open: boolean;
    department: DepartmentWithLocations | null;
    onClose: () => void;
    onSave: (id: number, data: DepartmentUpdate) => Promise<void>;
}

function EditDepartmentDialog({ open, department, onClose, onSave }: EditDepartmentDialogProps) {
    const [formData, setFormData] = useState<DepartmentUpdate>({});
    const [selectedHead, setSelectedHead] = useState<UserSearchResult | null>(null);
    const [saving, setSaving] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (department) {
            setFormData({
                name: department.name,
                headId: department.headOfDepartment ?? undefined,
                isActive: department.isActive,
            });
            // Set selected head from department data
            if (department.head) {
                setSelectedHead({
                    id: department.head.id,
                    firstName: department.head.firstName,
                    lastName: department.head.lastName,
                    email: '', // Not available in minimal schema
                    department: null,
                    profilePicture: null,
                    roles: [],
                });
            } else {
                setSelectedHead(null);
            }
        }
    }, [department]);

    const handleSave = async () => {
        if (!department) return;
        if (!formData.name?.trim()) {
            setError('Department name is required');
            return;
        }

        setSaving(true);
        setError('');
        try {
            await onSave(department.id, {
                ...formData,
                headId: selectedHead?.id,
            });
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
            <DialogTitle>Edit Department</DialogTitle>
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
                    <PeoplePicker
                        value={selectedHead}
                        onChange={(val) => setSelectedHead(val as UserSearchResult | null)}
                        label="Department Head"
                        placeholder="Search for department head..."
                        filterByRoles={['supervisor', 'quality_manager', 'executive', 'facility_manager']}
                        variant="ms-modern"
                    />
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
// MAIN PAGE COMPONENT
// ============================================
export default function DepartmentsManagementPage() {
    const { data: session } = useSession();
    const router = useRouter();

    // State
    const [search, setSearch] = useState('');
    const [selectedDepartment, setSelectedDepartment] = useState<DepartmentWithLocations | null>(null);

    // Dialogs
    const [createDeptDialogOpen, setCreateDeptDialogOpen] = useState(false);
    const [editDepartment, setEditDepartment] = useState<DepartmentWithLocations | null>(null);
    const [deleteDepartment, setDeleteDepartment] = useState<DepartmentWithLocations | null>(null);
    const [addLocationDialogOpen, setAddLocationDialogOpen] = useState(false);
    const [editLocation, setEditLocation] = useState<LocationForDepartment | null>(null);
    const [deleteLocation, setDeleteLocation] = useState<LocationForDepartment | null>(null);

    // Hooks
    const {
        departments,
        isLoading,
        error,
        mutate,
        createLocation,
        updateLocation,
        deleteLocation: removeLocation,
    } = useDepartmentsWithLocations();

    const {
        createDepartment,
        updateDepartment,
        deleteDepartment: removeDepartment,
    } = useDepartmentManagement({ includeLocations: true });

    // Permission checks
    const userRoles = session?.user?.roles || [];
    const canCreate = ACCESS_CONTROL.api.locations.canCreate(userRoles);
    const canEdit = ACCESS_CONTROL.api.locations.canEdit(userRoles);
    const canDelete = ACCESS_CONTROL.api.locations.canDelete(userRoles);
    const canAccess = ACCESS_CONTROL.ui.navigation.showDepartmentManagement(userRoles);

    // Redirect non-authorized users
    useEffect(() => {
        if (session && !canAccess) {
            router.replace('/dashboard');
        }
    }, [session, canAccess, router]);

    // Auto-select first department or maintain selection
    useEffect(() => {
        if (departments.length > 0 && !selectedDepartment) {
            setSelectedDepartment(departments[0]);
        } else if (selectedDepartment) {
            // Update selected department if it was modified
            const updated = departments.find(d => d.id === selectedDepartment.id);
            if (updated) {
                setSelectedDepartment(updated);
            } else if (departments.length > 0) {
                setSelectedDepartment(departments[0]);
            } else {
                setSelectedDepartment(null);
            }
        }
    }, [departments, selectedDepartment]);

    // Filter departments by search (name only, code is internal)
    const filteredDepartments = useMemo(() => {
        if (!search.trim()) return departments;
        const searchLower = search.toLowerCase();
        return departments.filter(
            (dept) => dept.name.toLowerCase().includes(searchLower)
        );
    }, [departments, search]);

    // Handlers
    const handleCreateDepartment = async (data: DepartmentCreate) => {
        const newDept = await createDepartment(data);
        mutate();
        // Select the new department
        setTimeout(() => {
            const found = departments.find(d => d.id === newDept.id);
            if (found) setSelectedDepartment(found);
        }, 500);
    };

    const handleUpdateDepartment = async (id: number, data: DepartmentUpdate) => {
        await updateDepartment(id, data);
        mutate();
        setEditDepartment(null);
    };

    const handleDeleteDepartment = async (id: number) => {
        await removeDepartment(id);
        mutate();
        setDeleteDepartment(null);
        if (selectedDepartment?.id === id) {
            setSelectedDepartment(departments.find(d => d.id !== id) || null);
        }
    };

    const handleCreateLocation = async (departmentId: number, data: Omit<LocationCreate, 'departmentId'>) => {
        await createLocation(departmentId, data);
    };

    const handleUpdateLocation = async (departmentId: number, locationId: number, data: Partial<LocationCreate>) => {
        await updateLocation(departmentId, locationId, data);
        setEditLocation(null);
    };

    const handleDeleteLocation = async (departmentId: number, locationId: number) => {
        await removeLocation(departmentId, locationId);
        setDeleteLocation(null);
    };

    if (session === null) return null;
    if (session && !canAccess) return null;

    return (
        <AppLayout>
            <Box sx={{ height: 'calc(100vh - 120px)', display: 'flex', flexDirection: 'column' }}>
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3 }}
                    style={{ height: '100%', display: 'flex', flexDirection: 'column' }}
                >
                    {/* Header */}
                    <Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mb: 2 }}>
                        <Stack direction="row" alignItems="center" spacing={1}>
                            <Business fontSize="large" color="primary" />
                            <Typography variant="h4" fontWeight={700}>
                                Department & Location Management
                            </Typography>
                        </Stack>
                        <Stack direction="row" spacing={1}>
                            <Tooltip title="Refresh">
                                <IconButton onClick={() => mutate()} size="small">
                                    <Refresh />
                                </IconButton>
                            </Tooltip>
                            {canCreate && (
                                <Button
                                    variant="contained"
                                    startIcon={<Add />}
                                    onClick={() => setCreateDeptDialogOpen(true)}
                                >
                                    Add Department
                                </Button>
                            )}
                        </Stack>
                    </Stack>

                    {error && (
                        <Alert severity="error" sx={{ mb: 2 }}>
                            Error loading data: {error}
                        </Alert>
                    )}

                    {/* Main Content - macOS Style Split View */}
                    <Paper
                        sx={{
                            flex: 1,
                            display: 'flex',
                            overflow: 'hidden',
                            border: (theme) => `1px solid ${theme.palette.divider}`,
                        }}
                    >
                        {/* Left Sidebar - Department List */}
                        <Box
                            sx={{
                                width: 320,
                                borderRight: (theme) => `1px solid ${theme.palette.divider}`,
                                display: 'flex',
                                flexDirection: 'column',
                                bgcolor: (theme) => alpha(theme.palette.background.default, 0.5),
                            }}
                        >
                            {/* Search */}
                            <Box sx={{ p: 1.5 }}>
                                <TextField
                                    placeholder="Search departments..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                    size="small"
                                    fullWidth
                                    InputProps={{
                                        startAdornment: (
                                            <SearchIcon sx={{ mr: 1, color: 'text.secondary', fontSize: 20 }} />
                                        ),
                                    }}
                                />
                            </Box>
                            <Divider />

                            {/* Department List */}
                            <List sx={{ flex: 1, overflow: 'auto', py: 0.5 }}>
                                {isLoading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <ListItem key={i} sx={{ py: 0.5 }}>
                                            <Skeleton variant="rounded" width="100%" height={48} />
                                        </ListItem>
                                    ))
                                ) : filteredDepartments.length === 0 ? (
                                    <Box sx={{ p: 3, textAlign: 'center' }}>
                                        <Typography color="text.secondary">
                                            {search ? 'No departments match your search' : 'No departments found'}
                                        </Typography>
                                    </Box>
                                ) : (
                                    filteredDepartments.map((dept) => (
                                        <ListItem key={dept.id} disablePadding sx={{ px: 0.5 }}>
                                            <ListItemButton
                                                selected={selectedDepartment?.id === dept.id}
                                                onClick={() => setSelectedDepartment(dept)}
                                                sx={{
                                                    borderRadius: 1,
                                                    py: 1,
                                                    '&.Mui-selected': {
                                                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                                                        '&:hover': {
                                                            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.15),
                                                        },
                                                    },
                                                }}
                                            >
                                                <ListItemIcon sx={{ minWidth: 36 }}>
                                                    <Apartment fontSize="small" color={dept.isActive ? 'primary' : 'disabled'} />
                                                </ListItemIcon>
                                                <ListItemText
                                                    primary={
                                                        <Typography variant="body2" fontWeight={600} noWrap>
                                                            {dept.name}
                                                        </Typography>
                                                    }
                                                    secondary={
                                                        <Typography variant="caption" color="text.secondary">
                                                            {dept.locations?.length || 0} location{(dept.locations?.length || 0) !== 1 ? 's' : ''}
                                                            {dept.head && <> • {dept.head.firstName} {dept.head.lastName}</>}
                                                        </Typography>
                                                    }
                                                />
                                                <KeyboardArrowRight fontSize="small" color="action" />
                                            </ListItemButton>
                                        </ListItem>
                                    ))
                                )}
                            </List>
                        </Box>

                        {/* Right Pane - Selected Department's Locations */}
                        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
                            {selectedDepartment ? (
                                <>
                                    {/* Department Header */}
                                    <Box
                                        sx={{
                                            p: 2,
                                            borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
                                            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.03),
                                        }}
                                    >
                                        <Stack direction="row" alignItems="center" justifyContent="space-between">
                                            <Stack direction="row" alignItems="center" spacing={2}>
                                                <Box
                                                    sx={{
                                                        width: 48,
                                                        height: 48,
                                                        borderRadius: 2,
                                                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'center',
                                                    }}
                                                >
                                                    <Business color="primary" />
                                                </Box>
                                                <Box>
                                                    <Stack direction="row" alignItems="center" spacing={1}>
                                                        <Typography variant="h6" fontWeight={700}>
                                                            {selectedDepartment.name}
                                                        </Typography>
                                                        {!selectedDepartment.isActive && (
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
                                                    <Typography variant="body2" color="text.secondary">
                                                        {selectedDepartment.locations?.length || 0} location{(selectedDepartment.locations?.length || 0) !== 1 ? 's' : ''}
                                                        {selectedDepartment.head && (
                                                            <> • Head: {selectedDepartment.head.firstName} {selectedDepartment.head.lastName}</>
                                                        )}
                                                    </Typography>
                                                </Box>
                                            </Stack>
                                            <Stack direction="row" spacing={1}>
                                                {canEdit && (
                                                    <Button
                                                        size="small"
                                                        startIcon={<Edit />}
                                                        onClick={() => setEditDepartment(selectedDepartment)}
                                                    >
                                                        Edit
                                                    </Button>
                                                )}
                                                {canDelete && (
                                                    <Button
                                                        size="small"
                                                        color="error"
                                                        startIcon={<Delete />}
                                                        onClick={() => setDeleteDepartment(selectedDepartment)}
                                                        disabled={(selectedDepartment.locations?.length || 0) > 0}
                                                    >
                                                        Delete
                                                    </Button>
                                                )}
                                                {canCreate && (
                                                    <Button
                                                        size="small"
                                                        variant="contained"
                                                        startIcon={<Add />}
                                                        onClick={() => setAddLocationDialogOpen(true)}
                                                    >
                                                        Add Location
                                                    </Button>
                                                )}
                                            </Stack>
                                        </Stack>
                                    </Box>

                                    {/* Locations Grid */}
                                    <Box sx={{ flex: 1, overflow: 'auto', p: 2 }}>
                                        {(selectedDepartment.locations?.length || 0) === 0 ? (
                                            <Box
                                                sx={{
                                                    height: '100%',
                                                    display: 'flex',
                                                    flexDirection: 'column',
                                                    alignItems: 'center',
                                                    justifyContent: 'center',
                                                    color: 'text.secondary',
                                                }}
                                            >
                                                <LocationOn sx={{ fontSize: 64, opacity: 0.3, mb: 2 }} />
                                                <Typography variant="h6" gutterBottom>
                                                    No locations yet
                                                </Typography>
                                                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                                    Add locations to this department to organize your facility.
                                                </Typography>
                                                {canCreate && (
                                                    <Button
                                                        variant="outlined"
                                                        startIcon={<Add />}
                                                        onClick={() => setAddLocationDialogOpen(true)}
                                                    >
                                                        Add First Location
                                                    </Button>
                                                )}
                                            </Box>
                                        ) : (
                                            <Grid container spacing={1.5}>
                                                <AnimatePresence>
                                                    {selectedDepartment.locations?.map((location, index) => (
                                                        <Grid size={{ xs: 12, sm: 6, lg: 4 }} key={location.id}>
                                                            <motion.div
                                                                initial={{ opacity: 0, y: 10 }}
                                                                animate={{ opacity: 1, y: 0 }}
                                                                exit={{ opacity: 0, y: -10 }}
                                                                transition={{ delay: index * 0.05 }}
                                                            >
                                                                <LocationCard
                                                                    location={location}
                                                                    canEdit={canEdit}
                                                                    canDelete={canDelete}
                                                                    onEdit={() => setEditLocation(location)}
                                                                    onDelete={() => setDeleteLocation(location)}
                                                                />
                                                            </motion.div>
                                                        </Grid>
                                                    ))}
                                                </AnimatePresence>
                                            </Grid>
                                        )}
                                    </Box>
                                </>
                            ) : (
                                <Box
                                    sx={{
                                        flex: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        justifyContent: 'center',
                                        color: 'text.secondary',
                                    }}
                                >
                                    <Business sx={{ fontSize: 64, opacity: 0.3, mb: 2 }} />
                                    <Typography variant="h6">
                                        {isLoading ? 'Loading...' : 'Select a department'}
                                    </Typography>
                                    <Typography variant="body2" color="text.secondary">
                                        Choose a department from the list to view its locations
                                    </Typography>
                                </Box>
                            )}
                        </Box>
                    </Paper>
                </motion.div>
            </Box>

            {/* Dialogs */}
            <CreateDepartmentDialog
                open={createDeptDialogOpen}
                onClose={() => setCreateDeptDialogOpen(false)}
                onSave={handleCreateDepartment}
            />

            <EditDepartmentDialog
                open={!!editDepartment}
                department={editDepartment}
                onClose={() => setEditDepartment(null)}
                onSave={handleUpdateDepartment}
            />

            <DeleteDepartmentDialog
                open={!!deleteDepartment}
                department={deleteDepartment}
                onClose={() => setDeleteDepartment(null)}
                onConfirm={handleDeleteDepartment}
            />

            <AddLocationDialog
                open={addLocationDialogOpen}
                department={selectedDepartment}
                onClose={() => setAddLocationDialogOpen(false)}
                onSave={handleCreateLocation}
            />

            <EditLocationDialog
                open={!!editLocation}
                location={editLocation}
                departmentId={selectedDepartment?.id ?? null}
                onClose={() => setEditLocation(null)}
                onSave={handleUpdateLocation}
            />

            <DeleteLocationDialog
                open={!!deleteLocation}
                location={deleteLocation}
                departmentId={selectedDepartment?.id ?? null}
                onClose={() => setDeleteLocation(null)}
                onConfirm={handleDeleteLocation}
            />
        </AppLayout>
    );
}
