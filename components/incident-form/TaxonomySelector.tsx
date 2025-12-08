'use client';

import {
    getDetailsForSubcategory,
    getSubcategoriesForCategory,
    getTaxonomyItem,
    loadTaxonomy,
    searchTaxonomy,
    TaxonomyData,
    TaxonomyItem,
} from '@/lib/services/taxonomyService';
import { Search, ViewAgenda } from '@mui/icons-material';
import {
    Autocomplete,
    Box,
    FormControl,
    Grid,
    IconButton,
    InputLabel,
    MenuItem,
    Select,
    TextField,
    Tooltip,
} from '@mui/material';
import { memo, useCallback, useEffect, useMemo, useState } from 'react';

interface TaxonomySelectorProps {
    categoryValue: string;
    subcategoryValue: string;
    detailValue: string;
    onChange: (category: string, subcategory: string, detail: string) => void;
    required?: boolean;
}

const MODE_STORAGE_KEY = 'gh:ovr:taxonomy-selector-mode';

type SelectorMode = 'staged' | 'search';

function TaxonomySelectorComponent({
    categoryValue,
    subcategoryValue,
    detailValue,
    onChange,
    required = true,
}: TaxonomySelectorProps) {
    const [taxonomy, setTaxonomy] = useState<TaxonomyData | null>(null);
    const [mode, setMode] = useState<SelectorMode>(() => {
        // Initialize from localStorage immediately
        if (typeof window !== 'undefined') {
            const savedMode = localStorage.getItem(MODE_STORAGE_KEY) as SelectorMode;
            return savedMode === 'search' || savedMode === 'staged' ? savedMode : 'staged';
        }
        return 'staged';
    });
    const [loading, setLoading] = useState(true);

    // Load taxonomy on mount
    useEffect(() => {
        loadTaxonomy()
            .then(setTaxonomy)
            .catch(console.error)
            .finally(() => setLoading(false));
    }, []);

    // Derive selected taxonomy item from props when in search mode
    const selectedTaxonomyItem = useMemo(() => {
        if (mode === 'search' && taxonomy && categoryValue && subcategoryValue) {
            return getTaxonomyItem(taxonomy, categoryValue, subcategoryValue, detailValue) || null;
        }
        return null;
    }, [taxonomy, categoryValue, subcategoryValue, detailValue, mode]);

    const handleModeToggle = useCallback(() => {
        setMode((prevMode) => {
            const newMode = prevMode === 'staged' ? 'search' : 'staged';
            localStorage.setItem(MODE_STORAGE_KEY, newMode);
            return newMode;
        });
    }, []);

    const handleSearchSelect = useCallback((item: TaxonomyItem | null) => {
        if (item) {
            onChange(item.category, item.subcategory, item.detail || '');
        } else {
            onChange('', '', '');
        }
    }, [onChange]);

    const handleCategoryChange = useCallback((newCategory: string) => {
        onChange(newCategory, '', '');
    }, [onChange]);

    const handleSubcategoryChange = useCallback((newSubcategory: string) => {
        onChange(categoryValue, newSubcategory, '');
    }, [onChange, categoryValue]);

    const handleDetailChange = useCallback((newDetail: string) => {
        onChange(categoryValue, subcategoryValue, newDetail);
    }, [onChange, categoryValue, subcategoryValue]);

    // Memoize subcategories and details to prevent recalculation on every render
    const subcategories = useMemo(() => {
        return categoryValue && taxonomy
            ? getSubcategoriesForCategory(taxonomy, categoryValue)
            : [];
    }, [taxonomy, categoryValue]);

    const details = useMemo(() => {
        return subcategoryValue && taxonomy
            ? getDetailsForSubcategory(taxonomy, subcategoryValue)
            : [];
    }, [taxonomy, subcategoryValue]);

    // Memoize filter function for autocomplete
    const filterOptions = useCallback((options: TaxonomyItem[], params: { inputValue: string }) => {
        if (!taxonomy || !params.inputValue) return [];
        const filtered = searchTaxonomy(taxonomy, params.inputValue);
        return filtered.slice(0, 50);
    }, [taxonomy]);

    // Memoize option label function
    const getOptionLabel = useCallback((option: TaxonomyItem | string) => {
        if (typeof option === 'string') return option;
        const parts = [
            option.categoryDescription,
            option.subcategoryDescription,
            option.detailDescription,
        ].filter(Boolean);
        return parts.join(' → ');
    }, []);

    if (loading || !taxonomy) {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                <TextField fullWidth label="Loading taxonomy..." disabled />
            </Box>
        );
    }

    return (
        <Box>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <Tooltip title={mode === 'staged' ? 'Switch to search mode' : 'Switch to dropdown mode'}>
                    <IconButton onClick={handleModeToggle} size="small">
                        {mode === 'staged' ? <Search /> : <ViewAgenda />}
                    </IconButton>
                </Tooltip>
            </Box>

            {mode === 'search' ? (
                <Autocomplete
                    value={selectedTaxonomyItem}
                    onChange={(_, value) => {
                        if (typeof value === 'object' || value === null) {
                            handleSearchSelect(value as TaxonomyItem | null);
                        }
                    }}
                    options={[]}
                    freeSolo
                    filterOptions={filterOptions}
                    getOptionLabel={getOptionLabel}
                    isOptionEqualToValue={(option, value) =>
                        option.category === value.category &&
                        option.subcategory === value.subcategory &&
                        option.detail === value.detail
                    }
                    renderInput={(params) => (
                        <TextField
                            {...params}
                            label="Search Classification"
                            placeholder="Start typing to search..."
                            required={required}
                            helperText="Type category, subcategory, or detail to search"
                        />
                    )}
                    renderOption={(props, option) => {
                        const parts = [
                            option.categoryDescription,
                            option.subcategoryDescription,
                            option.detailDescription,
                        ].filter(Boolean);

                        return (
                            <Box component="li" {...props} key={`${option.category}-${option.subcategory}-${option.detail || 'none'}`}>
                                <Box>
                                    <Box sx={{ fontSize: '0.875rem' }}>{parts.join(' → ')}</Box>
                                    <Box sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                                        {option.category} / {option.subcategory}
                                        {option.detail && ` / ${option.detail}`}
                                    </Box>
                                </Box>
                            </Box>
                        );
                    }}
                />
            ) : (
                <Grid container spacing={2} columns={{ xs: 1, sm: 2, md: 3 }}>
                    <Grid size={{ xs: 1, sm: 1, md: 1 }} key='category-input'>
                        <FormControl fullWidth required={required}>
                            <InputLabel>Category</InputLabel>
                            <Select
                                value={categoryValue}
                                onChange={(e) => handleCategoryChange(e.target.value)}
                                label="Category"
                            >
                                <MenuItem value="">
                                    <em>Select Category</em>
                                </MenuItem>
                                {taxonomy.categories.map((cat) => (
                                    <MenuItem key={cat.code} value={cat.code}>
                                        {cat.description}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid size={{ xs: 1, sm: 1, md: 1 }} key='subcategory-input'>
                        <FormControl fullWidth required={required} disabled={!categoryValue}>
                            <InputLabel>Subcategory</InputLabel>
                            <Select
                                value={subcategoryValue}
                                onChange={(e) => handleSubcategoryChange(e.target.value)}
                                label="Subcategory"
                            >
                                <MenuItem value="">
                                    <em>Select Subcategory</em>
                                </MenuItem>
                                {subcategories.map((sub) => (
                                    <MenuItem key={sub.code} value={sub.code}>
                                        {sub.description}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>

                    <Grid size={{ xs: 1, sm: 2, md: 1 }} key='details-input'>
                        <FormControl fullWidth disabled={!subcategoryValue || details.length === 0}>
                            <InputLabel>Detail</InputLabel>
                            <Select
                                value={detailValue}
                                onChange={(e) => handleDetailChange(e.target.value)}
                                label="Detail"
                            >
                                <MenuItem value="">
                                    <em>None</em>
                                </MenuItem>
                                {details.map((detail) => (
                                    <MenuItem key={detail.code} value={detail.code}>
                                        {detail.description}
                                    </MenuItem>
                                ))}
                            </Select>
                        </FormControl>
                    </Grid>
                </Grid>
            )}
        </Box>
    );
}

// Memoize component to prevent unnecessary re-renders
const TaxonomySelector = memo(TaxonomySelectorComponent, (prev, next) => {
    return (
        prev.categoryValue === next.categoryValue &&
        prev.subcategoryValue === next.subcategoryValue &&
        prev.detailValue === next.detailValue &&
        prev.required === next.required &&
        prev.onChange === next.onChange
    );
});

TaxonomySelector.displayName = 'TaxonomySelector';

export default TaxonomySelector;
