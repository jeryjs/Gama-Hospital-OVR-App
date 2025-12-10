'use client';

import { STATUS_CONFIG, type OVRStatus } from '@/lib/utils/status';
import { Close, FilterList, Search } from '@mui/icons-material';
import {
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    MenuItem,
    Paper,
    Select,
    Stack,
    TextField,
} from '@mui/material';
import { useState } from 'react';

export interface IncidentFilters {
    search: string;
    status: string;
    category?: string;
}

interface IncidentsFiltersProps {
    filters: IncidentFilters;
    onFilterChange: (filters: IncidentFilters) => void;
    /** Status options to exclude from dropdown */
    excludeStatuses?: OVRStatus[];
    /** Show category filter */
    showCategoryFilter?: boolean;
    /** Categories to show in dropdown */
    categories?: Array<{ value: string; label: string }>;
    /** Use dialog for filter selection */
    useDialog?: boolean;
    /** Search placeholder text */
    searchPlaceholder?: string;
}

/**
 * Reusable filter bar for incident lists
 * Supports search, status, and optional category filtering
 */
export function IncidentsFilters({
    filters,
    onFilterChange,
    excludeStatuses = [],
    showCategoryFilter = false,
    categories = [],
    useDialog = true,
    searchPlaceholder = 'Search by reference or description...',
}: IncidentsFiltersProps) {
    const [dialogOpen, setDialogOpen] = useState(false);

    // Build status options from STATUS_CONFIG, excluding specified statuses
    const statusOptions = Object.entries(STATUS_CONFIG)
        .filter(([key]) => !excludeStatuses.includes(key as OVRStatus))
        .map(([value, config]) => ({
            value,
            label: config.label,
        }));

    const handleChange = <K extends keyof IncidentFilters>(
        key: K,
        value: IncidentFilters[K]
    ) => {
        onFilterChange({ ...filters, [key]: value });
    };

    const clearFilters = () => {
        onFilterChange({ search: '', status: '', category: '' });
    };

    const hasActiveFilters = filters.search || filters.status || filters.category;

    // Inline filter controls (non-dialog mode)
    if (!useDialog) {
        return (
            <Paper sx={{ p: 2, mb: 3 }}>
                <Stack direction="row" spacing={2} flexWrap="wrap" useFlexGap>
                    <TextField
                        placeholder={searchPlaceholder}
                        size="small"
                        value={filters.search}
                        onChange={(e) => handleChange('search', e.target.value)}
                        InputProps={{
                            startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />,
                        }}
                        sx={{ flex: 1, minWidth: 250 }}
                    />

                    <Select
                        value={filters.status}
                        onChange={(e) => handleChange('status', e.target.value)}
                        size="small"
                        displayEmpty
                        sx={{ minWidth: 150 }}
                    >
                        <MenuItem value="">All Statuses</MenuItem>
                        {statusOptions.map(({ value, label }) => (
                            <MenuItem key={value} value={value}>
                                {label}
                            </MenuItem>
                        ))}
                    </Select>

                    {showCategoryFilter && categories.length > 0 && (
                        <Select
                            value={filters.category || ''}
                            onChange={(e) => handleChange('category', e.target.value)}
                            size="small"
                            displayEmpty
                            sx={{ minWidth: 150 }}
                        >
                            <MenuItem value="">All Categories</MenuItem>
                            {categories.map(({ value, label }) => (
                                <MenuItem key={value} value={value}>
                                    {label}
                                </MenuItem>
                            ))}
                        </Select>
                    )}

                    {hasActiveFilters && (
                        <Button
                            size="small"
                            startIcon={<Close />}
                            onClick={clearFilters}
                            variant="outlined"
                        >
                            Clear
                        </Button>
                    )}
                </Stack>
            </Paper>
        );
    }

    // Dialog-based filter mode (original behavior)
    return (
        <>
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 3 }}>
                <TextField
                    placeholder={searchPlaceholder}
                    value={filters.search}
                    onChange={(e) => handleChange('search', e.target.value)}
                    size="small"
                    sx={{ flex: 1 }}
                />
                <Button
                    startIcon={<FilterList />}
                    onClick={() => setDialogOpen(true)}
                    variant={hasActiveFilters ? 'contained' : 'outlined'}
                    size="small"
                >
                    Filter
                </Button>
                {hasActiveFilters && (
                    <Button
                        size="small"
                        startIcon={<Close />}
                        onClick={clearFilters}
                        variant="outlined"
                    >
                        Clear
                    </Button>
                )}
            </Stack>

            <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)}>
                <DialogTitle>Filter Incidents</DialogTitle>
                <DialogContent sx={{ minWidth: 300, pt: 2 }}>
                    <Stack spacing={2}>
                        <TextField
                            fullWidth
                            select
                            label="Status"
                            value={filters.status}
                            onChange={(e) => handleChange('status', e.target.value)}
                            SelectProps={{ native: true }}
                        >
                            <option value="">All Statuses</option>
                            {statusOptions.map(({ value, label }) => (
                                <option key={value} value={value}>
                                    {label}
                                </option>
                            ))}
                        </TextField>

                        {showCategoryFilter && categories.length > 0 && (
                            <TextField
                                fullWidth
                                select
                                label="Category"
                                value={filters.category || ''}
                                onChange={(e) => handleChange('category', e.target.value)}
                                SelectProps={{ native: true }}
                            >
                                <option value="">All Categories</option>
                                {categories.map(({ value, label }) => (
                                    <option key={value} value={value}>
                                        {label}
                                    </option>
                                ))}
                            </TextField>
                        )}
                    </Stack>
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setDialogOpen(false)}>Close</Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
