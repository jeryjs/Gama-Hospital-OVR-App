'use client';

import { Box, Typography, Link, alpha } from '@mui/material';
import type { EditorValue, TElement, TText } from './plate-types';
import { deserializeFromMarkdown } from './utils';
import {
    WORD_BASE_FONT_SIZE,
    WORD_FONT_FAMILY,
    WORD_HEADING_SX,
    WORD_LINE_HEIGHT,
    WORD_PARAGRAPH_SX,
} from './word-styles';

interface RichTextPreviewProps {
    value?: string | null;
    emptyText?: string;
}

// Type guard for text nodes
function isTextNode(node: unknown): node is TText {
    return typeof node === 'object' && node !== null && 'text' in node;
}

// Type guard for element nodes
function isElementNode(node: unknown): node is TElement {
    return typeof node === 'object' && node !== null && 'type' in node && 'children' in node;
}

function isFlatListNode(node: unknown): node is TElement & { listStyleType: string; indent?: number } {
    return isElementNode(node) && node.type === 'p' && typeof (node as { listStyleType?: unknown }).listStyleType === 'string';
}

function isBlankParagraph(node: unknown): boolean {
    return isElementNode(node)
        && node.type === 'p'
        && (!node.children || node.children.length === 0 || node.children.every((child) => isTextNode(child) && (!child.text || child.text === '')));
}

// Render text with marks
function renderText(node: TText, index: number): React.ReactNode {
    let content: React.ReactNode = node.text;

    if (!content) return null;

    if (node.bold) {
        content = <strong key={`bold-${index}`}>{content}</strong>;
    }
    if (node.italic) {
        content = <em key={`italic-${index}`}>{content}</em>;
    }
    if (node.underline) {
        content = <u key={`underline-${index}`}>{content}</u>;
    }

    return content;
}

// Render a node recursively
function renderNode(node: unknown, index: number): React.ReactNode {
    if (isTextNode(node)) {
        return renderText(node, index);
    }

    if (!isElementNode(node)) {
        return null;
    }

    const children = node.children?.map((child, i) => renderNode(child, i));

    switch (node.type) {
        case 'h1':
            return (
                <Typography
                    key={index}
                    component="h1"
                    sx={{
                        ...WORD_HEADING_SX.h1,
                        mt: index > 0 ? WORD_HEADING_SX.h1.mt : 0,
                    }}
                >
                    {children}
                </Typography>
            );

        case 'h2':
            return (
                <Typography
                    key={index}
                    component="h2"
                    sx={{
                        ...WORD_HEADING_SX.h2,
                        mt: index > 0 ? WORD_HEADING_SX.h2.mt : 0,
                    }}
                >
                    {children}
                </Typography>
            );

        case 'h3':
            return (
                <Typography
                    key={index}
                    component="h3"
                    sx={{
                        ...WORD_HEADING_SX.h3,
                        mt: index > 0 ? WORD_HEADING_SX.h3.mt : 0,
                    }}
                >
                    {children}
                </Typography>
            );

        case 'blockquote':
            return (
                <Box
                    key={index}
                    component="blockquote"
                    sx={(theme) => ({
                        borderLeft: '4px solid',
                        borderColor: 'primary.main',
                        pl: 2,
                        py: 0.5,
                        my: 1.5,
                        mx: 0,
                        fontFamily: WORD_FONT_FAMILY,
                        fontSize: WORD_BASE_FONT_SIZE,
                        lineHeight: WORD_LINE_HEIGHT,
                        backgroundColor: alpha(theme.palette.primary.main, 0.08),
                        borderRadius: '0 8px 8px 0',
                        fontStyle: 'italic',
                        color: 'text.secondary',
                    })}
                >
                    {children}
                </Box>
            );

        case 'ul':
        case 'ol':
            return (
                <Box
                    key={index}
                    component={node.type}
                    sx={{
                        fontFamily: WORD_FONT_FAMILY,
                        fontSize: WORD_BASE_FONT_SIZE,
                        lineHeight: WORD_LINE_HEIGHT,
                        my: 0.75,
                        pl: 4,
                        listStyleType: node.type === 'ol' ? 'decimal' : 'disc',
                        '& > li': {
                            py: 0.25,
                            lineHeight: WORD_LINE_HEIGHT,
                            color: 'text.primary',
                        },
                    }}
                >
                    {children}
                </Box>
            );

        case 'li':
            return (
                <Box key={index} component="li" sx={{ py: 0.25, lineHeight: WORD_LINE_HEIGHT, color: 'text.primary' }}>
                    {children}
                </Box>
            );

        case 'lic':
            return (
                <Box key={index} component="span" sx={{ display: 'inline', lineHeight: WORD_LINE_HEIGHT, color: 'text.primary' }}>
                    {children}
                </Box>
            );

        case 'a': {
            const linkNode = node as TElement & { url?: string };
            return (
                <Link
                    key={index}
                    href={linkNode.url || '#'}
                    target="_blank"
                    rel="noopener noreferrer"
                    sx={(theme) => ({
                        color: 'primary.main',
                        textDecoration: 'underline',
                        textDecorationColor: alpha(theme.palette.primary.main, 0.45),
                        '&:hover': {
                            textDecorationColor: 'primary.main',
                        },
                    })}
                >
                    {children}
                </Link>
            );
        }

        case 'p':
        default:
            return (
                <Typography
                    key={index}
                    variant="body1"
                    component="p"
                    sx={WORD_PARAGRAPH_SX}
                >
                    {children}
                </Typography>
            );
    }
}

