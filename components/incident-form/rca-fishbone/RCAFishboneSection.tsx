/**
 * @fileoverview Main RCA & Fishbone Section Container
 */

'use client';

import { Save } from '@mui/icons-material';
import {
    Alert,
    Box,
    Button,
    Stack,
    Tab,
    Tabs,
} from '@mui/material';
import { useState, useEffect } from 'react';
import { RCASummaryTab } from './RCASummaryTab';
import { FishboneDiagram } from './FishboneDiagram';
import { Section } from '@/components/shared';
import type { RCAAnalysis, FishboneAnalysis } from './types';
import {
    parseRCAAnalysis,
    parseFishboneAnalysis,
    createEmptyRCA,
    createEmptyFishbone,
    validateRCA,
    validateFishbone,
} from './utils';

interface RCAFishboneSectionProps {
    investigationId: number;
    initialRCA?: string | null;
    initialFishbone?: string | null;
    onSave?: (rca: string | null, fishbone: string | null) => Promise<void>;
    disabled?: boolean;
}

export function RCAFishboneSection({
    investigationId,
    initialRCA,
    initialFishbone,
    onSave,
    disabled = false,
}: RCAFishboneSectionProps) {
    const [activeTab, setActiveTab] = useState(0);
    const [rca, setRca] = useState<RCAAnalysis>(() =>
        parseRCAAnalysis(initialRCA) || createEmptyRCA()
    );
    const [fishbone, setFishbone] = useState<FishboneAnalysis>(() =>
        parseFishboneAnalysis(initialFishbone) || createEmptyFishbone()
    );
    const [saving, setSaving] = useState(false);
    const [saveError, setSaveError] = useState<string | null>(null);
    const [hasChanges, setHasChanges] = useState(false);

    // Track changes
    useEffect(() => {
        const currentRCA = JSON.stringify(rca);
        const currentFishbone = JSON.stringify(fishbone);
        const initialRCAStr = initialRCA || JSON.stringify(createEmptyRCA());
        const initialFishboneStr = initialFishbone || JSON.stringify(createEmptyFishbone());

        setHasChanges(currentRCA !== initialRCAStr || currentFishbone !== initialFishboneStr);
    }, [rca, fishbone, initialRCA, initialFishbone]);

    const handleSave = async () => {
        if (!onSave) return;

        // Validate based on active tab
        if (activeTab === 0) {
            const validation = validateRCA(rca);
            if (!validation.valid) {
                setSaveError(validation.errors.join(', '));
                return;
            }
        } else if (activeTab === 1) {
            const validation = validateFishbone(fishbone);
            if (!validation.valid) {
                setSaveError(validation.errors.join(', '));
                return;
            }
        }

        setSaving(true);
        setSaveError(null);

        try {
            const rcaStr = JSON.stringify(rca);
            const fishboneStr = JSON.stringify(fishbone);
            await onSave(rcaStr, fishboneStr);
            setHasChanges(false);
        } catch (error) {
            setSaveError(error instanceof Error ? error.message : 'Failed to save analysis');
        } finally {
            setSaving(false);
        }
    };

    return (
        <Section
            container="card"
            title="Advanced Analysis"
            subtitle="Root Cause Analysis and Fishbone Diagram"
            tone="primary"
            action={
                hasChanges && !disabled ? (
                    <Button
                        variant="contained"
                        size="small"
                        startIcon={<Save />}
                        onClick={handleSave}
                        disabled={saving}
                    >
                        {saving ? 'Saving...' : 'Save Analysis'}
                    </Button>
                ) : undefined
            }
        >
            <Stack spacing={3}>
                {disabled && (
                    <Alert severity="info">
                        Advanced analysis is in read-only mode.
                    </Alert>
                )}

                {saveError && (
                    <Alert severity="error" onClose={() => setSaveError(null)}>
                        {saveError}
                    </Alert>
                )}

                {/* Tab Navigation */}
                <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
                    <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
                        <Tab label="• RCA Summary" />
                        <Tab label="• Fishbone Diagram" />
                    </Tabs>
                </Box>

                {/* Tab Content */}
                {activeTab === 0 && (
                    <RCASummaryTab
                        rca={rca}
                        onChange={setRca}
                        disabled={disabled}
                    />
                )}

                {activeTab === 1 && (
                    <FishboneDiagram
                        fishbone={fishbone}
                        onChange={setFishbone}
                        disabled={disabled}
                    />
                )}
            </Stack>
        </Section>
    );
}
