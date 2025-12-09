/**
 * @fileoverview TrendIndicator Component
 * 
 * Displays a trend value with directional icon and color coding.
 * Positive trends show green with up arrow, negative show red with down arrow.
 */

'use client';

import { Box, Typography } from '@mui/material';
import { TrendingDown, TrendingUp } from '@mui/icons-material';

export interface TrendIndicatorProps {
    /** Numeric trend value */
    value: number;
    /** Suffix to append (default: '%') */
    suffix?: string;
    /** Show trend icon (default: true) */
    showIcon?: boolean;
    /** Text size variant */
    size?: 'small' | 'medium' | 'large';
}

export function TrendIndicator({
    value,
    suffix = '%',
    showIcon = true,
    size = 'medium',
}: TrendIndicatorProps) {
    const isPositive = value >= 0;
    const color = isPositive ? 'success.main' : 'error.main';

    const sizeConfig = {
        small: {
            fontSize: '0.75rem',
            iconSize: 14,
        },
        medium: {
            fontSize: '0.875rem',
            iconSize: 18,
        },
        large: {
            fontSize: '1rem',
            iconSize: 22,
        },
    };

    const config = sizeConfig[size];
    const formattedValue = `${isPositive ? '+' : ''}${value}${suffix}`;

    const Icon = isPositive ? TrendingUp : TrendingDown;

    return (
        <Box
            sx={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 0.5,
                color,
            }}
        >
            {showIcon && <Icon sx={{ fontSize: config.iconSize }} />}
            <Typography
                component="span"
                sx={{
                    fontSize: config.fontSize,
                    fontWeight: 600,
                    color: 'inherit',
                }}
            >
                {formattedValue}
            </Typography>
        </Box>
    );
}
