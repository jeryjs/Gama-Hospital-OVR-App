'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import {
    Paper,
    Popper,
    ClickAwayListener,
    Divider,
    Dialog,
    DialogTitle,
    DialogContent,
    DialogActions,
    Button,
    TextField,
    Fade,
    alpha,
} from '@mui/material';
import {
    FormatBold,
    FormatItalic,
    FormatUnderlined,
    FormatListBulleted,
    FormatListNumbered,
    Link as LinkIcon,
} from '@mui/icons-material';
import { ToolbarButton } from './ToolbarButton';
import { useEditorRef, useEditorSelector } from 'platejs/react';
import {
    MARK_BOLD,
    MARK_ITALIC,
    MARK_UNDERLINE,
    ELEMENT_UL,
    ELEMENT_OL,
    ELEMENT_PARAGRAPH,
} from '../plate-plugins';

export function FloatingToolbar() {
    const editor = useEditorRef();
    const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
    const [linkDialogOpen, setLinkDialogOpen] = useState(false);
    const [linkUrl, setLinkUrl] = useState('');
    const toolbarRef = useRef<HTMLDivElement>(null);

    // Check if there's a selection
    const hasSelection = useEditorSelector((editor) => {
        const { selection } = editor;
        if (!selection) return false;
        const isCollapsed = selection.anchor.offset === selection.focus.offset &&
            JSON.stringify(selection.anchor.path) === JSON.stringify(selection.focus.path);
        return !isCollapsed;
    }, []);

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

    // Update toolbar position when selection changes
    useEffect(() => {
        if (!hasSelection) {
            setAnchorEl(null);
            return;
        }

        const domSelection = window.getSelection();
        if (!domSelection || domSelection.rangeCount === 0) {
            setAnchorEl(null);
            return;
        }

        const range = domSelection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        // Create a virtual element for positioning
        const virtualEl = document.createElement('div');
        virtualEl.style.position = 'fixed';
        virtualEl.style.left = `${rect.left + rect.width / 2}px`;
        virtualEl.style.top = `${rect.top}px`;
        virtualEl.style.width = '1px';
        virtualEl.style.height = '1px';
        virtualEl.style.pointerEvents = 'none';
        document.body.appendChild(virtualEl);

        setAnchorEl(virtualEl);

        return () => {
            if (virtualEl.parentNode) {
                virtualEl.parentNode.removeChild(virtualEl);
            }
        };
    }, [hasSelection]);

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
            editor.tf.unwrapNodes({ match: { type: 'a' } });
            editor.tf.focus();
        } else {
            setLinkUrl('');
            setLinkDialogOpen(true);
        }
    }, [editor, hasLink]);

    const handleLinkInsert = useCallback(() => {
        if (linkUrl && editor) {
            editor.tf.wrapNodes(
                { type: 'a', url: linkUrl, children: [] },
                { split: true }
            );
            editor.tf.focus();
        }
        setLinkDialogOpen(false);
        setLinkUrl('');
    }, [editor, linkUrl]);

    const handleClickAway = useCallback((event: MouseEvent | TouchEvent) => {
        // Don't close if clicking the toolbar itself or link dialog
        if (toolbarRef.current?.contains(event.target as Node) || linkDialogOpen) {
            return;
        }
    }, [linkDialogOpen]);

    if (!anchorEl || !hasSelection) {
        return null;
    }

    return (
        <>
            <Popper
                open={Boolean(anchorEl) && hasSelection}
                anchorEl={anchorEl}
                placement="top"
                transition
                modifiers={[
                    {
                        name: 'offset',
                        options: {
                            offset: [0, 8],
                        },
                    },
                    {
                        name: 'preventOverflow',
                        options: {
                            boundary: 'viewport',
                            padding: 8,
                        },
                    },
                ]}
                sx={{ zIndex: 1300 }}
            >
                {({ TransitionProps }) => (
                    <Fade {...TransitionProps} timeout={150}>
                        <Paper
                            ref={toolbarRef}
                            elevation={8}
                            sx={{
                                display: 'flex',
                                alignItems: 'center',
                                gap: 0.25,
                                p: 0.5,
                                backgroundColor: alpha('#1A1A1A', 0.95),
                                backdropFilter: 'blur(8px)',
                                border: '1px solid',
                                borderColor: 'divider',
                                borderRadius: 1.5,
                            }}
                        >
                            <ClickAwayListener onClickAway={handleClickAway}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
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

                                    <Divider orientation="vertical" flexItem sx={{ mx: 0.25, height: 20 }} />

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

                                    <Divider orientation="vertical" flexItem sx={{ mx: 0.25, height: 20 }} />

                                    <ToolbarButton
                                        icon={<LinkIcon fontSize="small" />}
                                        tooltip={hasLink ? 'Remove Link' : 'Insert Link (Ctrl+K)'}
                                        isActive={hasLink}
                                        onClick={handleLinkClick}
                                    />
                                </div>
                            </ClickAwayListener>
                        </Paper>
                    </Fade>
                )}
            </Popper>

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
