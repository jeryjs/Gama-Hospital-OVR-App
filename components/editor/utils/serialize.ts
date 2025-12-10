import type { EditorValue, TElement, TText } from '../plate-types';

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
                    return `• ${childText}`;
                case 'ul':
                case 'ol':
                    return node.children
                        ?.map((child) => extractText(child))
                        .join(separator) || '';
                default:
                    return childText;
            }
        }

        return '';
    };

    return value
        .map((node) => extractText(node))
        .filter(Boolean)
        .join(separator)
        .trim();
}

/**
 * Get character count from Plate value
 * @param value - The Plate editor value
 * @returns Character count (excluding whitespace-only)
 */
export function getCharacterCount(value: EditorValue | undefined | null): number {
    const text = serializeToPlainText(value, ' ');
    return text.replace(/\s+/g, ' ').trim().length;
}

/**
 * Get word count from Plate value
 * @param value - The Plate editor value
 * @returns Word count
 */
export function getWordCount(value: EditorValue | undefined | null): number {
    const text = serializeToPlainText(value, ' ');
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
    value: EditorValue | undefined | null,
    maxLength: number,
    suffix: string = '...'
): string {
    const text = serializeToPlainText(value, ' ');

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
