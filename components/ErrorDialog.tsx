/**
 * @fileoverview Client-Side Error Dialog Component
 * 
 * Beautiful MUI dialog that displays API errors with field-level details
 * Automatically parses StandardErrorResponse from backend
 */

'use client';

import {
    Alert,
    AlertTitle,
    Box,
    Button,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    List,
    ListItem,
    ListItemIcon,
    ListItemText,
    Typography,
} from '@mui/material';
import {
    Error as ErrorIcon,
    Warning as WarningIcon,
    Info as InfoIcon,
    Close as CloseIcon,
    BugReport as BugIcon,
} from '@mui/icons-material';

export interface ErrorDialogProps {
    open: boolean;
    onClose: () => void;
    error: ApiErrorData | null;
}

export interface ApiErrorData {
    error: string; // Main error message
    code: string; // Error code
    message?: string; // Additional context
    details?: Array<{
        path: string;
        message: string;
    }>;
    timestamp?: string;
}

/**
 * Parse error from API response or Error object
 * Handles both fetch Response and standard Error
 */
export async function parseApiError(error: unknown): Promise<ApiErrorData> {
    // Already parsed
    if (isApiErrorData(error)) {
        return error;
    }

    // Fetch Response object
    if (error instanceof Response) {
        try {
            const data = await error.json();
            if (isApiErrorData(data)) {
                return data;
            }
            // Fallback if response is not StandardErrorResponse
            return {
                error: `HTTP ${error.status}: ${error.statusText}`,
                code: `HTTP_${error.status}`,
                message: JSON.stringify(data),
            };
        } catch {
            return {
                error: `HTTP ${error.status}: ${error.statusText}`,
                code: `HTTP_${error.status}`,
            };
        }
    }

    // Standard Error object
    if (error instanceof Error) {
        return {
            error: error.message,
            code: 'CLIENT_ERROR',
            message: error.name,
        };
    }

    // Unknown error type
    return {
        error: 'An unexpected error occurred',
        code: 'UNKNOWN_ERROR',
        message: String(error),
    };
}

function isApiErrorData(data: unknown): data is ApiErrorData {
    return (
        typeof data === 'object' &&
        data !== null &&
        'error' in data &&
        'code' in data &&
        typeof (data as any).error === 'string' &&
        typeof (data as any).code === 'string'
    );
}

/**
 * Get severity based on error code
 */
function getErrorSeverity(code: string): 'error' | 'warning' | 'info' {
    if (code === 'VALIDATION_ERROR' || code.startsWith('HTTP_4')) {
        return 'warning';
    }
    if (code === 'AUTHENTICATION_ERROR' || code === 'AUTHORIZATION_ERROR') {
        return 'info';
    }
    return 'error';
}

/**
 * Get icon based on severity
 */
function getSeverityIcon(severity: 'error' | 'warning' | 'info') {
    switch (severity) {
        case 'error':
            return <ErrorIcon />;
        case 'warning':
            return <WarningIcon />;
        case 'info':
            return <InfoIcon />;
    }
}

/**
 * Beautiful error dialog with MUI styling
 */
export function ErrorDialog({ open, onClose, error }: ErrorDialogProps) {
    if (!error) return null;

    const severity = getErrorSeverity(error.code);
    const icon = getSeverityIcon(severity);
    const hasDetails = error.details && error.details.length > 0;

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                elevation: 8,
            }}
        >
            <DialogTitle sx={{ pb: 1 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {icon}
                    <Typography variant="h6" component="span">
                        {severity === 'warning' ? 'Validation Error' : 'Error'}
                    </Typography>
                </Box>
            </DialogTitle>

            <DialogContent>
                {/* Main error alert */}
                <Alert severity={severity} sx={{ mb: hasDetails ? 2 : 0 }}>
                    <AlertTitle sx={{ fontWeight: 600 }}>
                        {error.error}
                    </AlertTitle>
                    {error.message && (
                        <Typography variant="body2" sx={{ mt: 1 }}>
                            {error.message}
                        </Typography>
                    )}
                </Alert>

                {/* Field-level validation errors */}
                {hasDetails && (
                    <Box sx={{ mt: 2 }}>
                        <Typography
                            variant="subtitle2"
                            sx={{ mb: 1, fontWeight: 600, color: 'text.secondary' }}
                        >
                            Please fix the following issues:
                        </Typography>
                        <List dense>
                            {error.details!.map((detail, index) => (
                                <ListItem
                                    key={index}
                                    sx={{
                                        bgcolor: (theme) => theme.palette.action.hover,
                                        borderRadius: 1,
                                        mb: 0.5,
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 36 }}>
                                        <ErrorIcon color="error" fontSize="small" />
                                    </ListItemIcon>
                                    <ListItemText
                                        primary={detail.message}
                                        secondary={detail.path}
                                        primaryTypographyProps={{ variant: 'body2' }}
                                        secondaryTypographyProps={{ variant: 'caption' }}
                                    />
                                </ListItem>
                            ))}
                        </List>
                    </Box>
                )}

                {/* Debug info (error code & timestamp) */}
                {(error.code || error.timestamp) && (
                    <Box
                        sx={{
                            mt: 2,
                            p: 1.5,
                            bgcolor: (theme) => theme.palette.grey[100],
                            borderRadius: 1,
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1,
                        }}
                    >
                        <BugIcon fontSize="small" color="action" />
                        <Box>
                            {error.code && (
                                <Typography variant="caption" display="block" color="text.secondary">
                                    Error Code: <strong>{error.code}</strong>
                                </Typography>
                            )}
                            {error.timestamp && (
                                <Typography variant="caption" display="block" color="text.secondary">
                                    Time: {new Date(error.timestamp).toLocaleString()}
                                </Typography>
                            )}
                        </Box>
                    </Box>
                )}
            </DialogContent>

            <DialogActions sx={{ px: 3, pb: 2 }}>
                <Button
                    onClick={onClose}
                    variant="contained"
                    startIcon={<CloseIcon />}
                    fullWidth
                >
                    Close
                </Button>
            </DialogActions>
        </Dialog>
    );
}

/**
 * Hook for managing error dialog state
 * 
 * @example
 * const { showError, ErrorDialogComponent } = useErrorDialog();
 * 
 * try {
 *   await submitForm();
 * } catch (error) {
 *   showError(error);
 * }
 * 
 * return <>{ErrorDialogComponent}</>;
 */
export function useErrorDialog() {
    const [open, setOpen] = React.useState(false);
    const [error, setError] = React.useState<ApiErrorData | null>(null);

    const showError = React.useCallback(async (err: unknown) => {
        const parsed = await parseApiError(err);
        setError(parsed);
        setOpen(true);
    }, []);

    const hideError = React.useCallback(() => {
        setOpen(false);
        // Clear error after animation completes
        setTimeout(() => setError(null), 300);
    }, []);

    const ErrorDialogComponent = (
        <ErrorDialog open={open} onClose={hideError} error={error} />
    );

    return {
        showError,
        hideError,
        ErrorDialogComponent,
        error,
        isOpen: open,
    };
}

// React import for hook
import React from 'react';
