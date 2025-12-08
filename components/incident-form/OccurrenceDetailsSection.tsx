'use client';

import { PERSON_INVOLVED_OPTIONS } from '@/lib/constants';
import { getTaxonomyItem, loadTaxonomy, type TaxonomyData } from '@/lib/services/taxonomyService';
import { Person, Place, Warning } from '@mui/icons-material';
import { Box, Chip, Grid, Paper, Typography, alpha } from '@mui/material';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';
import type { OVRReportWithRelations } from '../../app/incidents/_shared/types';

interface Props {
  incident: OVRReportWithRelations;
}

const InfoRow = ({ label, value }: { label: string; value: string | null | undefined }) => (
  <Box>
    <Typography variant="caption" color="text.secondary" fontWeight={600}>
      {label}
    </Typography>
    <Typography variant="body2">{value || 'N/A'}</Typography>
  </Box>
);

export function OccurrenceDetailsSection({ incident }: Props) {
  const [taxonomy, setTaxonomy] = useState<TaxonomyData | null>(null);

  useEffect(() => {
    loadTaxonomy().then(setTaxonomy).catch(console.error);
  }, []);

  const taxonomyItem = taxonomy
    ? getTaxonomyItem(
      taxonomy,
      incident.occurrenceCategory,
      incident.occurrenceSubcategory,
      incident.occurrenceDetail || undefined
    )
    : null;

  const personInvolvedLabel = PERSON_INVOLVED_OPTIONS.find(
    (p) => p.value === incident.personInvolved
  )?.label;

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Typography
        variant="h6"
        fontWeight={700}
        gutterBottom
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1,
          pb: 2,
          borderBottom: (theme) => `2px solid ${theme.palette.divider}`,
        }}
      >
        <Place /> Occurrence Details
      </Typography>

      <Grid container spacing={3} sx={{ mt: 1 }}>
        <Grid size={{ xs: 12, md: 4 }}>
          <InfoRow
            label="Date"
            value={format(new Date(incident.occurrenceDate), 'MMMM dd, yyyy')}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <InfoRow
            label="Time"
            value={format(new Date(`2000-01-01T${incident.occurrenceTime}`), 'HH:mm')}
          />
        </Grid>
        <Grid size={{ xs: 12, md: 4 }}>
          <InfoRow
            label="Location"
            value={incident.location?.name}
          />
        </Grid>
        {incident.specificLocation && (
          <Grid size={{ xs: 12 }}>
            <InfoRow label="Specific Location" value={incident.specificLocation} />
          </Grid>
        )}
      </Grid>

      <Box sx={{ mt: 3 }}>
        <Typography variant="caption" color="text.secondary" fontWeight={600}>
          Person Involved
        </Typography>
        <Box sx={{ mt: 1 }}>
          <Chip
            icon={<Person />}
            label={personInvolvedLabel}
            sx={{ mr: 1 }}
          />
          {incident.isSentinelEvent && (
            <Chip
              icon={<Warning />}
              label="Sentinel Event"
              color="error"
              variant="outlined"
            />
          )}
        </Box>
        {incident.isSentinelEvent && incident.sentinelEventDetails && (
          <Box
            sx={{
              mt: 2,
              p: 2,
              bgcolor: (theme) => alpha(theme.palette.error.main, 0.1),
              borderRadius: 1,
              borderLeft: (theme) => `4px solid ${theme.palette.error.main}`,
            }}
          >
            <Typography variant="caption" fontWeight={600} color="error.main">
              Sentinel Event Details:
            </Typography>
            <Typography variant="body2" sx={{ mt: 0.5 }}>
              {incident.sentinelEventDetails}
            </Typography>
          </Box>
        )}
      </Box>

      {/* Staff Involved - Removed, now handled by PersonInvolvedSection */}

      {/* Classification */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="subtitle2" fontWeight={700} gutterBottom>
          Classification
        </Typography>
        <Grid container spacing={2}>
          <Grid size={{ xs: 12, md: taxonomyItem?.detail ? 4 : 6 }}>
            <InfoRow label="Category" value={taxonomyItem?.categoryDescription} />
          </Grid>
          <Grid size={{ xs: 12, md: taxonomyItem?.detail ? 4 : 6 }}>
            <InfoRow label="Subcategory" value={taxonomyItem?.subcategoryDescription} />
          </Grid>
          {taxonomyItem?.detail && (
            <Grid size={{ xs: 12, md: 4 }}>
              <InfoRow label="Detail" value={taxonomyItem.detailDescription} />
            </Grid>
          )}
        </Grid>
      </Box>

      {/* Description */}
      <Box sx={{ mt: 3 }}>
        <Typography variant="caption" color="text.secondary" fontWeight={600}>
          Description of Occurrence / Variance
        </Typography>
        <Box
          sx={{
            mt: 1,
            p: 2,
            bgcolor: (theme) => alpha(theme.palette.background.default, 0.5),
            borderRadius: 1,
            border: (theme) => `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
            {incident.description}
          </Typography>
        </Box>
      </Box>
    </Paper>
  );
}