/**
 * Helper to normalize markdown string into editor nodes.
 */
function normalizeValueToNodes(value: string | null | undefined): EditorValue {
    return deserializeFromMarkdown(value);
}

export function RichTextPreview({
    value,
    emptyText = 'No content',
}: RichTextPreviewProps) {
    if (!value || value.trim() === '') {
        return (
            <Typography
                variant="body2"
                sx={{
                    color: 'text.disabled',
                    fontStyle: 'italic',
                }}
            >
                {emptyText}
            </Typography>
        );
    }

    const nodes = normalizeValueToNodes(value);

    if (!nodes.length) {
        return (
            <Typography
                variant="body2"
                sx={{
                    color: 'text.disabled',
                    fontStyle: 'italic',
                }}
            >
                {emptyText}
            </Typography>
        );
    }

    const rendered: React.ReactNode[] = [];

    for (let i = 0; i < nodes.length;) {
        const node = nodes[i];

        if (isFlatListNode(node)) {
            const listStyleType = node.listStyleType;
            const ordered = listStyleType === 'decimal';
            const indent = node.indent ?? 1;
            const listItems: TElement[] = [];

            while (i < nodes.length) {
                const current = nodes[i];
                if (!isFlatListNode(current)) break;
                if (current.listStyleType !== listStyleType || (current.indent ?? 1) !== indent) break;
                listItems.push(current);
                i += 1;
            }

            rendered.push(
                <Box
                    key={`list-${rendered.length}`}
                    component={ordered ? 'ol' : 'ul'}
                    sx={{
                        fontFamily: WORD_FONT_FAMILY,
                        fontSize: WORD_BASE_FONT_SIZE,
                        lineHeight: WORD_LINE_HEIGHT,
                        my: 0.75,
                        pl: 4,
                        listStyleType,
                        '& > li': {
                            py: 0.25,
                            lineHeight: WORD_LINE_HEIGHT,
                            color: 'text.primary',
                        },
                    }}
                >
                    {listItems.map((listNode, listIndex) => (
                        <Box key={`li-${i}-${listIndex}`} component="li">
                            {listNode.children?.map((child, childIndex) => renderNode(child, childIndex))}
                        </Box>
                    ))}
                </Box>
            );

            continue;
        }

        if (isBlankParagraph(node)) {
            rendered.push(renderNode(node, i));
            i += 1;
            continue;
        }

        rendered.push(renderNode(node, i));
        i += 1;
    }

    return (
        <Box
            sx={{
                fontFamily: WORD_FONT_FAMILY,
                fontSize: WORD_BASE_FONT_SIZE,
                lineHeight: WORD_LINE_HEIGHT,
                '& > *:first-of-type': {
                    mt: 0,
                },
                '& > *:last-of-type': {
                    mb: 0,
                },
            }}
        >
            {rendered}
        </Box>
    );
}