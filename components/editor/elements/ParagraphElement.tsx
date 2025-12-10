'use client';

import { Typography } from '@mui/material';
import type { PlateElementProps } from 'platejs/react';

export function ParagraphElement({ children, attributes, ...props }: PlateElementProps) {
    return (
        <Typography
            component="p"
            variant="body1"
            {...attributes}
            sx={{
                my: 0.5,
                lineHeight: 1.7,
                color: 'text.primary',
                '&:first-of-type': {
                    mt: 0,
                },
                '&:last-of-type': {
                    mb: 0,
                },
            }}
            {...props}
        >
            {children}
        </Typography>
    );
}
