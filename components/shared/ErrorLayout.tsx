'use client';

import { parseApiError, type ParsedError } from '@/lib/client/error-handler';
import {
    Error as ErrorIcon,
    Lock as LockIcon,
    SearchOff as NotFoundIcon,
    Warning as WarningIcon,
    Refresh as RefreshIcon,
    ArrowBack as BackIcon,
    Home as HomeIcon,
} from '@mui/icons-material';
import {
    alpha,
    Box,
    Button,
    Paper,
    Stack,
    Typography,
} from '@mui/material';
import { motion } from 'framer-motion';
import { useRouter } from 'next/navigation';

type ErrorVariant = 'full' | 'inline' | 'compact';

interface ErrorLayoutProps {
    error: unknown;
    variant?: ErrorVariant;
    onRetry?: () => void;
    showBack?: boolean;
    showHome?: boolean;
    title?: string;
}

// Error type configs - single source of truth
const ERROR_CONFIGS = {
    NOT_FOUND: {
        icon: NotFoundIcon,
        color: '#6366F1',
        bgGradient: 'linear-gradient(135deg, #667eea20 0%, #764ba220 100%)',
        defaultTitle: 'Not Found',
        defaultMessage: 'The resource you\'re looking for doesn\'t exist or has been removed.',
    },
    FORBIDDEN: {
        icon: LockIcon,
        color: '#F59E0B',
        bgGradient: 'linear-gradient(135deg, #f6d36520 0%, #f9a82520 100%)',
        defaultTitle: 'Access Denied',
        defaultMessage: 'You don\'t have permission to view this resource.',
    },
    VALIDATION: {
        icon: WarningIcon,
        color: '#EF4444',
        bgGradient: 'linear-gradient(135deg, #ff6b6b20 0%, #ee5a2420 100%)',
        defaultTitle: 'Validation Error',
        defaultMessage: 'Please check your input and try again.',
    },
    SERVER_ERROR: {
        icon: ErrorIcon,
        color: '#DC2626',
        bgGradient: 'linear-gradient(135deg, #dc262620 0%, #b9191920 100%)',
        defaultTitle: 'Something Went Wrong',
        defaultMessage: 'An unexpected error occurred. Please try again later.',
    },
} as const;

function getErrorConfig(parsedError: ParsedError) {
    if (parsedError.code === 'NOT_FOUND') return ERROR_CONFIGS.NOT_FOUND;
    if (parsedError.code === 'AUTHORIZATION_ERROR' || parsedError.code === 'AUTHENTICATION_ERROR') return ERROR_CONFIGS.FORBIDDEN;
    if (parsedError.code === 'VALIDATION_ERROR') return ERROR_CONFIGS.VALIDATION;
    return ERROR_CONFIGS.SERVER_ERROR;
}

export function ErrorLayout({
    error,
    variant = 'full',
    onRetry,
    showBack = true,
    showHome = true,
    title,
}: ErrorLayoutProps) {
    const router = useRouter();
    const parsedError = parseApiError(error as any);
    const config = getErrorConfig(parsedError);
    const Icon = config.icon;

    // Full page error (404, 403, 500)
    if (variant === 'full') {
        return (
            <Box
                component={motion.div}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                sx={{
                    minHeight: '60vh',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    p: 4,
                }}
            >
                <Paper
                    elevation={0}
                    sx={{
                        maxWidth: 500,
                        width: '100%',
                        p: 6,
                        textAlign: 'center',
                        borderRadius: 4,
                        background: config.bgGradient,
                        border: '1px solid',
                        borderColor: alpha(config.color, 0.2),
                    }}
                >
                    <motion.div
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        transition={{ delay: 0.1 }}
                    >
                        <Box
                            sx={{
                                width: 80,
                                height: 80,
                                borderRadius: '50%',
                                bgcolor: alpha(config.color, 0.15),
                                display: 'flex',
                                alignItems: 'center',
                                justifyContent: 'center',
                                mx: 'auto',
                                mb: 3,
                            }}
                        >
                            <Icon sx={{ fontSize: 40, color: config.color }} />
                        </Box>
                    </motion.div>

                    <Typography variant="h5" fontWeight={700} gutterBottom>
                        {title || config.defaultTitle}
                    </Typography>

                    <Typography color="text.secondary" sx={{ mb: 4 }}>
                        {parsedError.message || config.defaultMessage}
                    </Typography>

                    <Stack direction="row" spacing={2} justifyContent="center">
                        {showBack && (
                            <Button
                                variant="outlined"
                                startIcon={<BackIcon />}
                                onClick={() => router.back()}
                            >
                                Go Back
                            </Button>
                        )}
                        {onRetry && (
                            <Button
                                variant="contained"
                                startIcon={<RefreshIcon />}
                                onClick={onRetry}
                            >
                                Try Again
                            </Button>
                        )}
                        {showHome && (
                            <Button
                                variant="text"
                                startIcon={<HomeIcon />}
                                onClick={() => router.push('/dashboard')}
                            >
                                Dashboard
                            </Button>
                        )}
                    </Stack>
                </Paper>
            </Box>
        );
    }

    // Inline error (in forms/sections)
    if (variant === 'inline') {
        return (
            <Paper
                component={motion.div}
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                sx={{
                    p: 3,
                    borderRadius: 2,
                    bgcolor: alpha(config.color, 0.05),
                    border: '1px solid',
                    borderColor: alpha(config.color, 0.2),
                }}
            >
                <Stack direction="row" spacing={2} alignItems="flex-start">
                    <Icon sx={{ color: config.color, mt: 0.5 }} />
                    <Box sx={{ flex: 1 }}>
                        <Typography fontWeight={600} gutterBottom>
                            {title || config.defaultTitle}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                            {parsedError.message || config.defaultMessage}
                        </Typography>
                        {onRetry && (
                            <Button
                                size="small"
                                startIcon={<RefreshIcon />}
                                onClick={onRetry}
                                sx={{ mt: 1 }}
                            >
                                Retry
                            </Button>
                        )}
                    </Box>
                </Stack>
            </Paper>
        );
    }

    // Compact error (alert-style)
    return (
        <Box
            component={motion.div}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            sx={{
                p: 2,
                borderRadius: 1,
                bgcolor: alpha(config.color, 0.1),
                borderLeft: `4px solid ${config.color}`,
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
            }}
        >
            <Icon sx={{ color: config.color, fontSize: 20 }} />
            <Typography variant="body2" sx={{ flex: 1 }}>
                {parsedError.message || config.defaultMessage}
            </Typography>
            {onRetry && (
                <Button size="small" onClick={onRetry}>
                    Retry
                </Button>
            )}
        </Box>
    );
}

export type { ErrorLayoutProps, ErrorVariant };
