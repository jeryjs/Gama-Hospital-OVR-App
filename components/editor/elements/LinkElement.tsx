'use client';

import { Link } from '@mui/material';
import type { PlateElementProps } from 'platejs/react';
import type { TElement } from 'platejs';

interface LinkElementNode extends TElement {
    type: 'a';
    url?: string;
}

export function LinkElement({ children, attributes, element, ...props }: PlateElementProps) {
    const linkElement = element as LinkElementNode;
    const url = linkElement.url || '#';

    const handleClick = (e: React.MouseEvent) => {
        // Only open link if Ctrl/Cmd is pressed (standard editor behavior)
        if (e.ctrlKey || e.metaKey) {
            window.open(url, '_blank', 'noopener,noreferrer');
        }
    };

    return (
        <Link
            {...attributes}
            href={url}
            onClick={handleClick}
            sx={{
                color: 'primary.main',
                textDecoration: 'underline',
                textDecorationColor: 'rgba(0, 229, 153, 0.4)',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                '&:hover': {
                    textDecorationColor: 'primary.main',
                    backgroundColor: 'rgba(0, 229, 153, 0.1)',
                    borderRadius: '2px',
                },
            }}
            {...props}
        >
            {children}
        </Link>
    );
}
