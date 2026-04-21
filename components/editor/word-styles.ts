'use client';

export const WORD_FONT_FAMILY = 'Calibri, "Segoe UI", Arial, sans-serif';
export const WORD_BASE_FONT_SIZE = '11pt';
export const WORD_LINE_HEIGHT = 1.5;

export const WORD_HEADING_SX = {
    h1: {
        fontFamily: WORD_FONT_FAMILY,
        fontSize: '16pt',
        fontWeight: 700,
        mt: 1.75,
        mb: 0.75,
        lineHeight: 1.3,
        color: 'text.primary',
    },
    h2: {
        fontFamily: WORD_FONT_FAMILY,
        fontSize: '13pt',
        fontWeight: 700,
        mt: 1.5,
        mb: 0.6,
        lineHeight: 1.35,
        color: 'text.primary',
    },
    h3: {
        fontFamily: WORD_FONT_FAMILY,
        fontSize: '12pt',
        fontWeight: 700,
        mt: 1.25,
        mb: 0.5,
        lineHeight: 1.35,
        color: 'text.primary',
    },
} as const;

export const WORD_PARAGRAPH_SX = {
    fontFamily: WORD_FONT_FAMILY,
    fontSize: WORD_BASE_FONT_SIZE,
    lineHeight: WORD_LINE_HEIGHT,
    my: 0.625,
    color: 'text.primary',
    '&:first-of-type': {
        mt: 0,
    },
    '&:last-of-type': {
        mb: 0,
    },
} as const;

export const WORD_LIST_BASE_SX = {
    fontFamily: WORD_FONT_FAMILY,
    fontSize: WORD_BASE_FONT_SIZE,
    lineHeight: WORD_LINE_HEIGHT,
    pl: 4,
    my: 0.75,
    '& > *': {
        display: 'list-item',
        py: 0.15,
        lineHeight: WORD_LINE_HEIGHT,
    },
    '& > li > p': {
        my: 0,
    },
    '& > li > span': {
        lineHeight: WORD_LINE_HEIGHT,
    },
} as const;

export const WORD_LIST_ITEM_SX = {
    py: 0.15,
    lineHeight: WORD_LINE_HEIGHT,
    color: 'text.primary',
} as const;

export const WORD_LIST_ITEM_CONTENT_SX = {
    display: 'inline',
    lineHeight: WORD_LINE_HEIGHT,
    color: 'text.primary',
} as const;

export function getWordListParagraphSx(listStyleType: string, indent = 1) {
    return {
        ...WORD_PARAGRAPH_SX,
        display: 'list-item',
        listStyleType,
        listStylePosition: 'outside',
        ml: `${Math.max(indent - 1, 0) * 1.5}em`,
        pl: 0,
        '&::marker': {
            color: 'text.primary',
            fontWeight: listStyleType === 'decimal' ? 600 : 400,
        },
    } as const;
}