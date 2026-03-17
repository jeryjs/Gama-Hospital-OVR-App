'use client';

import { Box, alpha } from '@mui/material';
import type { PlateElementProps } from 'platejs/react';

export function BlockquoteElement({ children, attributes }: PlateElementProps) {
    return (
        <Box
            component="blockquote"
            {...attributes}
            sx={(theme) => ({
                borderLeft: '4px solid',
                borderColor: 'primary.main',
                pl: 2,
                py: 0.5,
                my: 1.5,
                mx: 0,
                backgroundColor: alpha(theme.palette.primary.main, 0.08),
                borderRadius: '0 8px 8px 0',
                fontStyle: 'italic',
                color: 'text.secondary',
                '& p': {
                    my: 0,
                },
            })}
        >
            {children}
        </Box>
    );
}