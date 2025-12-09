'use client';

import { Suspense } from 'react';
import {
    Box, Paper, Stack, Typography, Button, IconButton, Chip,
    FormControl, InputLabel, Select, MenuItem, OutlinedInput,
    Checkbox, ListItemText, Divider, alpha, Skeleton
} from '@mui/material';
import { Close, FilterListOff } from '@mui/icons-material';
import { useDepartments } from '@/lib/hooks/useDepartments';
import { useLocations } from '@/lib/hooks/useLocations';

// OVR Status options
const STATUS_OPTIONS = [
    { value: 'draft', label: 'Draft' },
    { value: 'submitted', label: 'Submitted' },
    { value: 'qi_review', label: 'QI Review' },
    { value: 'investigating', label: 'Investigating' },
    { value: 'qi_final_actions', label: 'Final Actions' },
    { value: 'closed', label: 'Closed' },
];

// Category options (simplified - would come from taxonomy in real app)
const CATEGORY_OPTIONS = [
    { value: 'medication', label: 'Medication' },
    { value: 'falls', label: 'Falls' },
    { value: 'patient_care', label: 'Patient Care' },
    { value: 'equipment', label: 'Equipment' },
    { value: 'security', label: 'Security' },
    { value: 'infection', label: 'Infection Control' },
    { value: 'laboratory', label: 'Laboratory' },
    { value: 'radiology', label: 'Radiology' },
    { value: 'surgery', label: 'Surgery/Procedure' },
    { value: 'other', label: 'Other' },
];

interface ReportFilters {
    locations: number[];
    departments: number[];
    statuses: string[];
    categories: string[];
}

interface ReportFilterPanelProps {
    filters: ReportFilters;
    onChange: (filters: ReportFilters) => void;
    onClose: () => void;
}

export function ReportFilterPanel({ filters, onChange, onClose }: ReportFilterPanelProps) {
    return (
        <Paper sx={{ p: 2 }}>
            <Stack spacing={2}>
                {/* Header */}
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="subtitle1" fontWeight={600}>
                        Filters
                    </Typography>
                    <Stack direction="row" spacing={1}>
                        <Button
                            size="small"
                            startIcon={<FilterListOff />}
                            onClick={() => onChange({
                                locations: [],
                                departments: [],
                                statuses: [],
                                categories: [],
                            })}
                            disabled={
                                filters.locations.length === 0 &&
                                filters.departments.length === 0 &&
                                filters.statuses.length === 0 &&
                                filters.categories.length === 0
                            }
                        >
                            Clear All
                        </Button>
                        <IconButton size="small" onClick={onClose}>
                            <Close fontSize="small" />
                        </IconButton>
                    </Stack>
                </Stack>

                <Divider />

                {/* Filter Controls */}
                <Suspense fallback={<FiltersSkeleton />}>
                    <FilterControls filters={filters} onChange={onChange} />
                </Suspense>

                {/* Active Filters Display */}
                <ActiveFiltersChips filters={filters} onChange={onChange} />
            </Stack>
        </Paper>
    );
}

interface FilterControlsProps {
    filters: ReportFilters;
    onChange: (filters: ReportFilters) => void;
}

