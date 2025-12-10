'use client';

import { Typography } from '@mui/material';
import type { PlateElementProps } from 'platejs/react';

interface HeadingElementProps extends PlateElementProps {
    variant: 'h1' | 'h2' | 'h3';
}

export function HeadingElement({ children, attributes, variant }: HeadingElementProps) {
    const styles = {
        h1: {
            fontSize: '1.75rem',
            fontWeight: 700,
            mt: 2,
            mb: 1,
            letterSpacing: '-0.02em',
            color: 'text.primary',
        },
        h2: {
            fontSize: '1.375rem',
            fontWeight: 600,
            mt: 1.5,
            mb: 0.75,
            letterSpacing: '-0.01em',
            color: 'text.primary',
        },
        h3: {
            fontSize: '1.125rem',
            fontWeight: 600,
            mt: 1.25,
            mb: 0.5,
            color: 'text.primary',
        },
    };

    return (
        <Typography
            component={variant}
            {...attributes}
            sx={{
                ...styles[variant],
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