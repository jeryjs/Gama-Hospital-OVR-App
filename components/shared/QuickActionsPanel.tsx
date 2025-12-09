/**
 * @fileoverview QuickActionsPanel Component
 * 
 * Displays a panel of action buttons for quick navigation/actions.
 * Supports count badges and primary/secondary button variants.
 */

'use client';

import { Badge, Button, Paper, Stack, Typography } from '@mui/material';
import Link from 'next/link';
import type { ReactNode } from 'react';

export interface QuickAction {
    /** Button label */
    label: string;
    /** Icon to display */
    icon: ReactNode;
    /** Navigation href (optional) */
    href?: string;
    /** Click handler (optional) */
    onClick?: () => void;
    /** Button variant - first action defaults to 'contained' */
    variant?: 'contained' | 'outlined' | 'text';
    /** Optional count badge */
    count?: number;
}

export interface QuickActionsPanelProps {
    /** Array of actions to display */
    actions: QuickAction[];
    /** Optional panel title */
    title?: string;
}

export function QuickActionsPanel({ actions, title }: QuickActionsPanelProps) {
    return (
        <Paper sx={{ p: 2.5 }}>
            {title && (
                <Typography variant="subtitle1" fontWeight={600} sx={{ mb: 2 }}>
                    {title}
                </Typography>
            )}

            <Stack spacing={1.5}>
                {actions.map((action, index) => {
                    // Default first action to contained, others to outlined
                    const variant = action.variant ?? (index === 0 ? 'contained' : 'outlined');

                    const buttonContent = (
                        <Button
                            variant={variant}
                            startIcon={action.icon}
                            onClick={action.onClick}
                            fullWidth
                            sx={{
                                justifyContent: 'flex-start',
                                textTransform: 'none',
                                py: 1.25,
                                px: 2,
                            }}
                        >
                            {action.label}
                        </Button>
                    );

                    const wrappedButton =
                        action.count !== undefined ? (
                            <Badge
                                badgeContent={action.count}
                                color="error"
                                max={99}
                                sx={{
                                    width: '100%',
                                    '& .MuiBadge-badge': {
                                        right: 16,
                                        top: 12,
                                    },
                                }}
                            >
                                {buttonContent}
                            </Badge>
                        ) : (
                            buttonContent
                        );

                    if (action.href) {
                        return (
                            <Link key={action.label} href={action.href} style={{ textDecoration: 'none' }}>
                                {wrappedButton}
                            </Link>
                        );
                    }

                    return <div key={action.label}>{wrappedButton}</div>;
                })}
            </Stack>
        </Paper>
    );
}
