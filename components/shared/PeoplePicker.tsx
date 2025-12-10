/**
 * @fileoverview PeoplePicker - Microsoft-style People Picker Component
 * 
 * A reusable autocomplete component for selecting users
 * Based on MUI Autocomplete with enhanced UX
 */

'use client';

import type { UserSearchResult } from '@/lib/api/schemas';
import { usePeopleSearch } from '@/lib/hooks/usePeopleSearch';
import {
    Person as PersonIcon,
    Search as SearchIcon,
    Close as CloseIcon,
} from '@mui/icons-material';
import {
    alpha,
    Autocomplete,
    Avatar,
    Box,
    Chip,
    CircularProgress,
    InputAdornment,
    Skeleton,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import { useState, useCallback, useMemo, SyntheticEvent } from 'react';

export interface PeoplePickerProps {
    /** Allow selecting multiple users */
    multiple?: boolean;
    /** Filter users by specific roles */
    filterByRoles?: string[];
    /** Selected value(s) - single user or array for multiple */
    value: UserSearchResult | UserSearchResult[] | null;
    /** Change handler */
    onChange: (value: UserSearchResult | UserSearchResult[] | null) => void;
    /** Placeholder text */
    placeholder?: string;
    /** Disabled state */
    disabled?: boolean;
    /** Label for the field */
    label?: string;
    /** Required field */
    required?: boolean;
    /** Error state */
    error?: boolean;
    /** Helper text */
    helperText?: string;
    /** Size variant */
    size?: 'small' | 'medium';
    /** Full width */
    fullWidth?: boolean;
    /** Maximum number of results to show */
    limit?: number;
    /** Minimum characters before searching */
    minChars?: number;
    /** Auto-focus on mount */
    autoFocus?: boolean;
}

/**
 * Get user initials for avatar fallback
 */
function getInitials(firstName?: string | null, lastName?: string | null): string {
    const first = firstName?.[0] || '';
    const last = lastName?.[0] || '';
    return (first + last).toUpperCase() || '?';
}

/**
 * Get full name from user
 */
function getFullName(user: UserSearchResult): string {
    return `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
}

/**
 * Loading skeleton for autocomplete options
 */
function LoadingSkeleton() {
    return (
        <Box sx={{ p: 1 }}>
            {[1, 2, 3].map((i) => (
                <Box key={i} sx={{ display: 'flex', alignItems: 'center', gap: 1.5, py: 1 }}>
                    <Skeleton variant="circular" width={36} height={36} />
                    <Box sx={{ flex: 1 }}>
                        <Skeleton variant="text" width="60%" height={20} />
                        <Skeleton variant="text" width="40%" height={16} />
                    </Box>
                </Box>
            ))}
        </Box>
    );
}

/**
 * User option renderer
 */
function UserOption({
    user,
    props,
}: {
    user: UserSearchResult;
    props: React.HTMLAttributes<HTMLLIElement> & { key?: React.Key };
}) {
    const fullName = getFullName(user);
    const initials = getInitials(user.firstName, user.lastName);

    // Extract key from props so we don't spread it into the DOM element
    const { key, ...liProps } = props;

    return (
        <Tooltip
            title={
                <Box>
                    <Typography variant="body2" fontWeight={600}>
                        {fullName}
                    </Typography>
                    <Typography variant="caption">{user.email}</Typography>
                    {user.roles && user.roles.length > 0 && (
                        <Typography variant="caption" display="block" sx={{ mt: 0.5, opacity: 0.8 }}>
                            Roles: {user.roles.join(', ')}
                        </Typography>
                    )}
                </Box>
            }
            placement="right"
            enterDelay={500}
        >
            <Box
                key={key}
                component="li"
                {...liProps}
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 1.5,
                    py: 1,
                    px: 1.5,
                    cursor: 'pointer',
                    borderRadius: 1,
                    '&:hover': {
                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                    },
                    '&[aria-selected="true"]': {
                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.12),
                    },
                }}
            >
                <Avatar
                    src={user.profilePicture || undefined}
                    sx={{
                        width: 36,
                        height: 36,
                        bgcolor: 'primary.main',
                        fontSize: '0.875rem',
                    }}
                >
                    {initials}
                </Avatar>
                <Box sx={{ flex: 1, minWidth: 0 }}>
                    <Typography
                        variant="body2"
                        fontWeight={500}
                        sx={{
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {fullName}
                    </Typography>
                    {user.department && (
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                                display: 'block',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {user.department}
                        </Typography>
                    )}
                </Box>
            </Box>
        </Tooltip>
    );
}

/**
 * Selected user chip (for multiple mode)
 */
function UserChip({
    user,
    onDelete,
    disabled,
}: {
    user: UserSearchResult;
    onDelete: () => void;
    disabled?: boolean;
}) {
    const fullName = getFullName(user);
    const initials = getInitials(user.firstName, user.lastName);

    return (
        <Tooltip title={user.email} enterDelay={300}>
            <Chip
                avatar={
                    <Avatar
                        src={user.profilePicture || undefined}
                        sx={{ width: 24, height: 24, fontSize: '0.75rem' }}
                    >
                        {initials}
                    </Avatar>
                }
                label={fullName}
                onDelete={disabled ? undefined : onDelete}
                deleteIcon={<CloseIcon fontSize="small" />}
                size="small"
                sx={{
                    maxWidth: 200,
                    '& .MuiChip-label': {
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                    },
                }}
            />
        </Tooltip>
    );
}

/**
 * PeoplePicker Component
 * 
 * @example
 * // Single select
 * <PeoplePicker
 *   value={selectedUser}
 *   onChange={setSelectedUser}
 *   placeholder="Select a user"
 * />
 * 
 * @example
 * // Multiple select with role filter
 * <PeoplePicker
 *   multiple
 *   filterByRoles={['qi', 'admin']}
 *   value={selectedUsers}
 *   onChange={setSelectedUsers}
 *   label="Investigators"
 * />
 */
export function PeoplePicker({
    multiple = false,
    filterByRoles,
    value,
    onChange,
    placeholder = 'Search for people...',
    disabled = false,
    label,
    required = false,
    error = false,
    helperText,
    size = 'medium',
    fullWidth = true,
    limit = 10,
    minChars = 1,
    autoFocus = false,
}: PeoplePickerProps) {
    // Input value for search
    const [inputValue, setInputValue] = useState('');

    // Use people search hook with debouncing
    const { users, isLoading, debouncedQuery } = usePeopleSearch({
        query: inputValue,
        filterByRoles,
        limit,
        minChars,
        debounceMs: 300,
    });

    // Handle input change
    const handleInputChange = useCallback(
        (_event: SyntheticEvent, newInputValue: string) => {
            setInputValue(newInputValue);
        },
        []
    );

    // Handle selection change
    const handleChange = useCallback(
        (
            _event: SyntheticEvent,
            newValue: UserSearchResult | UserSearchResult[] | null
        ) => {
            onChange(newValue);
            // Clear input after selection in single mode
            if (!multiple && newValue) {
                setInputValue('');
            }
        },
        [onChange, multiple]
    );

    // Check if option equals value (by id)
    const isOptionEqualToValue = useCallback(
        (option: UserSearchResult, val: UserSearchResult) => option.id === val.id,
        []
    );

    // Get option label
    const getOptionLabel = useCallback(
        (option: UserSearchResult) => getFullName(option),
        []
    );

    // Filter out already selected users from options
    const filteredOptions = useMemo(() => {
        if (!multiple || !value || !Array.isArray(value)) {
            return users;
        }
        const selectedIds = new Set(value.map((u) => u.id));
        return users.filter((u) => !selectedIds.has(u.id));
    }, [users, value, multiple]);

    // Determine what to show when no options
    const noOptionsText = useMemo(() => {
        if (!inputValue || inputValue.length < minChars) {
            return 'Type to search...';
        }
        if (isLoading) {
            return 'Searching...';
        }
        return 'No results found';
    }, [inputValue, minChars, isLoading]);

    return (
        <Autocomplete
            multiple={multiple}
            value={value}
            onChange={handleChange}
            inputValue={inputValue}
            onInputChange={handleInputChange}
            options={filteredOptions}
            loading={isLoading}
            disabled={disabled}
            fullWidth={fullWidth}
            size={size}
            autoHighlight
            clearOnBlur={!multiple}
            handleHomeEndKeys
            isOptionEqualToValue={isOptionEqualToValue}
            getOptionLabel={getOptionLabel}
            noOptionsText={noOptionsText}
            loadingText={<LoadingSkeleton />}
            filterOptions={(x) => x} // Disable client-side filtering (server handles it)
            renderInput={(params) => (
                <TextField
                    {...params}
                    label={label}
                    placeholder={
                        multiple && Array.isArray(value) && value.length > 0 ? '' : placeholder
                    }
                    required={required}
                    error={error}
                    helperText={helperText}
                    autoFocus={autoFocus}
                    InputProps={{
                        ...params.InputProps,
                        startAdornment: (
                            <>
                                {!multiple && !value && (
                                    <InputAdornment position="start">
                                        <SearchIcon color="action" fontSize="small" />
                                    </InputAdornment>
                                )}
                                {params.InputProps.startAdornment}
                            </>
                        ),
                        endAdornment: (
                            <>
                                {isLoading ? (
                                    <CircularProgress color="inherit" size={20} sx={{ mr: 1 }} />
                                ) : null}
                                {params.InputProps.endAdornment}
                            </>
                        ),
                    }}
                />
            )}
            renderOption={(props, option) => (
                <UserOption key={option.id} user={option} props={props} />
            )}
            renderTags={(tagValue, getTagProps) =>
                tagValue.map((option, index) => {
                    const { key, ...tagProps } = getTagProps({ index });
                    return (
                        <UserChip
                            key={key}
                            user={option}
                            onDelete={() => {
                                const newValue = Array.isArray(value)
                                    ? value.filter((v) => v.id !== option.id)
                                    : null;
                                onChange(newValue);
                            }}
                            disabled={disabled}
                        />
                    );
                })
            }
            // Handle keyboard navigation
            ListboxProps={{
                sx: {
                    maxHeight: 300,
                    '& .MuiAutocomplete-option': {
                        padding: 0,
                    },
                },
            }}
            sx={{
                '& .MuiAutocomplete-inputRoot': {
                    flexWrap: 'wrap',
                    gap: 0.5,
                },
            }}
        />
    );
}
