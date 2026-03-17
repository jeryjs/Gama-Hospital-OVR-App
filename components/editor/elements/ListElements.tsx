'use client';

import { Box } from '@mui/material';
import type { PlateElementProps } from 'platejs/react';

export function BulletedListElement({ children, attributes }: PlateElementProps) {
    return (
        <Box
            component="ul"
            {...attributes}
            sx={{
                pl: 3,
                my: 1,
                listStyleType: 'disc',
                '& > li': {
                    display: 'list-item',
                },
            }}
        >
            {children}
        </Box>
    );
}

export function NumberedListElement({ children, attributes }: PlateElementProps) {
    return (
        <Box
            component="ol"
            {...attributes}
            sx={{
                pl: 3,
                my: 1,
                listStyleType: 'decimal',
                '& > li': {
                    display: 'list-item',
                },
            }}
        >
            {children}
        </Box>
    );
}

export function ListItemElement({ children, attributes }: PlateElementProps) {
    return (
        <Box
            component="li"
            {...attributes}
            sx={{
                py: 0.25,
                lineHeight: 1.7,
            }}
        >
            {children}
        </Box>
    );
}

export function ListItemContentElement({ children, attributes }: PlateElementProps) {
    return (
        <Box
            component="span"
            {...attributes}
            sx={{
                display: 'inline',
                lineHeight: 1.7,
            }}
        >
            {children}
        </Box>
    );
}
