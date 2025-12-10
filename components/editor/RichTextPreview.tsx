'use client';

import { Box, Typography, Link } from '@mui/material';
import type { EditorValue, TElement, TText } from './plate-types';
import { isEmptyValue } from './plate-types';

interface RichTextPreviewProps {
    value?: EditorValue;
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

        case 'a':
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

export function RichTextPreview({
    value,
    emptyText = 'No content',
}: RichTextPreviewProps) {
    if (isEmptyValue(value)) {
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
            {value?.map((node, index) => renderNode(node, index))}
        </Box>
    );
}
