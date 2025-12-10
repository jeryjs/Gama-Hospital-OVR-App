'use client';

import { useState, useCallback } from 'react';
import {
    Box,
    Select,
    MenuItem,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    alpha,
} from '@mui/material';
import {
    FormatBold,
    FormatItalic,
    FormatUnderlined,
    FormatListBulleted,
    FormatListNumbered,
    Link as LinkIcon,
    FormatQuote,
} from '@mui/icons-material';
import { ToolbarButton } from './ToolbarButton';
import { useEditorRef, useEditorSelector } from 'platejs/react';
import {
    MARK_BOLD,
    MARK_ITALIC,
    MARK_UNDERLINE,
    ELEMENT_H1,
    ELEMENT_H2,
    ELEMENT_H3,
    ELEMENT_PARAGRAPH,
    ELEMENT_BLOCKQUOTE,
    ELEMENT_UL,
    ELEMENT_OL,
} from '../plate-plugins';

export function FixedToolbar() {
    const editor = useEditorRef();
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');

    // Check active mark states using editor.api.mark
    const isBold = useEditorSelector(
        (editor) => !!editor.api.mark(MARK_BOLD),
        []
    );
    const isItalic = useEditorSelector(
        (editor) => !!editor.api.mark(MARK_ITALIC),
        []
    );
    const isUnderline = useEditorSelector(
        (editor) => !!editor.api.mark(MARK_UNDERLINE),
        []
    );

    // Check active block states
    const isBlockquote = useEditorSelector(
        (editor) => editor.api.some({ match: { type: ELEMENT_BLOCKQUOTE } }),
        []
    );
    const isBulletList = useEditorSelector(
        (editor) => editor.api.some({ match: { type: ELEMENT_UL } }),
        []
    );
    const isNumberedList = useEditorSelector(
        (editor) => editor.api.some({ match: { type: ELEMENT_OL } }),
        []
    );
    const hasLink = useEditorSelector(
        (editor) => editor.api.some({ match: { type: 'a' } }),
        []
    );

    // Determine current block type for heading selector
    const currentBlockType = useEditorSelector((editor) => {
        if (editor.api.some({ match: { type: ELEMENT_H1 } })) return ELEMENT_H1;
        if (editor.api.some({ match: { type: ELEMENT_H2 } })) return ELEMENT_H2;
        if (editor.api.some({ match: { type: ELEMENT_H3 } })) return ELEMENT_H3;
        return ELEMENT_PARAGRAPH;
    }, []);

    const handleBlockChange = useCallback(
        (value: string) => {
            if (!editor) return;
            editor.tf.setNodes({ type: value }, { match: (n) => 'type' in n });
            editor.tf.focus();
        },
        [editor]
    );

    const handleToggleMark = useCallback(
        (mark: string) => {
            if (!editor) return;
            editor.tf.toggleMark(mark);
            editor.tf.focus();
        },
        [editor]
    );

    const handleToggleBlock = useCallback(
        (blockType: string) => {
            if (!editor) return;
            const isActive = editor.api.some({ match: { type: blockType } });
            if (isActive) {
                editor.tf.setNodes({ type: ELEMENT_PARAGRAPH }, { match: (n) => 'type' in n });
            } else {
                editor.tf.setNodes({ type: blockType }, { match: (n) => 'type' in n });
            }
            editor.tf.focus();
        },
        [editor]
    );

    const handleLinkClick = useCallback(() => {
        if (hasLink) {
            // Remove link - unwrap the link node
            editor.tf.unwrapNodes({ match: { type: 'a' } });
            editor.tf.focus();
        } else {
            setLinkUrl('');
            setLinkDialogOpen(true);
        }
    }, [editor, hasLink]);

    const handleLinkInsert = useCallback(() => {
        if (linkUrl && editor) {
            // Wrap selection in link
            editor.tf.wrapNodes(
                { type: 'a', url: linkUrl, children: [] },
                { split: true }
            );
            editor.tf.focus();
        }
        setLinkDialogOpen(false);
        setLinkUrl('');
    }, [editor, linkUrl]);

    return (
        <>
            <Box
                sx={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 0.5,
                    p: 0.75,
                    borderBottom: '1px solid',
                    borderColor: 'divider',
                    backgroundColor: alpha('#141414', 0.5),
                    flexWrap: 'wrap',
                }}
            >
                {/* Block Type Selector */}
                <Select
                    size="small"
                    value={currentBlockType}
                    onChange={(e) => handleBlockChange(e.target.value)}
                    sx={{
                        minWidth: 110,
                        height: 32,
                        fontSize: '0.8125rem',
                        '& .MuiSelect-select': {
                            py: 0.5,
                        },
                    }}
                >
                    <MenuItem value={ELEMENT_PARAGRAPH}>Paragraph</MenuItem>
                    <MenuItem value={ELEMENT_H1}>Heading 1</MenuItem>
                    <MenuItem value={ELEMENT_H2}>Heading 2</MenuItem>
                    <MenuItem value={ELEMENT_H3}>Heading 3</MenuItem>
                </Select>

                <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

                {/* Text Formatting */}
                <ToolbarButton
                    icon={<FormatBold fontSize="small" />}
                    tooltip="Bold (Ctrl+B)"
                    isActive={isBold}
                    onClick={() => handleToggleMark(MARK_BOLD)}
                />
                <ToolbarButton
                    icon={<FormatItalic fontSize="small" />}
                    tooltip="Italic (Ctrl+I)"
                    isActive={isItalic}
                    onClick={() => handleToggleMark(MARK_ITALIC)}
                />
                <ToolbarButton
                    icon={<FormatUnderlined fontSize="small" />}
                    tooltip="Underline (Ctrl+U)"
                    isActive={isUnderline}
                    onClick={() => handleToggleMark(MARK_UNDERLINE)}
                />

                <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

                {/* Block Formatting */}
                <ToolbarButton
                    icon={<FormatQuote fontSize="small" />}
                    tooltip="Blockquote"
                    isActive={isBlockquote}
                    onClick={() => handleToggleBlock(ELEMENT_BLOCKQUOTE)}
                />
                <ToolbarButton
                    icon={<FormatListBulleted fontSize="small" />}
                    tooltip="Bullet List"
                    isActive={isBulletList}
                    onClick={() => handleToggleBlock(ELEMENT_UL)}
                />
                <ToolbarButton
                    icon={<FormatListNumbered fontSize="small" />}
                    tooltip="Numbered List"
                    isActive={isNumberedList}
                    onClick={() => handleToggleBlock(ELEMENT_OL)}
                />

                <Divider orientation="vertical" flexItem sx={{ mx: 0.5 }} />

                {/* Link */}
                <ToolbarButton
                    icon={<LinkIcon fontSize="small" />}
                    tooltip={hasLink ? 'Remove Link' : 'Insert Link (Ctrl+K)'}
                    isActive={hasLink}
                    onClick={handleLinkClick}
                />
            </Box>

            {/* Link Dialog */}
            <Dialog
                open={linkDialogOpen}
                onClose={() => setLinkDialogOpen(false)}
                maxWidth="xs"
                fullWidth
            >
                <DialogTitle sx={{ pb: 1 }}>Insert Link</DialogTitle>
                <DialogContent>
                    <TextField
                        autoFocus
                        fullWidth
                        size="small"
                        label="URL"
                        placeholder="https://example.com"
                        value={linkUrl}
                        onChange={(e) => setLinkUrl(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                handleLinkInsert();
                            }
                        }}
                        sx={{ mt: 1 }}
                    />
                </DialogContent>
                <DialogActions>
                    <Button onClick={() => setLinkDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleLinkInsert} variant="contained" disabled={!linkUrl}>
                        Insert
                    </Button>
                </DialogActions>
            </Dialog>
        </>
    );
}
