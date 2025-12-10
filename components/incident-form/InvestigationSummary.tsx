/**
 * @fileoverview Investigation Summary - Display completed investigation details
 * 
 * Shows investigation findings, investigators, and links to full investigation
 */

'use client';

import type { InvestigationWithUsers } from '@/lib/api/schemas';
import {
    Avatar,
    Box,
    Button,
    Chip,
    Paper,
    Stack,
    Typography,
    alpha,
} from '@mui/material';
import { RichTextPreview, truncateToPlainText, type EditorValue } from '@/components/editor';
import {
    CheckCircle as CompleteIcon,
    OpenInNew as OpenIcon,
    Schedule as PendingIcon,
} from '@mui/icons-material';
import Link from 'next/link';

interface InvestigationSummaryProps {
    investigation: InvestigationWithUsers;
    incidentId: string;
}

/**
 * Helper to parse rich text value from string or EditorValue
 */
function parseRichTextValue(value: unknown): EditorValue | undefined {
    if (!value) return undefined;
    if (typeof value === 'string') {
        try {
            return JSON.parse(value);
        } catch {
            return undefined;
        }
    }
    return value as EditorValue;
}

/**
 * Investigation Summary Component
 * Displays a summary of investigation with investigators and findings
 */
export function InvestigationSummary({ investigation, incidentId }: InvestigationSummaryProps) {
    if (!investigation) return null;

    const isSubmitted = Boolean(investigation.submittedAt);
    const investigators = investigation.investigatorUsers || [];

    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                mb: 3,
                borderRadius: 2,
                bgcolor: isSubmitted ? alpha('#10B981', 0.05) : alpha('#F59E0B', 0.05),
                border: '1px solid',
                borderColor: isSubmitted ? alpha('#10B981', 0.2) : alpha('#F59E0B', 0.2),
            }}
        >
            <Stack direction="row" spacing={1} alignItems="center" sx={{ mb: 2 }}>
                {isSubmitted ? (
                    <CompleteIcon sx={{ color: 'success.main' }} />
                ) : (
                    <PendingIcon sx={{ color: 'warning.main' }} />
                )}
                <Typography variant="h6" fontWeight={600}>
                    Investigation {isSubmitted ? 'Summary' : 'In Progress'}
                </Typography>
                <Chip
                    label={isSubmitted ? 'Completed' : 'Pending'}
                    size="small"
                    color={isSubmitted ? 'success' : 'warning'}
                />
            </Stack>

            <Box sx={{ p: 2, bgcolor: 'background.paper', borderRadius: 1 }}>
                {/* Investigators */}
                <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                    Investigators
                </Typography>
                <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap sx={{ mb: 2 }}>
                    {investigators.length > 0 ? (
                        investigators.map((investigator) => (
                            <Chip
                                key={investigator.id}
                                avatar={
                                    <Avatar
                                        src={investigator.profilePicture || undefined}
                                        sx={{ width: 24, height: 24 }}
                                    >
                                        {investigator.firstName?.[0] || '?'}
                                    </Avatar>
                                }
                                label={`${investigator.firstName || ''} ${investigator.lastName || ''}`.trim() || investigator.email}
                                size="small"
                                variant="outlined"
                            />
                        ))
                    ) : (
                        <Typography variant="body2" color="text.secondary">
                            No investigators assigned
                        </Typography>
                    )}
                </Stack>

                {/* Findings snippet (if submitted) */}
                {isSubmitted && investigation.findings && (
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                            Findings
                        </Typography>
                        <Box
                            sx={{
                                overflow: 'hidden',
                                '& > div': {
                                    display: '-webkit-box',
                                    WebkitLineClamp: 3,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                }
                            }}
                        >
                            <RichTextPreview
                                value={parseRichTextValue(investigation.findings)}
                                emptyText="No findings"
                            />
                        </Box>
                    </Box>
                )}

                {/* Problems Identified snippet (if submitted) */}
                {isSubmitted && investigation.problemsIdentified && (
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                            Problems Identified
                        </Typography>
                        <Box
                            sx={{
                                overflow: 'hidden',
                                '& > div': {
                                    display: '-webkit-box',
                                    WebkitLineClamp: 2,
                                    WebkitBoxOrient: 'vertical',
                                    overflow: 'hidden',
                                }
                            }}
                        >
                            <RichTextPreview
                                value={parseRichTextValue(investigation.problemsIdentified)}
                                emptyText="No problems identified"
                            />
                        </Box>
                    </Box>
                )}

                {/* Cause Classification (if available) */}
                {investigation.causeClassification && (
                    <Box sx={{ mb: 2 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                            Cause Classification
                        </Typography>
                        <Chip
                            label={investigation.causeClassification}
                            size="small"
                            color="primary"
                            variant="outlined"
                        />
                    </Box>
                )}

                {/* Link to full investigation */}
                <Button
                    component={Link}
                    href={`/incidents/investigations/${investigation.id}`}
                    size="small"
                    endIcon={<OpenIcon />}
                    sx={{ mt: 1 }}
                >
                    View Full Investigation
                </Button>
            </Box>
        </Paper>
    );
}
