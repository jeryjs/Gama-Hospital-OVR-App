'use client';

import type { PlateElementProps } from 'platejs/react';

export function BulletedListElement({ children, attributes }: PlateElementProps) {
    return (
        <ul
            {...attributes}
            style={{
                paddingLeft: '24px',
                margin: '8px 0',
            }}
        >
            {children}
        </ul>
    );
}

export function NumberedListElement({ children, attributes }: PlateElementProps) {
    return (
        <ol
            {...attributes}
            style={{
                paddingLeft: '24px',
                margin: '8px 0',
            }}
        >
            {children}
        </ol>
    );
}

export function ListItemElement({ children, attributes }: PlateElementProps) {
    return (
        <li
            {...attributes}
            style={{
                padding: '2px 0',
                lineHeight: 1.7,
            }}
        >
            {children}
        </li>
    );
}
