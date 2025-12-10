'use client';

/**
 * Plate.js plugin configuration for the OVR Rich Text Editor
 */

import {
    BoldPlugin,
    ItalicPlugin,
    UnderlinePlugin,
    BlockquotePlugin,
} from '@platejs/basic-nodes/react';
import { ListPlugin } from '@platejs/list/react';
import { LinkPlugin } from '@platejs/link/react';
import { AutoformatPlugin } from '@platejs/autoformat';

// Autoformat rules for markdown-like shortcuts
const autoformatRules = [
    // Bold: **text** or __text__
    {
        mode: 'mark' as const,
        type: 'bold',
        match: ['**', '__'],
    },
    // Italic: *text* or _text_
    {
        mode: 'mark' as const,
        type: 'italic',
        match: ['*', '_'],
    },
    // Blockquote: > at start of line
    {
        mode: 'block' as const,
        type: 'blockquote',
        match: '> ',
    },
    // Headings
    {
        mode: 'block' as const,
        type: 'h1',
        match: '# ',
    },
    {
        mode: 'block' as const,
        type: 'h2',
        match: '## ',
    },
    {
        mode: 'block' as const,
        type: 'h3',
        match: '### ',
    },
    // Bulleted list: - or * at start of line
    {
        mode: 'block' as const,
        type: 'ul',
        match: ['- ', '* '],
    },
    // Numbered list: 1. at start of line
    {
        mode: 'block' as const,
        type: 'ol',
        match: '1. ',
    },
];

// Export configured plugins array
export const editorPlugins = [
    // Basic formatting
    BoldPlugin,
    ItalicPlugin,
    UnderlinePlugin,
    BlockquotePlugin,

    // Lists
    ListPlugin,

    // Links
    LinkPlugin.configure({
        render: {
            afterEditable: () => null, // We'll handle link UI ourselves
        },
    }),

    // Autoformat for markdown shortcuts
    AutoformatPlugin.configure({
        options: {
            rules: autoformatRules,
            enableUndoOnDelete: true,
        },
    }),
];

// Plugin keys for toggling marks/blocks
export const MARK_BOLD = 'bold';
export const MARK_ITALIC = 'italic';
export const MARK_UNDERLINE = 'underline';

export const ELEMENT_PARAGRAPH = 'p';
export const ELEMENT_H1 = 'h1';
export const ELEMENT_H2 = 'h2';
export const ELEMENT_H3 = 'h3';
export const ELEMENT_BLOCKQUOTE = 'blockquote';
export const ELEMENT_UL = 'ul';
export const ELEMENT_OL = 'ol';
export const ELEMENT_LI = 'li';
export const ELEMENT_LINK = 'a';
