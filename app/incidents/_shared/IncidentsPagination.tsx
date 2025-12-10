'use client';

import { Box, Pagination, Stack, Typography } from '@mui/material';

interface IncidentsPaginationProps {
    page: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    onPageChange: (page: number) => void;
    /** Center the pagination (default) or add range text */
    showRange?: boolean;
}

/**
 * Reusable pagination component for incident lists
 */
export function IncidentsPagination({
    page,
    totalPages,
    totalItems,
    itemsPerPage,
    onPageChange,
    showRange = false,
}: IncidentsPaginationProps) {
    // Don't render if only one page or no pages
    if (totalPages <= 1) return null;

    const start = (page - 1) * itemsPerPage + 1;
    const end = Math.min(page * itemsPerPage, totalItems);

    if (showRange) {
        return (
            <Box sx={{ mt: 3 }}>
                <Stack direction="row" justifyContent="space-between" alignItems="center">
                    <Typography variant="body2" color="text.secondary">
                        Showing {start}-{end} of {totalItems}
                    </Typography>
                    <Pagination
                        count={totalPages}
                        page={page}
                        onChange={(_, p) => onPageChange(p)}
                        color="primary"
                    />
                </Stack>
            </Box>
        );
    }

    // Centered pagination (default)
    return (
        <Box display="flex" justifyContent="center" sx={{ mt: 3 }}>
            <Pagination
                count={totalPages}
                page={page}
                onChange={(_, value) => onPageChange(value)}
                color="primary"
                size="large"
            />
        </Box>
    );
}
