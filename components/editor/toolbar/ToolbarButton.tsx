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
                onMouseDown={(e) => {
                    e.preventDefault();
                }}
                onClick={onClick}
                disabled={disabled}
                sx={(theme) => ({
                    color: isActive ? theme.palette.primary.main : theme.palette.text.secondary,
                    backgroundColor: isActive ? alpha(theme.palette.primary.main, 0.15) : 'transparent',
                    borderRadius: 1,
                    transition: 'all 0.15s ease',
                    '&:hover': {
                        backgroundColor: isActive
                            ? alpha(theme.palette.primary.main, 0.25)
                            : theme.palette.action.hover,
                        color: isActive ? theme.palette.primary.main : theme.palette.text.primary,
                    },
                    '&.Mui-disabled': {
                        color: theme.palette.text.disabled,
                    },
                })}
            >
                {icon}
            </IconButton>
        </Tooltip>
    );
}
