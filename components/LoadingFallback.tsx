'use client';

import { Box, LinearProgress, Skeleton, Stack, Paper } from '@mui/material';

/**
 * Loading fallback for Suspense boundaries
 * Shows skeleton loaders while data is fetching
 */
export function LoadingFallback() {
    return (
        <Box sx={{ py: 2 }}>
            <LinearProgress sx={{ mb: 3 }} />
        </Box>
    );
}

/**
 * Table skeleton loader
 */
export function TableLoadingFallback({ rows = 10 }: { rows?: number }) {
    return (
        <Paper sx={{ p: 3 }}>
            <Stack spacing={1}>
                <Skeleton variant="rectangular" height={56} />
                {Array.from({ length: rows }).map((_, i) => (
                    <Skeleton key={i} variant="rectangular" height={48} />
                ))}
            </Stack>
        </Paper>
    );
}

/**
 * Card skeleton loader
 */
export function CardLoadingFallback() {
    return (
        <Paper sx={{ p: 3 }}>
            <Skeleton variant="text" width="60%" height={32} sx={{ mb: 2 }} />
            <Skeleton variant="rectangular" height={200} sx={{ mb: 2 }} />
            <Stack direction="row" spacing={1}>
                <Skeleton variant="rectangular" width={100} height={36} />
                <Skeleton variant="rectangular" width={100} height={36} />
            </Stack>
        </Paper>
    );
}
