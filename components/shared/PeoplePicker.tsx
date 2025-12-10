/**
 * @fileoverview PeoplePicker - Microsoft-style People Picker Component
 * 
 * A reusable autocomplete component for selecting users
 * Based on MUI Autocomplete with enhanced UX
 * 
 * Features:
 * - Single or multiple selection
 * - Role-based filtering
 * - Variant support: 'standard' and 'ms-modern'
 * - Manual entry toggle for cases where user isn't in system
 */

'use client';

import type { UserSearchResult } from '@/lib/api/schemas';
import { usePeopleSearch } from '@/lib/hooks/usePeopleSearch';
import {
    Person as PersonIcon,
    Search as SearchIcon,
    Close as CloseIcon,
    Edit as EditIcon,
    PersonSearch as PersonSearchIcon,
} from '@mui/icons-material';
import {
    alpha,
    Autocomplete,
    Avatar,
    Box,
    Button,
    Card,
    CardContent,
    Chip,
    CircularProgress,
    Collapse,
    InputAdornment,
    Skeleton,
    Stack,
    TextField,
    Tooltip,
    Typography,
} from '@mui/material';
import { useState, useCallback, useMemo, SyntheticEvent, ReactNode } from 'react';

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
    /** Display variant: 'standard' or 'ms-modern' (card-style) */
    variant?: 'standard' | 'ms-modern';
    /** Show toggle to switch to manual entry */
    showManualToggle?: boolean;
    /** Manual entry fields (shown when toggled) */
    children?: ReactNode;
    /** Callback when manual mode changes */
    onManualModeChange?: (isManual: boolean) => void;
    /** Initial manual mode state */
    initialManualMode?: boolean;
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
 * User option renderer - Standard variant
 */
function UserOptionStandard({
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
 * User option renderer - MS Modern variant (card-style)
 */
function UserOptionModern({
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
        <Box
            key={key}
            component="li"
            {...liProps}
            sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 2,
                py: 1.5,
                px: 2,
                cursor: 'pointer',
                borderRadius: 2,
                border: (theme) => `1px solid transparent`,
                transition: 'all 0.15s ease',
                '&:hover': {
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.06),
                    borderColor: (theme) => alpha(theme.palette.primary.main, 0.2),
                },
                '&[aria-selected="true"]': {
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                    borderColor: (theme) => theme.palette.primary.main,
                },
            }}
        >
            <Avatar
                src={user.profilePicture || undefined}
                sx={{
                    width: 40,
                    height: 40,
                    bgcolor: 'primary.main',
                    fontSize: '1rem',
                    fontWeight: 600,
                }}
            >
                {initials}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
                <Typography
                    variant="body1"
                    fontWeight={600}
                    sx={{
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                    }}
                >
                    {fullName}
                </Typography>
                <Stack direction="row" spacing={1} alignItems="center">
                    {user.department && (
                        <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                                whiteSpace: 'nowrap',
                            }}
                        >
                            {user.department}
                        </Typography>
                    )}
                    {user.roles && user.roles.length > 0 && (
                        <>
                            {user.department && <Typography variant="caption" color="text.disabled">•</Typography>}
                            <Typography
                                variant="caption"
                                color="primary.main"
                                sx={{ fontWeight: 500 }}
                            >
                                {user.roles[0]}
                            </Typography>
                        </>
                    )}
                </Stack>
            </Box>
        </Box>
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
 * Selected user card (for ms-modern variant in multiple mode)
 */
function UserCard({
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
        <Card
            variant="outlined"
            sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 1,
                p: 1,
                pr: disabled ? 1.5 : 0.5,
                borderRadius: 2,
                transition: 'all 0.15s ease',
                '&:hover': {
                    borderColor: 'primary.main',
                    boxShadow: (theme) => `0 0 0 1px ${alpha(theme.palette.primary.main, 0.2)}`,
                },
            }}
        >
            <Avatar
                src={user.profilePicture || undefined}
                sx={{ width: 32, height: 32, fontSize: '0.875rem' }}
            >
                {initials}
            </Avatar>
            <Box sx={{ minWidth: 0 }}>
                <Typography variant="body2" fontWeight={500} noWrap>
                    {fullName}
                </Typography>
                {user.department && (
                    <Typography variant="caption" color="text.secondary" noWrap>
                        {user.department}
                    </Typography>
                )}
            </Box>
            {!disabled && (
                <Tooltip title="Remove">
                    <Box
                        component="span"
                        onClick={onDelete}
                        sx={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            width: 24,
                            height: 24,
                            borderRadius: 1,
                            cursor: 'pointer',
                            color: 'text.secondary',
                            '&:hover': {
                                bgcolor: (theme) => alpha(theme.palette.error.main, 0.1),
                                color: 'error.main',
                            },
                        }}
                    >
                        <CloseIcon fontSize="small" />
                    </Box>
                </Tooltip>
            )}
        </Card>
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
 * 
 * @example
 * // With manual entry toggle
 * <PeoplePicker
 *   value={selectedUser}
 *   onChange={setSelectedUser}
 *   showManualToggle
 *   label="Physician"
 * >
 *   <TextField label="Physician Name" ... />
 *   <TextField label="Physician ID" ... />
 * </PeoplePicker>
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
    variant = 'standard',
    showManualToggle = false,
    children,
    onManualModeChange,
    initialManualMode = false,
}: PeoplePickerProps) {
    // Input value for search
    const [inputValue, setInputValue] = useState('');
    // Manual entry mode
    const [isManualMode, setIsManualMode] = useState(initialManualMode);

    // Use people search hook with debouncing
    const { users, isLoading } = usePeopleSearch({
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

    // Toggle manual mode
    const handleToggleManualMode = useCallback(() => {
        const newMode = !isManualMode;
        setIsManualMode(newMode);
        onManualModeChange?.(newMode);
        // Clear autocomplete value when switching to manual
        if (newMode) {
            onChange(null);
        }
    }, [isManualMode, onManualModeChange, onChange]);

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

    // Use appropriate variant components
    const isModernVariant = variant === 'ms-modern';
    const OptionComponent = isModernVariant ? UserOptionModern : UserOptionStandard;
    const TagComponent = isModernVariant ? UserCard : UserChip;

    // If in manual mode, show the children (manual entry fields)
    if (showManualToggle && isManualMode) {
        return (
            <Box>
                {/* Manual entry fields */}
                <Box sx={{ mb: 1.5 }}>
                    {children}
                </Box>
                {/* Toggle back to picker */}
                <Button
                    size="small"
                    startIcon={<PersonSearchIcon />}
                    onClick={handleToggleManualMode}
                    sx={{ textTransform: 'none' }}
                >
                    Select from directory
                </Button>
            </Box>
        );
    }

    return (
        <Box>
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
                    <OptionComponent key={option.id} user={option} props={props} />
                )}
                renderTags={(tagValue, getTagProps) =>
                    tagValue.map((option, index) => {
                        const { key, ...tagProps } = getTagProps({ index });
                        return (
                            <TagComponent
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
            {/* Manual entry toggle */}
            {showManualToggle && (
                <Box sx={{ mt: 1 }}>
                    <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={handleToggleManualMode}
                        sx={{ textTransform: 'none' }}
                    >
                        Enter manually
                    </Button>
                </Box>
            )}
        </Box>
    );
}
