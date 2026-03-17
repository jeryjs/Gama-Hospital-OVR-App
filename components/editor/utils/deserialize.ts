import type { EditorValue } from '../plate-types';

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

    const lines = markdown.replace(/\r\n/g, '\n').split('\n');
    const nodes: EditorValue = [];

    const parseInline = (text: string): any[] => {
        const segments: any[] = [];
        const linkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
        let cursor = 0;
        let match: RegExpExecArray | null;

        while ((match = linkRegex.exec(text)) !== null) {
            const [full, label, url] = match;
            const index = match.index;

            if (index > cursor) {
                segments.push({ text: text.slice(cursor, index) });
            }

            segments.push({
                type: 'a',
                url,
                children: [{ text: label }],
            });

            cursor = index + full.length;
        }

        if (cursor < text.length) {
            segments.push({ text: text.slice(cursor) });
        }

        const applyPattern = (input: any[], regex: RegExp, toNode: (content: string) => any) =>
            input.flatMap((segment) => {
                if (!segment || typeof segment !== 'object' || !('text' in segment)) {
                    return [segment];
                }

                const source = String(segment.text || '');
                const parts: any[] = [];
                let localCursor = 0;
                let localMatch: RegExpExecArray | null;
                regex.lastIndex = 0;

                while ((localMatch = regex.exec(source)) !== null) {
                    const [full, content] = localMatch;
                    const at = localMatch.index;

                    if (at > localCursor) {
                        parts.push({ ...segment, text: source.slice(localCursor, at) });
                    }

                    parts.push(toNode(content));
                    localCursor = at + full.length;
                }

                if (localCursor < source.length) {
                    parts.push({ ...segment, text: source.slice(localCursor) });
                }

                return parts.length ? parts : [segment];
            });

        let output = segments;
        output = applyPattern(output, /<u>(.*?)<\/u>/g, (content) => ({ text: content, underline: true }));
        output = applyPattern(output, /\*\*([^*]+)\*\*/g, (content) => ({ text: content, bold: true }));
        output = applyPattern(output, /\*([^*]+)\*/g, (content) => ({ text: content, italic: true }));

        return output.length ? output : [{ text: text }];
    };

    const isBullet = (line: string) => /^[-*]\s+/.test(line.trim());
    const isNumbered = (line: string) => /^\d+\.\s+/.test(line.trim());
    const isHeading = (line: string) => /^#{1,3}\s*/.test(line.trim());
    const isQuote = (line: string) => /^>\s+/.test(line.trim());

    let i = 0;
    while (i < lines.length) {
        const raw = lines[i];
        const line = raw.trim();

        if (!line) {
            i += 1;
            continue;
        }

        if (isHeading(line)) {
            const depth = Math.min((line.match(/^#+/)?.[0].length || 1), 3);
            const text = line.replace(/^#{1,3}\s*/, '');
            nodes.push({
                type: depth === 1 ? 'h1' : depth === 2 ? 'h2' : 'h3',
                children: parseInline(text),
            } as any);
            i += 1;
            continue;
        }

        if (isQuote(line)) {
            const quoteLines: string[] = [];
            while (i < lines.length && isQuote(lines[i])) {
                quoteLines.push(lines[i].trim().replace(/^>\s+/, ''));
                i += 1;
            }
            nodes.push({
                type: 'blockquote',
                children: parseInline(quoteLines.join('\n')),
            } as any);
            continue;
        }

        if (isBullet(line)) {
            const items: any[] = [];
            while (i < lines.length) {
                const current = lines[i].trim();
                if (!current) {
                    i += 1;
                    continue;
                }
                if (!isBullet(current)) break;

                const itemText = current.replace(/^[-*]\s+/, '');
                items.push({
                    type: 'li',
                    children: [
                        {
                            type: 'lic',
                            children: parseInline(itemText),
                        },
                    ],
                });
                i += 1;
            }

            nodes.push({
                type: 'ul',
                children: items,
            } as any);
            continue;
        }

        if (isNumbered(line)) {
            const items: any[] = [];
            while (i < lines.length) {
                const current = lines[i].trim();
                if (!current) {
                    i += 1;
                    continue;
                }
                if (!isNumbered(current)) break;

                const itemText = current.replace(/^\d+\.\s+/, '');
                items.push({
                    type: 'li',
                    children: [
                        {
                            type: 'lic',
                            children: parseInline(itemText),
                        },
                    ],
                });
                i += 1;
            }

            nodes.push({
                type: 'ol',
                children: items,
            } as any);
            continue;
        }

        const paragraphLines: string[] = [line];
        i += 1;
        while (i < lines.length) {
            const current = lines[i].trim();
            if (!current) break;
            if (isHeading(current) || isQuote(current) || isBullet(current) || isNumbered(current)) break;
            paragraphLines.push(current);
            i += 1;
        }

        nodes.push({
            type: 'p',
            children: parseInline(paragraphLines.join('\n')),
        } as any);
    }

    return nodes.length
        ? nodes
        : [
            {
                type: 'p',
                children: [{ text: '' }],
            },
        ];
}
