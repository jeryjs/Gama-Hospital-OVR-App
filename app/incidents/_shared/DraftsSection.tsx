'use client';

import { deleteDraft, getUserDrafts, type LocalDraft } from '@/lib/utils/draft-storage';
import { Delete, Edit } from '@mui/icons-material';
import {
    alpha,
    Box,
    Card,
    CardContent,
    Chip,
    Divider,
    Grid,
    IconButton,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import { format } from 'date-fns';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

interface DraftsSectionProps {
    userId: number;
}

/**
 * Reusable drafts section for My Reports page
 * Displays locally-stored draft reports with edit/delete actions
 */
export function DraftsSection({ userId }: DraftsSectionProps) {
    const router = useRouter();
    const [drafts, setDrafts] = useState<LocalDraft[]>([]);
    const [loaded, setLoaded] = useState(false);

    // Load drafts from localStorage
    useEffect(() => {
        if (userId) {
            const userDrafts = getUserDrafts(userId);
            setDrafts(userDrafts);
            setLoaded(true);
        }
    }, [userId]);

    // Handle draft deletion
    const handleDeleteDraft = useCallback(
        (draftId: string, e: React.MouseEvent) => {
            e.stopPropagation();
            if (window.confirm('Are you sure you want to delete this draft?')) {
                deleteDraft(draftId);
                setDrafts((prev) => prev.filter((d) => d.id !== draftId));
            }
        },
        []
    );

    // Don't render if no drafts or not loaded
    if (!loaded || drafts.length === 0) {
        return null;
    }

    const totalDrafts = drafts.length;
    const displayedDrafts = drafts.slice(0, 6);

    return (
        <Card
            variant="outlined"
            sx={{
                borderColor: 'warning.main',
                backgroundColor: (theme) => alpha(theme.palette.warning.main, 0.05),
                mb: 3,
            }}
        >
            <CardContent>
                <Stack spacing={2}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <Edit color="warning" />
                        <Typography variant="h6" fontWeight={600}>
                            My Drafts
                        </Typography>
                        <Chip label={totalDrafts} size="small" color="warning" sx={{ ml: 1 }} />
                    </Stack>

                    <Typography variant="body2" color="text.secondary">
                        Continue working on your unsubmitted reports (saved locally)
                    </Typography>

                    <Divider />

                    <Grid container spacing={2}>
                        {displayedDrafts.map((draft) => (
                            <Grid key={draft.id} size={{ xs: 12, sm: 6, md: 4 }}>
                                <Card
                                    variant="outlined"
                                    sx={{
                                        cursor: 'pointer',
                                        transition: 'all 0.2s',
                                        '&:hover': {
                                            borderColor: 'primary.main',
                                            boxShadow: 2,
                                        },
                                    }}
                                    onClick={() => router.push(`/incidents/new?draft=${draft.id}`)}
                                >
                                    <CardContent sx={{ py: 1.5 }}>
                                        <Stack spacing={1}>
                                            <Stack
                                                direction="row"
                                                justifyContent="space-between"
                                                alignItems="center"
                                            >
                                                <Typography
                                                    variant="subtitle2"
                                                    fontWeight={600}
                                                    sx={{ fontSize: '0.75rem' }}
                                                >
                                                    {draft.id.slice(0, 20)}...
                                                </Typography>
                                                <Stack direction="row" alignItems="center" spacing={0.5}>
                                                    <Chip
                                                        label="Draft"
                                                        size="small"
                                                        color="warning"
                                                        sx={{ height: 20, fontSize: '0.7rem' }}
                                                    />
                                                    <Tooltip title="Delete draft">
                                                        <IconButton
                                                            size="small"
                                                            onClick={(e) => handleDeleteDraft(draft.id, e)}
                                                            sx={{ ml: 0.5 }}
                                                        >
                                                            <Delete fontSize="small" />
                                                        </IconButton>
                                                    </Tooltip>
                                                </Stack>
                                            </Stack>
                                            <Typography variant="body2" color="text.secondary" noWrap>
                                                {draft.occurrenceCategory?.replace(/_/g, ' ') || 'No category'}
                                            </Typography>
                                            <Typography variant="caption" color="text.secondary">
                                                Last updated:{' '}
                                                {format(new Date(draft.updatedAt), 'MMM dd, yyyy HH:mm')}
                                            </Typography>
                                        </Stack>
                                    </CardContent>
                                </Card>
                            </Grid>
                        ))}
                    </Grid>

                    {totalDrafts > 6 && (
                        <Typography variant="caption" color="text.secondary">
                            +{totalDrafts - 6} more drafts
                        </Typography>
                    )}
                </Stack>
            </CardContent>
        </Card>
    );
}
