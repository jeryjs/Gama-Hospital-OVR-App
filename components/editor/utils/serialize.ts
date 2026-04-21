import type { EditorValue, TElement, TText } from '../plate-types';
import { unified } from 'unified';
import remarkStringify from 'remark-stringify';
import { deserializeFromMarkdown } from './deserialize';

/**
 * Serialize Plate editor value to plain text
 * Useful for search indexing, summaries, character counts, etc.
 */

// Type guard for text nodes
function isTextNode(node: unknown): node is TText {
    return typeof node === 'object' && node !== null && 'text' in node;
}

// Type guard for element nodes
function isElementNode(node: unknown): node is TElement {
    return typeof node === 'object' && node !== null && 'type' in node && 'children' in node;
}

function isListParagraphNode(node: unknown): node is TElement & {
    listStyleType?: string;
    indent?: number;
} {
    return isElementNode(node) && node.type === 'p' && typeof (node as { listStyleType?: unknown }).listStyleType === 'string';
}

/**
 * Convert Plate value to plain text
 * @param value - The Plate editor value
 * @param separator - Separator between blocks (default: newline)
 * @returns Plain text string
 */
export function serializeToPlainText(
    value: EditorValue | undefined | null,
    separator: string = '\n'
): string {
    if (!value || value.length === 0) {
        return '';
    }

    const extractText = (node: unknown): string => {
        if (isTextNode(node)) {
            return node.text || '';
        }

        if (isElementNode(node)) {
            const childText = node.children
                ?.map((child) => extractText(child))
                .join('') || '';

            if (node.type === 'p' && typeof (node as { listStyleType?: unknown }).listStyleType === 'string') {
                return childText;
            }

            // Add appropriate separators based on block type
            switch (node.type) {
                case 'h1':
                case 'h2':
                case 'h3':
                case 'p':
                case 'blockquote':
                    return childText;
                case 'li':
                case 'lic':
                    return childText;
                case 'ul':
                    return node.children
                        ?.map((child) => {
                            const text = extractText(child).trim();
                            return text ? `• ${text}` : '';
                        })
                        .filter(Boolean)
                        .join(separator) || '';
                case 'ol':
                    return node.children
                        ?.map((child, index) => {
                            const text = extractText(child).trim();
                            return text ? `${index + 1}. ${text}` : '';
                        })
                        .filter(Boolean)
                        .join(separator) || '';
                default:
                    return childText;
            }
        }

        return '';
    };

    let orderedIndex = 0;
    let inOrderedList = false;

    return value
        .map((node) => {
            if (isListParagraphNode(node)) {
                const text = extractText(node).trim();

                if (!text) return '';

                if (node.listStyleType === 'decimal') {
                    orderedIndex = inOrderedList ? orderedIndex + 1 : 1;
                    inOrderedList = true;
                    return `${orderedIndex}. ${text}`;
                }

                inOrderedList = false;
                orderedIndex = 0;
                return `• ${text}`;
            }

            inOrderedList = false;
            orderedIndex = 0;
            return extractText(node);
        })
        .filter(Boolean)
        .join(separator)
        .trim();
}

/**
 * Get character count from Plate value
 * @param value - The Plate editor value
 * @returns Character count (excluding whitespace-only)
 */
export function getCharacterCount(value: EditorValue | string | undefined | null): number {
    const editorValue = typeof value === 'string'
        ? deserializeFromMarkdown(value)
        : value;

    const text = serializeToPlainText(editorValue, ' ');
    return text.replace(/\s+/g, ' ').trim().length;
}

/**
 * Get word count from Plate value
 * @param value - The Plate editor value
 * @returns Word count
 */
export function getWordCount(value: EditorValue | string | undefined | null): number {
    const editorValue = typeof value === 'string'
        ? deserializeFromMarkdown(value)
        : value;

    const text = serializeToPlainText(editorValue, ' ');
    const words = text.trim().split(/\s+/).filter(Boolean);
    return words.length;
}

/**
 * Truncate Plate value to plain text with max length
 * @param value - The Plate editor value
 * @param maxLength - Maximum character length
 * @param suffix - Suffix to add when truncated (default: '...')
 * @returns Truncated plain text string
 */
