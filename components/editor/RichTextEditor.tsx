'use client';

import { useState, useCallback, useMemo } from 'react';
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
    LinkElement,
} from './elements';
import type { EditorValue } from './plate-types';
import { createEmptyValue, isEmptyValue } from './plate-types';

export interface RichTextEditorProps {
    value?: EditorValue;
    onChange?: (value: EditorValue) => void;
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
    lic: ListItemElement,
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

    // Initialize with provided value or empty
    const initialValue = useMemo(() => {
        if (value && !isEmptyValue(value)) {
            return value;
        }
        return createEmptyValue();
    }, []);

    // Create editor with plugins and components
    const editor = usePlateEditor({
        plugins: editorPlugins,
        value: value || initialValue,
        components: editorComponents,
    });

    const handleChange = useCallback(
        ({ value: newValue }: { value: EditorValue }) => {
            onChange?.(newValue);
        },
        [onChange]
    );

    const handleFocus = useCallback(() => {
        setIsFocused(true);
        setIsEditing(true);
    }, []);

    const handleBlur = useCallback(() => {
        setIsFocused(false);
        // Delay setting isEditing to false to allow click events on toolbar
        setTimeout(() => {
            setIsEditing(false);
        }, 200);
    }, []);

    const handleContainerClick = useCallback(() => {
        if (!readOnly && !disabled && !isEditing) {
            setIsEditing(true);
        }
    }, [readOnly, disabled, isEditing]);

    const isInPreviewMode = !isEditing && !readOnly && !disabled;
    const showToolbar = isEditing && !readOnly && !disabled;

    return (
        <Box
            onClick={handleContainerClick}
            sx={{
                position: 'relative',
                border: '1px solid',
                borderColor: isFocused
                    ? 'primary.main'
                    : disabled
                        ? 'divider'
                        : 'divider',
                borderRadius: 2,
                backgroundColor: disabled
                    ? alpha('#141414', 0.5)
                    : '#141414',
                transition: 'all 0.2s ease',
                overflow: 'hidden',
                cursor: isInPreviewMode ? 'pointer' : 'text',
                '&:hover': {
                    borderColor: !disabled && !isFocused ? alpha('#00E599', 0.5) : undefined,
                },
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
                        }}
                    />
                </Box>

                {/* Floating Toolbar (appears on selection) */}
                {!readOnly && !disabled && <FloatingToolbar />}
            </Plate>

            {/* Click to edit hint */}
            {isInPreviewMode && isEmptyValue(value) && (
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
