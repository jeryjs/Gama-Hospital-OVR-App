/**
 * @fileoverview StatusChip Component
 * 
 * Displays an incident status as a styled MUI Chip.
 * Uses centralized status utilities for consistent styling.
 */

'use client';

import { Chip, type ChipProps } from '@mui/material';
import { getStatusColor, getStatusConfig, getStatusLabel, type OVRStatus } from '@/lib/utils/status';

export interface StatusChipProps {
    /** Incident status */
    status: OVRStatus | string;
    /** Chip size */
    size?: 'small' | 'medium';
    /** Show emoji icon prefix */
    showIcon?: boolean;
}

export function StatusChip({ status, size = 'small', showIcon = false }: StatusChipProps) {
    const config = getStatusConfig(status);
    const label = getStatusLabel(status);
    const color = getStatusColor(status);

    const displayLabel = showIcon ? `${config.icon} ${label}` : label;

    return (
        <Chip
            label={displayLabel}
            color={color as ChipProps['color']}
            size={size}
            sx={{
                fontWeight: 500,
                ...(size === 'small' && {
                    height: 24,
                    fontSize: '0.75rem',
                }),
            }}
        />
    );
}
