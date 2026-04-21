import type { EditorValue } from '../plate-types';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';

/**
 * Deserialize plain text to Plate editor value
 * Useful for migrating existing text content to the rich text editor
 */

/**
 * Convert plain text to Plate value
 * @param text - Plain text string
 * @returns Plate editor value
 */
export function deserializeFromPlainText(text: string | undefined | null): EditorValue {
    if (!text || text.trim() === '') {
        return [
            {
                type: 'p',
                children: [{ text: '' }],
            },
        ];
    }

    // Split by double newlines for paragraphs
    const paragraphs = text.split(/\n\n+/);

    return paragraphs.map((paragraph) => {
        const trimmed = paragraph.trim();

        // Detect markdown-like headings
        if (trimmed.startsWith('### ')) {
            return {
                type: 'h3',
                children: [{ text: trimmed.slice(4) }],
            };
        }
        if (trimmed.startsWith('## ')) {
            return {
                type: 'h2',
                children: [{ text: trimmed.slice(3) }],
            };
        }
        if (trimmed.startsWith('# ')) {
            return {
                type: 'h1',
                children: [{ text: trimmed.slice(2) }],
            };
        }

        // Detect blockquotes
        if (trimmed.startsWith('> ')) {
            return {
                type: 'blockquote',
                children: [{ text: trimmed.slice(2) }],
            };
        }

        // Detect bullet lists
        const bulletLines = trimmed.split('\n').filter((line) =>
            line.trim().startsWith('- ') || line.trim().startsWith('* ')
        );
        if (bulletLines.length > 0 && bulletLines.length === trimmed.split('\n').length) {
            return {
                type: 'ul',
                children: bulletLines.map((line) => ({
                    type: 'li',
                    children: [{
                        type: 'lic',
                        children: [{ text: line.trim().slice(2) }]
                    }],
                })),
            };
        }

        // Detect numbered lists
        const numberedLines = trimmed.split('\n').filter((line) =>
            /^\d+\.\s/.test(line.trim())
        );
        if (numberedLines.length > 0 && numberedLines.length === trimmed.split('\n').length) {
            return {
                type: 'ol',
                children: numberedLines.map((line) => ({
                    type: 'li',
                    children: [{
                        type: 'lic',
                        children: [{ text: line.trim().replace(/^\d+\.\s/, '') }]
                    }],
                })),
            };
        }

        // Default to paragraph - handle single newlines as line breaks within paragraph
        const lines = trimmed.split('\n');
        if (lines.length > 1) {
            // Multiple lines without double newline - keep as single paragraph with newlines
            return {
                type: 'p',
                children: [{ text: lines.join('\n') }],
            };
        }

        return {
            type: 'p',
            children: [{ text: trimmed }],
        };
    });
}

/**
 * Convert HTML string to Plate value (basic conversion)
 * Note: This is a simple converter - for complex HTML, consider using a proper HTML parser
 * @param html - HTML string
 * @returns Plate editor value
 */
export function deserializeFromHTML(html: string | undefined | null): EditorValue {
    if (!html || html.trim() === '') {
        return [
            {
                type: 'p',
                children: [{ text: '' }],
            },
        ];
    }

    // Simple regex-based HTML to plain text conversion
    // Remove script and style content
    let text = html
        .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
        .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '');

    // Convert common block elements to newlines
    text = text
        .replace(/<\/p>/gi, '\n\n')
        .replace(/<\/div>/gi, '\n\n')
        .replace(/<\/h[1-6]>/gi, '\n\n')
        .replace(/<br\s*\/?>/gi, '\n')
        .replace(/<li[^>]*>/gi, '- ')
        .replace(/<\/li>/gi, '\n');

    // Remove all remaining HTML tags
    text = text.replace(/<[^>]+>/g, '');

    // Decode HTML entities
    text = text
        .replace(/&nbsp;/g, ' ')
        .replace(/&amp;/g, '&')
        .replace(/&lt;/g, '<')
        .replace(/&gt;/g, '>')
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'");

    // Clean up whitespace
    text = text
        .replace(/\n\s*\n\s*\n/g, '\n\n')
        .trim();

    return deserializeFromPlainText(text);
}

