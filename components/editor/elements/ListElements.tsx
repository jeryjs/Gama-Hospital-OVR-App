'use client';

import { Box } from '@mui/material';
import type { PlateElementProps } from 'platejs/react';
import {
    WORD_LIST_BASE_SX,
    WORD_LIST_ITEM_CONTENT_SX,
    WORD_LIST_ITEM_SX,
} from '../word-styles';

export function BulletedListElement({ children, attributes }: PlateElementProps) {
    return (
        <Box
            component="ul"
            {...attributes}
            sx={{
                ...WORD_LIST_BASE_SX,
                listStyleType: 'disc',
                '& > *::marker': {
                    color: 'text.primary',
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
                ...WORD_LIST_BASE_SX,
                listStyleType: 'decimal',
                '& > *::marker': {
                    color: 'text.primary',
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
            sx={WORD_LIST_ITEM_SX}
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
            sx={WORD_LIST_ITEM_CONTENT_SX}
        >
            {children}
        </Box>
    );
}
