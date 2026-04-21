'use client';

import { useState, useCallback, useMemo, useRef, type FocusEvent } from 'react';
import { Box, alpha } from '@mui/material';
import { Plate, PlateContent, usePlateEditor } from 'platejs/react';
import { editorPlugins } from './plate-plugins';
import { FixedToolbar } from './toolbar/FixedToolbar';
import { FloatingToolbar } from './toolbar/FloatingToolbar';
import {
    ParagraphElement,
    H1Element,
    H2Element,
    H3Element,
    BlockquoteElement,
    BulletedListElement,
    NumberedListElement,
    ListItemElement,
    ListItemContentElement,
    LinkElement,
} from './elements';
import type { EditorValue } from './plate-types';
import { deserializeFromMarkdown, serializeToMarkdown } from './utils';
import { WORD_BASE_FONT_SIZE, WORD_FONT_FAMILY, WORD_LINE_HEIGHT } from './word-styles';
import { RichTextPreview } from './RichTextPreview';

export interface RichTextEditorProps {
    value?: string;
    onChange?: (value: string) => void;
    placeholder?: string;
    readOnly?: boolean;
    minHeight?: number | string;
    maxHeight?: number | string;
    autoFocus?: boolean;
    disabled?: boolean;
}

// Component overrides for rendering elements
const editorComponents = {
    p: ParagraphElement,
    h1: H1Element,
    h2: H2Element,
    h3: H3Element,
    blockquote: BlockquoteElement,
    ul: BulletedListElement,
    ol: NumberedListElement,
    li: ListItemElement,
    lic: ListItemContentElement,
    a: LinkElement,
};

export function RichTextEditor({
    value,
    onChange,
    placeholder = 'Start typing...',
    readOnly = false,
    minHeight = 150,
    maxHeight = 400,
    autoFocus = false,
    disabled = false,
}: RichTextEditorProps) {
    const [isEditing, setIsEditing] = useState(false);
    const [isFocused, setIsFocused] = useState(false);
    const rootRef = useRef<HTMLDivElement | null>(null);

    const isEditorRelatedTarget = useCallback((target: EventTarget | null) => {
        if (!(target instanceof HTMLElement)) return false;

        if (rootRef.current?.contains(target)) return true;

        return Boolean(
            target.closest('.MuiPopper-root') ||
            target.closest('.MuiPopover-root') ||
            target.closest('.MuiDialog-root') ||
            target.closest('[role="listbox"]')
        );
    }, []);

    // Initialize with provided value or empty
    const initialValue = useMemo(() => deserializeFromMarkdown(value), [value]);

    // Create editor with plugins and components
    const editor = usePlateEditor({
        plugins: editorPlugins,
        value: initialValue,
        components: editorComponents,
    });

    const handleChange = useCallback(
        ({ value: newValue }: { value: EditorValue }) => {
            onChange?.(serializeToMarkdown(newValue));
        },
        [onChange]
    );

    const handleFocus = useCallback(() => {
        setIsFocused(true);
        setIsEditing(true);
    }, []);

    const handleBlur = useCallback((event: FocusEvent<HTMLElement>) => {
        setIsFocused(false);

        if (isEditorRelatedTarget(event.relatedTarget)) {
            return;
        }

        setTimeout(() => {
            if (isEditorRelatedTarget(document.activeElement)) {
                return;
            }
            setIsEditing(false);
        }, 200);
    }, [isEditorRelatedTarget]);

    const handleContainerClick = useCallback(() => {
        if (!readOnly && !disabled && !isEditing) {
            setIsEditing(true);
        }
    }, [readOnly, disabled, isEditing]);

    const isInPreviewMode = !isEditing && !readOnly && !disabled;
    const showToolbar = isEditing && !readOnly && !disabled;
    // return <RichTextPreview value={value} emptyText={placeholder} />;
    return (
        <Box
            ref={rootRef}
            onClick={handleContainerClick}
            sx={{
                position: 'relative',
                border: '1px solid',
                borderStyle: readOnly ? 'dashed' : 'solid',
                borderColor: disabled
                    ? 'ActiveBorder'
                    : isFocused && !readOnly
                        ? 'primary.main'
                        : 'divider',
                borderRadius: 2,
                backgroundColor: (theme) => {
                    if (disabled) {
                        return alpha(theme.palette.action.disabledBackground, 0.08);
                    }

                    if (readOnly) {
                        return theme.palette.background.paper;
                    }

                    return theme.palette.background.paper;
                },
                transition: 'all 0.2s ease',
                overflow: 'hidden',
                cursor: isInPreviewMode ? 'pointer' : 'text',
                '&:hover': !disabled && !readOnly && !isFocused
                    ? {
                        borderColor: (theme) => alpha(theme.palette.primary.main, 0.5),
                    }
                    : undefined,
            }}
        >
            <Plate
                editor={editor}
                onChange={handleChange}
                readOnly={readOnly || disabled}
            >
                {/* Fixed Toolbar */}
                {showToolbar && <FixedToolbar />}

                {/* Editor Content */}
                <Box
                    sx={{
                        minHeight,
                        maxHeight,
                        overflow: 'auto',
                        p: 2,
                        fontFamily: WORD_FONT_FAMILY,
                        fontSize: WORD_BASE_FONT_SIZE,
                        lineHeight: WORD_LINE_HEIGHT,
                    }}
                >
                    <PlateContent
                        autoFocus={autoFocus}
                        placeholder={placeholder}
                        onFocus={handleFocus}
                        onBlur={handleBlur}
                        style={{
                            outline: 'none',
                            minHeight: 'inherit',
                            fontFamily: WORD_FONT_FAMILY,
                            fontSize: WORD_BASE_FONT_SIZE,
                            lineHeight: String(WORD_LINE_HEIGHT),
                        }}
                    />
                </Box>

                {/* Floating Toolbar (appears on selection) */}
                {!readOnly && !disabled && <FloatingToolbar />}
            </Plate>

            {/* Click to edit hint */}
            {isInPreviewMode && !value?.trim() && (
                <Box
                    sx={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        color: 'text.disabled',
                        pointerEvents: 'none',
                        fontSize: '0.875rem',
                    }}
                >
                    Click to edit
                </Box>
            )}
        </Box>
    );
}
