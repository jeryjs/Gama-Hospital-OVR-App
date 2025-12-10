'use client';

import { Box, Typography, Link } from '@mui/material';
import type { EditorValue, TElement, TText } from './plate-types';
import { isEmptyValue } from './plate-types';

interface RichTextPreviewProps {
    value?: EditorValue | string | TElement | null;
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
                    variant="h5"
                    component="h1"
                    sx={{
                        fontWeight: 700,
                        mt: index > 0 ? 2 : 0,
                        mb: 1,
                        color: 'text.primary',
                    }}
                >
                    {children}
                </Typography>
            );

        case 'h2':
            return (
                <Typography
                    key={index}
                    variant="h6"
                    component="h2"
                    sx={{
                        fontWeight: 600,
                        mt: index > 0 ? 1.5 : 0,
                        mb: 0.75,
                        color: 'text.primary',
                    }}
                >
                    {children}
                </Typography>
            );

        case 'h3':
            return (
                <Typography
                    key={index}
                    variant="subtitle1"
                    component="h3"
                    sx={{
                        fontWeight: 600,
                        mt: index > 0 ? 1.25 : 0,
                        mb: 0.5,
                        color: 'text.primary',
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
                    sx={{
                        borderLeft: '4px solid',
                        borderColor: 'primary.main',
                        pl: 2,
                        py: 0.5,
                        my: 1.5,
                        mx: 0,
                        backgroundColor: 'rgba(0, 229, 153, 0.05)',
                        borderRadius: '0 8px 8px 0',
                        fontStyle: 'italic',
                        color: 'text.secondary',
                    }}
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
                        pl: 3,
                        my: 1,
                        '& > li::marker': {
                            color: 'primary.main',
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
                        pl: 3,
                        my: 1,
                        '& > li::marker': {
                            color: 'primary.main',
                            fontWeight: 600,
                        },
                    }}
                >
                    {children}
                </Box>
            );

        case 'li':
        case 'lic':
            return (
                <Box
                    key={index}
                    component="li"
                    sx={{
                        py: 0.25,
                        lineHeight: 1.7,
                        color: 'text.primary',
                    }}
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
                    sx={{
                        color: 'primary.main',
                        textDecoration: 'underline',
                        textDecorationColor: 'rgba(0, 229, 153, 0.4)',
                        '&:hover': {
                            textDecorationColor: 'primary.main',
                        },
                    }}
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
                    variant="body2"
                    component="p"
                    sx={{
                        my: 0.5,
                        lineHeight: 1.7,
                        color: 'text.primary',
                        '&:first-of-type': {
                            mt: 0,
                        },
                        '&:last-of-type': {
                            mb: 0,
                        },
                    }}
                >
                    {children}
                </Typography>
            );
    }
}

/**
 * Helper to normalize input to an array of nodes.
 * Accepts:
 * - EditorValue (array)
 * - JSON string (which parses to array or single node)
 * - single element node object
 * - fallback: wrap plain string into a paragraph text node
 */
function normalizeValueToNodes(value: EditorValue | string | TElement | null | undefined): unknown[] {
    if (!value) return [];

    // If it's already an array of nodes (EditorValue)
    if (Array.isArray(value)) return value;

    // If it's a string, attempt JSON parse for serialized node(s)
    if (typeof value === 'string') {
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) return parsed;
            if (isElementNode(parsed)) return [parsed];
            // Not an element; render text inside a paragraph node
            return [
                {
                    type: 'p',
                    children: [{ text: String(parsed) }],
                },
            ];
        } catch {
            // Not JSON — treat as plain text
            return [
                {
                    type: 'p',
                    children: [{ text: value }],
                },
            ];
        }
    }

    // If it's a single element node, wrap it into an array
    if (isElementNode(value)) {
        return [value];
    }

    // Unknown shape: return empty
    return [];
}

export function RichTextPreview({
    value,
    emptyText = 'No content',
}: RichTextPreviewProps) {
    // If it's a Plate Editor value (array) and empty, show emptyText.
    // If a string or other formats are passed, we still handle them below.
    if (isEmptyValue(Array.isArray(value) ? (value as EditorValue) : undefined)) {
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

    if (!nodes || nodes.length === 0) {
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