function FilterControls({ filters, onChange }: FilterControlsProps) {
    const { departments } = useDepartments();
    const { locations } = useLocations();

    return (
        <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
            {/* Status Filter */}
            <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Status</InputLabel>
                <Select
                    multiple
                    value={filters.statuses}
                    onChange={(e) => onChange({ ...filters, statuses: e.target.value as string[] })}
                    input={<OutlinedInput label="Status" />}
                    renderValue={(selected) => `${selected.length} selected`}
                >
                    {STATUS_OPTIONS.map((status) => (
                        <MenuItem key={status.value} value={status.value}>
                            <Checkbox checked={filters.statuses.includes(status.value)} size="small" />
                            <ListItemText primary={status.label} />
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            {/* Category Filter */}
            <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Category</InputLabel>
                <Select
                    multiple
                    value={filters.categories}
                    onChange={(e) => onChange({ ...filters, categories: e.target.value as string[] })}
                    input={<OutlinedInput label="Category" />}
                    renderValue={(selected) => `${selected.length} selected`}
                >
                    {CATEGORY_OPTIONS.map((cat) => (
                        <MenuItem key={cat.value} value={cat.value}>
                            <Checkbox checked={filters.categories.includes(cat.value)} size="small" />
                            <ListItemText primary={cat.label} />
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            {/* Department Filter */}
            <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Department</InputLabel>
                <Select
                    multiple
                    value={filters.departments}
                    onChange={(e) => onChange({ ...filters, departments: e.target.value as number[] })}
                    input={<OutlinedInput label="Department" />}
                    renderValue={(selected) => `${selected.length} selected`}
                >
                    {departments.map((dept) => (
                        <MenuItem key={dept.id} value={dept.id}>
                            <Checkbox checked={filters.departments.includes(dept.id)} size="small" />
                            <ListItemText primary={dept.name} />
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>

            {/* Location Filter */}
            <FormControl size="small" sx={{ minWidth: 180 }}>
                <InputLabel>Location</InputLabel>
                <Select
                    multiple
                    value={filters.locations}
                    onChange={(e) => onChange({ ...filters, locations: e.target.value as number[] })}
                    input={<OutlinedInput label="Location" />}
                    renderValue={(selected) => `${selected.length} selected`}
                >
                    {locations.map((loc) => (
                        <MenuItem key={loc.id} value={loc.id}>
                            <Checkbox checked={filters.locations.includes(loc.id)} size="small" />
                            <ListItemText
                                primary={loc.name}
                                secondary={loc.building ? `${loc.building}${loc.floor ? ` - ${loc.floor}` : ''}` : undefined}
                            />
                        </MenuItem>
                    ))}
                </Select>
            </FormControl>
        </Stack>
    );
}

function FiltersSkeleton() {
    return (
        <Stack direction="row" spacing={2}>
            {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} variant="rounded" width={180} height={40} />
            ))}
        </Stack>
    );
}

interface ActiveFiltersChipsProps {
    filters: ReportFilters;
    onChange: (filters: ReportFilters) => void;
}

function ActiveFiltersChips({ filters, onChange }: ActiveFiltersChipsProps) {
    const { departments } = useDepartments();
    const { locations } = useLocations();

    const hasFilters =
        filters.statuses.length > 0 ||
        filters.categories.length > 0 ||
        filters.departments.length > 0 ||
        filters.locations.length > 0;

    if (!hasFilters) return null;

    const getStatusLabel = (value: string) =>
        STATUS_OPTIONS.find(s => s.value === value)?.label || value;

    const getCategoryLabel = (value: string) =>
        CATEGORY_OPTIONS.find(c => c.value === value)?.label || value;

    const getDepartmentLabel = (id: number) =>
        departments.find(d => d.id === id)?.name || `Dept ${id}`;

    const getLocationLabel = (id: number) =>
        locations.find(l => l.id === id)?.name || `Location ${id}`;

    return (
        <Box>
            <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                Active Filters
            </Typography>
            <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                {filters.statuses.map((status) => (
                    <Chip
                        key={`status-${status}`}
                        label={getStatusLabel(status)}
                        size="small"
                        onDelete={() => onChange({
                            ...filters,
                            statuses: filters.statuses.filter(s => s !== status)
                        })}
                        sx={{
                            bgcolor: (theme) => alpha(theme.palette.info.main, 0.15),
                            color: 'info.main',
                            '& .MuiChip-deleteIcon': { color: 'info.main' }
                        }}
                    />
                ))}
                {filters.categories.map((category) => (
                    <Chip
                        key={`category-${category}`}
                        label={getCategoryLabel(category)}
                        size="small"
                        onDelete={() => onChange({
                            ...filters,
                            categories: filters.categories.filter(c => c !== category)
                        })}
                        sx={{
                            bgcolor: (theme) => alpha(theme.palette.secondary.main, 0.15),
                            color: 'secondary.main',
                            '& .MuiChip-deleteIcon': { color: 'secondary.main' }
                        }}
                    />
                ))}
                {filters.departments.map((deptId) => (
                    <Chip
                        key={`dept-${deptId}`}
                        label={getDepartmentLabel(deptId)}
                        size="small"
                        onDelete={() => onChange({
                            ...filters,
                            departments: filters.departments.filter(d => d !== deptId)
                        })}
                        sx={{
                            bgcolor: (theme) => alpha(theme.palette.warning.main, 0.15),
                            color: 'warning.main',
                            '& .MuiChip-deleteIcon': { color: 'warning.main' }
                        }}
                    />
                ))}
                {filters.locations.map((locId) => (
                    <Chip
                        key={`loc-${locId}`}
                        label={getLocationLabel(locId)}
                        size="small"
                        onDelete={() => onChange({
                            ...filters,
                            locations: filters.locations.filter(l => l !== locId)
                        })}
                        sx={{
                            bgcolor: (theme) => alpha(theme.palette.success.main, 0.15),
                            color: 'success.main',
                            '& .MuiChip-deleteIcon': { color: 'success.main' }
                        }}
                    />
                ))}
            </Stack>
        </Box>
    );
}
