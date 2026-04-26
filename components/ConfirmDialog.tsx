'use client';

import { Alert, Button, Dialog, DialogActions, DialogContent, DialogTitle, Typography } from '@mui/material';
import { useCallback, useMemo, useState, type ReactNode } from 'react';

interface ConfirmDialogOptions {
    title?: string;
    message: ReactNode;
    confirmText?: string;
    cancelText?: string;
    confirmColor?: 'primary' | 'secondary' | 'success' | 'error' | 'info' | 'warning';
    severity?: 'error' | 'warning' | 'info' | 'success';
}

interface ConfirmDialogState extends ConfirmDialogOptions {
    open: boolean;
}

const INITIAL_STATE: ConfirmDialogState = {
    open: false,
    title: 'Please confirm',
    message: '',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    confirmColor: 'primary',
    severity: 'warning',
};

export function useConfirmDialog() {
    const [state, setState] = useState<ConfirmDialogState>(INITIAL_STATE);
    const [resolver, setResolver] = useState<((confirmed: boolean) => void) | null>(null);

    const confirm = useCallback((options: ConfirmDialogOptions) => {
        return new Promise<boolean>((resolve) => {
            setResolver(() => resolve);
            setState({
                open: true,
                title: options.title || INITIAL_STATE.title,
                message: options.message,
                confirmText: options.confirmText || INITIAL_STATE.confirmText,
                cancelText: options.cancelText || INITIAL_STATE.cancelText,
                confirmColor: options.confirmColor || INITIAL_STATE.confirmColor,
                severity: options.severity || INITIAL_STATE.severity,
            });
        });
    }, []);

    const handleClose = useCallback((confirmed: boolean) => {
        resolver?.(confirmed);
        setResolver(null);
        setState(INITIAL_STATE);
    }, [resolver]);

    const ConfirmDialogComponent = useMemo(() => (
        <Dialog open={state.open} onClose={() => handleClose(false)} maxWidth="xs" fullWidth>
            <DialogTitle>{state.title}</DialogTitle>
            <DialogContent>
                <Alert severity={state.severity}>
                    <Typography variant="body2">{state.message}</Typography>
                </Alert>
            </DialogContent>
            <DialogActions>
                <Button onClick={() => handleClose(false)}>{state.cancelText}</Button>
                <Button variant="contained" color={state.confirmColor} onClick={() => handleClose(true)}>
                    {state.confirmText}
                </Button>
            </DialogActions>
        </Dialog>
    ), [handleClose, state]);

    return { confirm, ConfirmDialogComponent };
}
