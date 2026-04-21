'use client';

import { Typography } from '@mui/material';
import type { PlateElementProps } from 'platejs/react';
import { WORD_PARAGRAPH_SX, getWordListParagraphSx } from '../word-styles';

export function ParagraphElement({ children, attributes, element, editor, path }: PlateElementProps) {
    const listStyleType = (element as { listStyleType?: string })?.listStyleType;
    const indent = (element as { indent?: number })?.indent ?? 1;
    const isListRestart = (() => {
        if (!listStyleType || path.length === 0) return false;

        const previousPath = [...path];
        previousPath[previousPath.length - 1] -= 1;

        if (previousPath[previousPath.length - 1] < 0) {
            return true;
        }

        const previousNode = editor.api.node(previousPath)?.[0] as {
            type?: string;
            listStyleType?: string;
            indent?: number;
        } | undefined;

        return !(
            previousNode &&
            previousNode.type === 'p' &&
            previousNode.listStyleType === listStyleType &&
            (previousNode.indent ?? 1) === indent
        );
    })();

    return (
        <Typography
            component="p"
            variant="body1"
            {...attributes}
            sx={listStyleType ? getWordListParagraphSx(listStyleType, indent, isListRestart) : WORD_PARAGRAPH_SX}
        >
            {children}
        </Typography>
    );
}