export function truncateToPlainText(
    value: EditorValue | string | undefined | null,
    maxLength: number,
    suffix: string = '...'
): string {
    const editorValue = typeof value === 'string'
        ? deserializeFromMarkdown(value)
        : value;

    const text = serializeToPlainText(editorValue, ' ');

    if (text.length <= maxLength) {
        return text;
    }

    // Find a good break point (word boundary)
    const truncated = text.slice(0, maxLength);
    const lastSpace = truncated.lastIndexOf(' ');

    if (lastSpace > maxLength * 0.7) {
        return truncated.slice(0, lastSpace) + suffix;
    }

    return truncated + suffix;
}

function wrapMarks(node: TText, leaf: any): any {
    let output = leaf;

    if (node.bold) {
        output = { type: 'strong', children: [output] };
    }

    if (node.italic) {
        output = { type: 'emphasis', children: [output] };
    }

    if (node.underline) {
        const raw = typeof node.text === 'string' ? node.text : '';
        output = { type: 'html', value: `<u>${raw}</u>` };
    }

    return output;
}

function toMdInline(node: unknown): any[] {
    if (isTextNode(node)) {
        const textLeaf = { type: 'text', value: node.text || '' };
        return [wrapMarks(node, textLeaf)];
    }

    if (!isElementNode(node)) {
        return [];
    }

    if (node.type === 'a') {
        const url = typeof (node as { url?: unknown }).url === 'string'
            ? (node as unknown as { url: string }).url
            : '';

        return [{
            type: 'link',
            url,
            children: node.children?.flatMap((child) => toMdInline(child)) || [{ type: 'text', value: url }],
        }];
    }

    return node.children?.flatMap((child) => toMdInline(child)) || [];
}

function toMdListItem(node: TElement): any {
    return {
        type: 'listItem',
        spread: false,
        children: [{
            type: 'paragraph',
            children: node.children?.flatMap((child) => toMdInline(child)) || [{ type: 'text', value: '' }],
        }],
    };
}

function toMdBlock(node: unknown): any[] {
    if (!isElementNode(node)) {
        return [];
    }

    switch (node.type) {
        case 'h1':
        case 'h2':
        case 'h3':
            return [{
                type: 'heading',
                depth: node.type === 'h1' ? 1 : node.type === 'h2' ? 2 : 3,
                children: node.children?.flatMap((child) => toMdInline(child)) || [{ type: 'text', value: '' }],
            }];

        case 'blockquote':
            return [{
                type: 'blockquote',
                children: [{
                    type: 'paragraph',
                    children: node.children?.flatMap((child) => toMdInline(child)) || [{ type: 'text', value: '' }],
                }],
            }];

        case 'ul':
        case 'ol':
            return [{
                type: 'list',
                ordered: node.type === 'ol',
                spread: false,
                children: (node.children || []).map((item) => ({
                    type: 'listItem',
                    spread: false,
                    children: [{
                        type: 'paragraph',
                        children: isElementNode(item)
                            ? item.children?.flatMap((child) => toMdInline(child)) || [{ type: 'text', value: '' }]
                            : [{ type: 'text', value: '' }],
                    }],
                })),
            }];

        case 'li':
        case 'lic':
            return [{
                type: 'paragraph',
                children: node.children?.flatMap((child) => toMdInline(child)) || [{ type: 'text', value: '' }],
            }];

        case 'p':
        default:
            return [{
                type: 'paragraph',
                children: node.children?.flatMap((child) => toMdInline(child)) || [{ type: 'text', value: '' }],
            }];
    }
}

export function serializeToMarkdown(value: EditorValue | undefined | null): string {
    if (!value || value.length === 0) {
        return '';
    }

    const rootChildren: any[] = [];
    let activeList: { ordered: boolean; indent: number; node: any } | null = null;

    for (const node of value) {
        if (isListParagraphNode(node)) {
            const ordered = node.listStyleType === 'decimal';
            const indent = node.indent ?? 1;

            if (!activeList || activeList.ordered !== ordered || activeList.indent !== indent) {
                activeList = {
                    ordered,
                    indent,
                    node: {
                        type: 'list',
                        ordered,
                        spread: false,
                        children: [],
                    },
                };
                rootChildren.push(activeList.node);
            }

            activeList.node.children.push(toMdListItem(node));
            continue;
        }

        activeList = null;
        rootChildren.push(...toMdBlock(node));
    }

    const root = {
        type: 'root',
        children: rootChildren,
    } as any;

    return unified()
        .use(remarkStringify, {
            bullet: '-',
            listItemIndent: 'one',
        })
        .stringify(root)
        .trim();
}