/**
 * Migrate legacy markdown-like content to Plate value
 * Handles basic markdown syntax: **bold**, *italic*, [links](url)
 * @param markdown - Markdown-like string
 * @returns Plate editor value with basic formatting preserved
 */
export function deserializeFromMarkdown(markdown: string | undefined | null): EditorValue {
    if (!markdown || markdown.trim() === '') {
        return [
            {
                type: 'p',
                children: [{ text: '' }],
            },
        ];
    }

    const ast = unified()
        .use(remarkParse)
        .use(remarkGfm)
        .parse(markdown) as any;

    const withMark = (nodes: any[], mark: 'bold' | 'italic' | 'underline'): any[] =>
        nodes.map((node) => {
            if (node && typeof node === 'object' && 'text' in node) {
                return { ...node, [mark]: true };
            }

            if (node?.type === 'a' && Array.isArray(node.children)) {
                return { ...node, children: withMark(node.children, mark) };
            }

            return node;
        });

    const inlineFromMd = (inlineNodes: any[]): any[] => {
        const output: any[] = [];

        for (const node of inlineNodes || []) {
            if (!node) continue;

            switch (node.type) {
                case 'text':
                    output.push({ text: node.value || '' });
                    break;

                case 'strong':
                    output.push(...withMark(inlineFromMd(node.children || []), 'bold'));
                    break;

                case 'emphasis':
                    output.push(...withMark(inlineFromMd(node.children || []), 'italic'));
                    break;

                case 'link':
                    output.push({
                        type: 'a',
                        url: node.url || '',
                        children: inlineFromMd(node.children || []),
                    });
                    break;

                case 'inlineCode':
                    output.push({ text: node.value || '' });
                    break;

                case 'break':
                    output.push({ text: '\n' });
                    break;

                case 'html': {
                    const value = String(node.value || '');
                    const underlineMatch = value.match(/^<u>(.*?)<\/u>$/i);
                    if (underlineMatch) {
                        output.push(...withMark([{ text: underlineMatch[1] || '' }], 'underline'));
                    }
                    break;
                }

                default:
                    if (typeof node.value === 'string') {
                        output.push({ text: node.value });
                    }
            }
        }

        return output.length ? output : [{ text: '' }];
    };

    const blockFromMd = (node: any): any[] => {
        if (!node) return [];

        switch (node.type) {
            case 'heading': {
                const depth = Math.min(Math.max(Number(node.depth || 1), 1), 3);
                return [{
                    type: depth === 1 ? 'h1' : depth === 2 ? 'h2' : 'h3',
                    children: inlineFromMd(node.children || []),
                }];
            }

            case 'paragraph':
                return [{
                    type: 'p',
                    children: inlineFromMd(node.children || []),
                }];

            case 'blockquote': {
                const quoteChildren = (node.children || []).flatMap((child: any) => {
                    if (child.type === 'paragraph') return inlineFromMd(child.children || []);
                    return blockFromMd(child).flatMap((b: any) => b.children || [{ text: '' }]);
                });

                return [{
                    type: 'blockquote',
                    children: quoteChildren.length ? quoteChildren : [{ text: '' }],
                }];
            }

            case 'list':
                return (node.children || []).map((item: any) => {
                    const firstParagraph = (item.children || []).find((c: any) => c.type === 'paragraph');
                    const listChildren = firstParagraph
                        ? inlineFromMd(firstParagraph.children || [])
                        : [{ text: '' }];

                    return {
                        type: 'p',
                        listStyleType: node.ordered ? 'decimal' : 'disc',
                        indent: 1,
                        children: listChildren.length ? listChildren : [{ text: '' }],
                    };
                });

            case 'thematicBreak':
                return [{ type: 'p', children: [{ text: '---' }] }];

            default:
                return [];
        }
    };

    const plateNodes = (ast.children || []).flatMap((node: any) => blockFromMd(node));

    return plateNodes.length
        ? (plateNodes as EditorValue)
        : [{ type: 'p', children: [{ text: '' }] }];
}
