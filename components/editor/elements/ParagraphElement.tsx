'use client';

import { Typography } from '@mui/material';
import type { PlateElementProps } from 'platejs/react';
import { WORD_PARAGRAPH_SX } from '../word-styles';

export function ParagraphElement({ children, attributes }: PlateElementProps) {
    return (
        <Typography
            component="div"
            variant="body1"
            {...attributes}
            sx={WORD_PARAGRAPH_SX}
        >
            {children}
        </Typography>
    );
}