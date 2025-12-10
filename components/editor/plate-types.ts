'use client';

/**
 * Plate.js type definitions for the OVR Rich Text Editor
 * Re-exports Plate types needed by the app
 */

import type { Value, TElement, TText } from 'platejs';

// Re-export core types
export type { Value, TElement, TText };

// Editor value type alias for convenience
export type EditorValue = Value;

// Element types used in our editor
export interface ParagraphElement extends TElement {
    type: 'p';
    children: TText[];
}

export interface HeadingElement extends TElement {
    type: 'h1' | 'h2' | 'h3';
    children: TText[];
}

export interface BlockquoteElement extends TElement {
    type: 'blockquote';
    children: TText[];
}

export interface LinkElement extends TElement {
    type: 'a';
    url: string;
    children: TText[];
}

export interface ListElement extends TElement {
    type: 'ul' | 'ol';
    children: ListItemElement[];
}

export interface ListItemElement extends TElement {
    type: 'li';
    children: TText[];
}

// Union type for all custom elements
export type CustomElement =
    | ParagraphElement
    | HeadingElement
    | BlockquoteElement
    | LinkElement
    | ListElement
    | ListItemElement;

// Default empty editor value
export const createEmptyValue = (): EditorValue => [
    {
        type: 'p',
        children: [{ text: '' }],
    },
];

// Check if value is empty
export const isEmptyValue = (value: EditorValue | undefined | null): boolean => {
    if (!value || value.length === 0) return true;
    if (value.length === 1) {
        const firstNode = value[0] as TElement;
        if (firstNode.type === 'p' && firstNode.children?.length === 1) {
            const firstChild = firstNode.children[0] as TText;
            return !firstChild.text || firstChild.text === '';
        }
    }
    return false;
};
