'use client';

import { apiCall } from '@/lib/client/error-handler';
import { getSeverityLabel, SEVERITY_LEVELS } from '@/lib/constants';
import { Assessment, CheckCircle } from '@mui/icons-material';
import {
  Alert,
  alpha,
  Box,
  Button,
  Checkbox,
  FormControlLabel,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { format } from 'date-fns';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import type { OVRReport } from '../../app/incidents/_shared/types';
import { ACCESS_CONTROL } from '@/lib/access-control';

interface Props {
  incident: OVRReport;
  onUpdate: () => void;
}

export function QIFeedbackSection({ incident, onUpdate }: Props) {
  const { data: session } = useSession();
  const [feedback, setFeedback] = useState(incident.qiFeedback || '');
  const [formComplete, setFormComplete] = useState(incident.qiFormComplete || false);
  const [causeIdentified, setCauseIdentified] = useState(incident.qiProperCauseIdentified || false);
  const [timeframe, setTimeframe] = useState(incident.qiProperTimeframe || false);
  const [actionComplies, setActionComplies] = useState(incident.qiActionCompliesStandards || false);
  const [effectiveAction, setEffectiveAction] = useState(incident.qiEffectiveCorrectiveAction || false);
  const [severityLevel, setSeverityLevel] = useState(incident.severityLevel || '');
  const [submitting, setSubmitting] = useState(false);

  const canSubmit = ACCESS_CONTROL.ui.incidentForm.canEditQISection(session?.user.roles || []) && incident.status === 'qi_final_review';
  const isClosed = incident.status === 'closed';

  const handleSubmit = async () => {
    if (!feedback.trim() || !severityLevel) {
      alert('Please provide feedback and select severity level');
      return;
    }

    setSubmitting(true);
    const { data, error } = await apiCall(`/api/incidents/${incident.id}/qi-close`, {
      method: 'POST',
      body: JSON.stringify({
        feedback,
        formComplete,
        causeIdentified,
        timeframe,
        actionComplies,
        effectiveAction,
        severityLevel,
      }),
    });

    setSubmitting(false);
    if (error) {
      alert(error.message || 'Failed to submit feedback');
      return;
    }

    onUpdate();
  };

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
        <Assessment /> Quality Improvement Department Feedback
      </Typography>

      {isClosed && incident.closedAt && (
        <Alert severity="success" icon={<CheckCircle />} sx={{ mt: 2 }}>
          Case closed on {format(new Date(incident.closedAt), 'MMM dd, yyyy HH:mm')}
        </Alert>
      )}

      <Box sx={{ mt: 3 }}>
        {canSubmit ? (
          <Stack spacing={3}>
            <TextField
              fullWidth
              multiline
              rows={4}
              label="QI Feedback *"
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="Provide quality improvement feedback..."
              required
            />

            <Box>
              <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                Assessment Checklist
              </Typography>
              <Grid container spacing={1}>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <FormControlLabel
                    control={<Checkbox checked={formComplete} onChange={(e) => setFormComplete(e.target.checked)} />}
                    label="Form Complete"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <FormControlLabel
                    control={<Checkbox checked={causeIdentified} onChange={(e) => setCauseIdentified(e.target.checked)} />}
                    label="Proper Cause Identified"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <FormControlLabel
                    control={<Checkbox checked={timeframe} onChange={(e) => setTimeframe(e.target.checked)} />}
                    label="Proper Timeframe"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <FormControlLabel
                    control={<Checkbox checked={actionComplies} onChange={(e) => setActionComplies(e.target.checked)} />}
                    label="Action Complies Standards"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6, md: 4 }}>
                  <FormControlLabel
                    control={<Checkbox checked={effectiveAction} onChange={(e) => setEffectiveAction(e.target.checked)} />}
                    label="Effective Corrective Action"
                  />
                </Grid>
              </Grid>
            </Box>

            <TextField
              fullWidth
              select
              SelectProps={{ native: true }}
              label="Severity Level *"
              value={severityLevel}
              onChange={(e) => setSeverityLevel(e.target.value)}
              required
            >
              <option value=""></option>
              {SEVERITY_LEVELS.map((level) => (
                <option key={level.value} value={level.value}>
                  {level.label}
                </option>
              ))}
            </TextField>

            <Button
              variant="contained"
              onClick={handleSubmit}
              disabled={submitting}
              startIcon={<CheckCircle />}
            >
              {submitting ? 'Closing...' : 'Close Case'}
            </Button>
          </Stack>
        ) : (
          <>
            {incident.qiFeedback && (
              <Box
                sx={{
                  p: 2,
                  bgcolor: (theme) => alpha(theme.palette.background.default, 0.5),
                  borderRadius: 1,
                  border: (theme) => `1px solid ${theme.palette.divider}`,
                }}
              >
                <Typography variant="body2" sx={{ whiteSpace: 'pre-wrap' }}>
                  {incident.qiFeedback}
                </Typography>
              </Box>
            )}

            {incident.severityLevel && (
              <Box sx={{ mt: 2 }}>
                <Typography variant="subtitle2" fontWeight={600}>
                  Severity Level
                </Typography>
                <Typography variant="body2" sx={{ mt: 0.5 }}>
                  {getSeverityLabel(incident.severityLevel)}
                </Typography>
              </Box>
            )}

            {!isClosed && (
              <Alert severity="info" sx={{ mt: 2 }}>
                Awaiting QI Department final review and closure
              </Alert>
            )}
          </>
        )}
      </Box>
    </Paper>
  );
}
