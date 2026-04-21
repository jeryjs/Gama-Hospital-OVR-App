'use client';

import { CloseRounded, EditOutlined, Save } from '@mui/icons-material';
import {
    Box,
    Button,
    Card,
    CardContent,
    CardHeader,
    IconButton,
    Paper,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import { alpha, styled, type SxProps, type Theme } from '@mui/material/styles';
import type { ReactNode } from 'react';
import React from 'react';

const StyledButton = styled(Button)(({ theme }) => ({
    minWidth: 0,
    textTransform: 'none',
    color: theme.palette.text.secondary,
    borderColor: alpha(theme.palette.text.primary, 0.24),
    '&:hover': {
        borderColor: alpha(theme.palette.primary.main, 0.36),
        color: theme.palette.primary.main,
    },
}));

type SectionContainer = 'paper' | 'card';
type SectionTone = 'default' | 'primary' | 'secondary' | 'success' | 'warning' | 'error' | 'info';

export interface SectionProps {
    title: ReactNode;
    subtitle?: ReactNode;
    icon?: ReactNode;
    action?: ReactNode;
    children: ReactNode;
    container?: SectionContainer;
    tone?: SectionTone;
    sx?: SxProps<Theme>;
    headerSx?: SxProps<Theme>;
    contentSx?: SxProps<Theme>;
    mb?: number;
    elevation?: number;
}

export function Section({
    title,
    subtitle,
    icon,
    action,
    children,
    container = 'paper',
    tone = 'default',
    sx,
    headerSx,
    contentSx,
    mb = 3,
    elevation,
}: SectionProps) {

    const getTextContent = (node: ReactNode): string => {
        let text = '';
        if (typeof node === 'string') {
            text = node;
        } else if (Array.isArray(node)) {
            text = node.map(getTextContent).join(' ');
        } else if (React.isValidElement(node)) {
            // Type guard: only access props if they exist
            if ('props' in node && node.props && 'children' in (node.props as any))
                text = getTextContent((node.props as { children: ReactNode }).children);
        }
        return text.trim();
    };

    if (container === 'card') {
        return (
            <Card component={'section'} id={getTextContent(title).replaceAll(' ', '-')} elevation={elevation ?? 2} sx={sx}>
                <CardHeader
                    title={title}
                    subheader={subtitle}
                    action={action}
                    sx={(theme) => ({
                        ...(tone === 'default'
                            ? { bgcolor: 'background.default' }
                            : {
                                bgcolor: alpha(theme.palette[tone].main, 0.08),
                                color: `${tone}.main`,
                                borderBottom: 1,
                                borderColor: `${tone}.main`,
                                '& .MuiCardHeader-subheader': {
                                    color: `${tone}.main`,
                                    opacity: 0.9,
                                },
                            }),
                        ...headerSx as object,
                    })}
                />
                <CardContent sx={contentSx}>{children}</CardContent>
            </Card>
        );
    }

    return (
        <Paper component={'section'} id={getTextContent(title).replaceAll(' ', '-')} sx={{ p: 3, mb, ...sx as object }}>
            <Box
                sx={(theme) => ({
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    gap: 2,
                    pb: 2,
                    borderBottom: `2px solid ${theme.palette.divider}`,
                    ...headerSx as object,
                })}
            >
                <Typography
                    variant="h6"
                    sx={{
                        fontWeight: 700,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1,
                    }}
                >
                    {icon}
                    {title}
                </Typography>
                {action}
            </Box>

            <Box sx={{ mt: 3, ...contentSx as object }}>{children}</Box>
        </Paper>
    );
}

export interface SectionEditControlsProps {
    canEdit: boolean;
    isEditing: boolean;
    hasChanges: boolean;
    isSaving?: boolean;
    onStartEdit: () => void;
    onSave: () => void;
    onCancel: () => void;
    editLabel?: string;
    saveLabel?: string;
    sx?: SxProps<Theme>;
}

export function SectionEditControls({
    canEdit,
    isEditing,
    hasChanges,
    isSaving = false,
    onStartEdit,
    onSave,
    onCancel,
    editLabel = 'Edit',
    saveLabel = 'Save',
    sx,
}: SectionEditControlsProps) {
    if (!canEdit) {
        return null;
    }

    if (!isEditing) {
        return (
            <StyledButton
                variant="outlined"
                size="small"
                color='secondary'
                startIcon={<EditOutlined fontSize="small" />}
                onClick={onStartEdit}
                sx={sx}
            >
                {editLabel}
            </StyledButton>
        );
    }

    if (!hasChanges) {
        return (
            <StyledButton
                variant="outlined"
                size="small"
                startIcon={<CloseRounded fontSize="small" />}
                onClick={onCancel}
                sx={sx}
            >
                Cancel
            </StyledButton>
        );
    }

    return (
        <Stack direction="row" spacing={1} sx={{ alignItems: 'center', ...sx }}>
            <Tooltip title="Cancel">
                <IconButton
                    size="small"
                    onClick={onCancel}
                    sx={(theme) => ({
                        color: theme.palette.text.secondary,
                        '&:hover': {
                            color: theme.palette.primary.main,
                        },
                    })}
                >
                    <CloseRounded fontSize="small" />
                </IconButton>
            </Tooltip>
            <StyledButton
                variant="outlined"
                size="small"
                startIcon={<Save fontSize="small" />}
                onClick={onSave}
                disabled={isSaving}
            >
                {isSaving ? 'Saving...' : saveLabel}
            </StyledButton>
        </Stack>
    );
}
