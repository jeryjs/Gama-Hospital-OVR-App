'use client';

import { IconButton, Tooltip, alpha } from '@mui/material';
import type { ReactNode, MouseEvent } from 'react';

interface ToolbarButtonProps {
    icon: ReactNode;
    tooltip: string;
    isActive?: boolean;
    onClick: (e: MouseEvent<HTMLButtonElement>) => void;
    disabled?: boolean;
    size?: 'small' | 'medium';
}

export function ToolbarButton({
    icon,
    tooltip,
    isActive = false,
    onClick,
    disabled = false,
    size = 'small',
}: ToolbarButtonProps) {
    return (
        <Tooltip title={tooltip} placement="top" arrow>
            <IconButton
                size={size}
                onClick={onClick}
                disabled={disabled}
                sx={{
                    color: isActive ? 'primary.main' : 'text.secondary',
                    backgroundColor: isActive ? alpha('#00E599', 0.15) : 'transparent',
                    borderRadius: 1,
                    transition: 'all 0.15s ease',
                    '&:hover': {
                        backgroundColor: isActive
                            ? alpha('#00E599', 0.25)
                            : alpha('#fff', 0.08),
                        color: isActive ? 'primary.main' : 'text.primary',
                    },
                    '&.Mui-disabled': {
                        color: 'text.disabled',
                    },
                }}
            >
                {icon}
            </IconButton>
        </Tooltip>
    );
}
