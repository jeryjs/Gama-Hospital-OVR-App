'use client';

import { useState, useCallback, useRef, useMemo } from 'react';
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
import { ListStyleType, someList, toggleList } from '@platejs/list';
import {
    MARK_BOLD,
    MARK_ITALIC,
    MARK_UNDERLINE,
} from '../plate-plugins';

export function FloatingToolbar() {
    const editor = useEditorRef();
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

    const selectionSnapshot = useEditorSelector((editor) => {
        const selection = editor.selection;
        if (!selection) return null;
        return [
            selection.anchor.path.join('.'),
            selection.anchor.offset,
            selection.focus.path.join('.'),
            selection.focus.offset,
        ].join('|');
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
        (editor) => someList(editor, ListStyleType.Disc),
        []
    );
    const isNumberedList = useEditorSelector(
        (editor) => someList(editor, ListStyleType.Decimal),
        []
    );
    const hasLink = useEditorSelector(
        (editor) => editor.api.some({ match: { type: 'a' } }),
        []
    );

    const anchorEl = useMemo(() => {
        if (!hasSelection || !selectionSnapshot || typeof window === 'undefined') {
            return null;
        }

        const domSelection = window.getSelection();
        if (!domSelection || domSelection.rangeCount === 0) {
            return null;
        }

        const range = domSelection.getRangeAt(0);
        const rect = range.getBoundingClientRect();

        return {
            getBoundingClientRect: () =>
                new DOMRect(rect.left + rect.width / 2, rect.top, 1, 1),
            contextElement: document.body,
        };
    }, [hasSelection, selectionSnapshot]);

    const handleToggleMark = useCallback(
        (mark: string) => {
            if (!editor) return;
            editor.tf.toggleMark(mark);
            editor.tf.focus();
        },
        [editor]
    );

    const handleToggleBlock = useCallback(
        (listType: ListStyleType) => {
            if (!editor) return;
            toggleList(editor, { listStyleType: listType });
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
                                backgroundColor: (theme) => alpha(theme.palette.background.paper, 0.96),
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
                                        onClick={() => handleToggleBlock(ListStyleType.Disc)}
                                    />
                                    <ToolbarButton
                                        icon={<FormatListNumbered fontSize="small" />}
                                        tooltip="Numbered List"
                                        isActive={isNumberedList}
                                        onClick={() => handleToggleBlock(ListStyleType.Decimal)}
                                    />

                                    <Divider orientation="vertical" flexItem sx={{ mx: 0.25, height: 20 }} />

                                    <ToolbarButton
                                        icon={<LinkIcon sx={{
                                            fontSize: "small"
                                        }} />}
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
