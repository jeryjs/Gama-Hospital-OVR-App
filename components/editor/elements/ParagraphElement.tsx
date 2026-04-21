'use client';

import { Typography } from '@mui/material';
import type { PlateElementProps } from 'platejs/react';
import { WORD_PARAGRAPH_SX, getWordListParagraphSx } from '../word-styles';

export function ParagraphElement({ children, attributes, element }: PlateElementProps) {
    const listStyleType = (element as { listStyleType?: string })?.listStyleType;
    const indent = (element as { indent?: number })?.indent ?? 1;

    return (
        <Typography
            component="p"
            variant="body1"
            {...attributes}
            sx={listStyleType ? getWordListParagraphSx(listStyleType, indent) : WORD_PARAGRAPH_SX}
        >
            {children}
        </Typography>
    );
}