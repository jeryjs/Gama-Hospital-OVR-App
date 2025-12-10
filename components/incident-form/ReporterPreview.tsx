'use client';

import { ReporterCard } from '@/components/shared/ReporterCard';
import { useSession } from 'next-auth/react';
import { Box, Skeleton } from '@mui/material';

export function ReporterPreview() {
    const { data: session, status } = useSession();

    if (status === 'loading') {
        return (
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 3 }}>
                <Skeleton variant="circular" width={48} height={48} />
                <Box>
                    <Skeleton width={150} height={24} />
                    <Skeleton width={200} height={16} />
                </Box>
            </Box>
        );
    }

    if (!session?.user) {
        return null;
    }

    // Build reporter object from session
    const reporter = {
        id: parseInt(session.user.id) || 0,
        firstName: session.user.name?.split(' ')[0] || '',
        lastName: session.user.name?.split(' ').slice(1).join(' ') || '',
        email: session.user.email || '',
        department: session.user.department || null,
    };

    return (
        <Box sx={{ mb: 3 }}>
            <ReporterCard
                reporter={reporter}
                variant="full"
                label="You are reporting as"
            />
        </Box>
    );
}
