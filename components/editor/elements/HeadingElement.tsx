'use client';

import { Typography } from '@mui/material';
import type { PlateElementProps } from 'platejs/react';
import { WORD_HEADING_SX } from '../word-styles';

interface HeadingElementProps extends PlateElementProps {
    variant: 'h1' | 'h2' | 'h3';
}

export function HeadingElement({ children, attributes, variant }: HeadingElementProps) {
    return (
        <Typography
            component={variant}
            {...attributes}
            sx={{
                ...WORD_HEADING_SX[variant],
                '&:first-of-type': {
                    mt: 0,
                },
            }}
        >
            {children}
        </Typography>
    );
}

// Convenience components for each heading level
export function H1Element(props: PlateElementProps) {
    return <HeadingElement {...props} variant="h1" />;
}

export function H2Element(props: PlateElementProps) {
    return <HeadingElement {...props} variant="h2" />;
}

export function H3Element(props: PlateElementProps) {
    return <HeadingElement {...props} variant="h3" />;
}