'use client';

import { Box, Typography, Link, alpha } from '@mui/material';
import type { EditorValue, TElement, TText } from './plate-types';
import { deserializeFromMarkdown } from './utils';
import {
    WORD_BASE_FONT_SIZE,
    WORD_FONT_FAMILY,
    WORD_HEADING_SX,
    WORD_LINE_HEIGHT,
    WORD_LIST_BASE_SX,
    WORD_LIST_ITEM_CONTENT_SX,
    WORD_LIST_ITEM_SX,
    WORD_PARAGRAPH_SX,
    getWordListParagraphSx,
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
            return (
                <Box
                    key={index}
                    component="ul"
                    sx={{
                        ...WORD_LIST_BASE_SX,
                        listStyleType: 'disc',
                        '& > *::marker': {
                            color: 'text.primary',
                        },
                    }}
                >
                    {children}
                </Box>
            );

        case 'ol':
            return (
                <Box
                    key={index}
                    component="ol"
                    sx={{
                        ...WORD_LIST_BASE_SX,
                        listStyleType: 'decimal',
                        '& > *::marker': {
                            color: 'text.primary',
                        },
                    }}
                >
                    {children}
                </Box>
            );

        case 'li':
            return (
                <Box
                    key={index}
                    component="li"
                    sx={WORD_LIST_ITEM_SX}
                >
                    {children}
                </Box>
            );

        case 'lic':
            return (
                <Box
                    key={index}
                    component="span"
                    sx={WORD_LIST_ITEM_CONTENT_SX}
                >
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
            if (node.type === 'p' && typeof (node as { listStyleType?: unknown }).listStyleType === 'string') {
                const listNode = node as TElement & { listStyleType: string; indent?: number };

                return (
                    <Typography
                        key={index}
                        variant="body1"
                        component="p"
                        sx={getWordListParagraphSx(listNode.listStyleType, listNode.indent ?? 1)}
                    >
                        {children}
                    </Typography>
                );
            }

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
            {nodes.map((node, index) => renderNode(node, index))}
        </Box>
    );
}