'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import {
  Paper,
  Typography,
  Box,
  alpha,
  TextField,
  Button,
  Stack,
  Grid,
  Chip,
  Autocomplete,
  Alert,
} from '@mui/material';
import { Science, PersonAdd } from '@mui/icons-material';
import { format } from 'date-fns';
import ReactMarkdown from 'react-markdown';
import type { OVRReport } from '../../app/incidents/_shared/types';

interface Props {
  incident: OVRReport;
  onUpdate: () => void;
}

export function InvestigationSection({ incident, onUpdate }: Props) {
  const { data: session } = useSession();
  const [users, setUsers] = useState<Array<{ id: number; name: string }>>([]);
  const [selectedInvestigator, setSelectedInvestigator] = useState<number | null>(null);
  const [findings, setFindings] = useState('');
  const [problemsIdentified, setProblemsIdentified] = useState(incident.problemsIdentified || '');
  const [causeClassification, setCauseClassification] = useState(incident.causeClassification || '');
  const [preventionRecommendation, setPreventionRecommendation] = useState(incident.preventionRecommendation || '');
  const [submitting, setSubmitting] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);

  const isHOD = session?.user?.role === 'admin' || session?.user?.id === incident.departmentHeadId?.toString();
  const isInvestigator = incident.investigators?.some(inv => inv.investigatorId.toString() === session?.user?.id);

  const canAssignInvestigator = isHOD && incident.status === 'hod_assigned';
  const canSubmitFindings = isInvestigator && incident.investigators?.find(inv => inv.investigatorId.toString() === session?.user?.id)?.status === 'pending';
  const canSubmitHODReport = isHOD && incident.status === 'hod_assigned';

  const fetchUsers = async () => {
    setLoadingUsers(true);
    try {
      const res = await fetch('/api/users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
    } finally {
      setLoadingUsers(false);
    }
  };

  const handleAssignInvestigator = async () => {
    if (!selectedInvestigator) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/incidents/view/${incident.id}/assign-investigator`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ investigatorId: selectedInvestigator }),
      });

      if (res.ok) {
        setSelectedInvestigator(null);
        onUpdate();
      } else {
        alert('Failed to assign investigator');
      }
    } catch (error) {
      console.error('Error assigning investigator:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitFindings = async () => {
    if (!findings.trim()) {
      alert('Please provide investigation findings');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/incidents/view/${incident.id}/submit-findings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ findings }),
      });

      if (res.ok) {
        onUpdate();
      } else {
        alert('Failed to submit findings');
      }
    } catch (error) {
      console.error('Error submitting findings:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmitHODReport = async () => {
    if (!problemsIdentified.trim() || !causeClassification.trim() || !preventionRecommendation.trim()) {
      alert('Please fill all required fields');
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`/api/incidents/view/${incident.id}/hod-submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          problemsIdentified,
          causeClassification,
          preventionRecommendation,
        }),
      });

      if (res.ok) {
        onUpdate();
      } else {
        alert('Failed to submit HOD report');
      }
    } catch (error) {
      console.error('Error submitting HOD report:', error);
    } finally {
      setSubmitting(false);
    }
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
        <Science /> Investigation Phase
      </Typography>

      {/* Assigned Investigators */}
      {incident.investigators && incident.investigators.length > 0 && (
        <Box sx={{ mt: 2 }}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Assigned Investigators
          </Typography>
          <Stack direction="row" spacing={1} flexWrap="wrap" gap={1}>
            {incident.investigators.map(inv => (
              <Chip
                key={inv.id}
                label={`${inv.investigator.firstName} ${inv.investigator.lastName}`}
                color={inv.status === 'submitted' ? 'success' : 'default'}
                size="small"
              />
            ))}
          </Stack>
        </Box>
      )}

      {/* Assign New Investigator (HOD only) */}
      {canAssignInvestigator && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Assign Investigator
          </Typography>
          <Stack direction="row" spacing={2}>
            <Autocomplete
              sx={{ flex: 1 }}
              options={users}
              loading={loadingUsers}
              getOptionLabel={(option) => option.name}
              onChange={(_, value) => setSelectedInvestigator(value?.id || null)}
              onOpen={fetchUsers}
              renderInput={(params) => <TextField {...params} label="Select Investigator" />}
            />
            <Button
              variant="contained"
              startIcon={<PersonAdd />}
              onClick={handleAssignInvestigator}
              disabled={!selectedInvestigator || submitting}
            >
              Assign
            </Button>
          </Stack>
        </Box>
      )}

      {/* Investigator Findings Submission */}
      {canSubmitFindings && (
        <Box sx={{ mt: 3 }}>
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Submit Your Investigation Findings
          </Typography>
          <Alert severity="info" sx={{ mb: 2 }}>
            You can use Markdown for formatting. Attachments coming soon.
          </Alert>
          <TextField
            fullWidth
            multiline
            rows={8}
            label="Investigation Findings (Markdown supported)"
            value={findings}
            onChange={(e) => setFindings(e.target.value)}
            placeholder="## Investigation Summary&#10;&#10;### Findings&#10;- Finding 1&#10;- Finding 2"
          />
          <Button
            variant="contained"
            onClick={handleSubmitFindings}
            disabled={submitting}
            sx={{ mt: 2 }}
          >
            Submit Findings
          </Button>
        </Box>
      )}

      {/* Display Submitted Findings */}
      {incident.investigators?.filter(inv => inv.findings).map(inv => (
        <Box
          key={inv.id}
          sx={{
            mt: 3,
            p: 2,
            bgcolor: (theme) => alpha(theme.palette.info.main, 0.05),
            borderRadius: 1,
            border: (theme) => `1px solid ${theme.palette.divider}`,
          }}
        >
          <Typography variant="subtitle2" fontWeight={600} gutterBottom>
            Findings by {inv.investigator.firstName} {inv.investigator.lastName}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            Submitted on {inv.submittedAt && format(new Date(inv.submittedAt), 'MMM dd, yyyy HH:mm')}
          </Typography>
          <Box sx={{ mt: 2, '& p': { mb: 1 }, '& ul': { pl: 2 } }}>
            <ReactMarkdown>{inv.findings || ''}</ReactMarkdown>
          </Box>
        </Box>
      ))}

      {/* HOD Final Report */}
      {canSubmitHODReport && (
        <Box sx={{ mt: 4 }}>
          <Typography
            variant="subtitle1"
            fontWeight={700}
            gutterBottom
            sx={{
              bgcolor: (theme) => alpha(theme.palette.warning.main, 0.1),
              p: 1.5,
              borderRadius: 1,
            }}
          >
            Department Head Action / Recommendation
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="Problem/s Identified *"
                value={problemsIdentified}
                onChange={(e) => setProblemsIdentified(e.target.value)}
                required
              />
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                select
                SelectProps={{ native: true }}
                label="Cause Classification *"
                value={causeClassification}
                onChange={(e) => setCauseClassification(e.target.value)}
                required
              >
                <option value=""></option>
                <option value="1">1 - Absence of Policy</option>
                <option value="2">2 - Policy not Implemented</option>
                <option value="3">3 - Lack of Understanding</option>
                <option value="4">4 - Lack of Communication</option>
                <option value="5">5 - Negligence</option>
                <option value="6">6 - Materials / supply shortage</option>
                <option value="7">7 - Materials / Supply poor quality</option>
                <option value="8">8 - Shortage of Equipment</option>
                <option value="9">9 - Equipment Malfunction</option>
                <option value="10">10 - Others (Specify)</option>
              </TextField>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <TextField
                fullWidth
                multiline
                rows={3}
                label="How could this incident be prevented *"
                value={preventionRecommendation}
                onChange={(e) => setPreventionRecommendation(e.target.value)}
                required
              />
            </Grid>
          </Grid>
          <Button
            variant="contained"
            onClick={handleSubmitHODReport}
            disabled={submitting}
            sx={{ mt: 2 }}
          >
            {submitting ? 'Submitting...' : 'Submit to QI Department'}
          </Button>
        </Box>
      )}

      {/* Display HOD Report if submitted */}
      {incident.hodSubmittedAt && (
        <Box sx={{ mt: 3 }}>
          <Typography
            variant="subtitle1"
            fontWeight={700}
            gutterBottom
            sx={{
              bgcolor: (theme) => alpha(theme.palette.success.main, 0.1),
              p: 1.5,
              borderRadius: 1,
            }}
          >
            Department Head Report (Submitted)
          </Typography>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid size={{ xs: 12 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Problem/s Identified
              </Typography>
              <Typography variant="body2">{incident.problemsIdentified}</Typography>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Cause Classification
              </Typography>
              <Typography variant="body2">{incident.causeClassification}</Typography>
            </Grid>
            <Grid size={{ xs: 12 }}>
              <Typography variant="caption" color="text.secondary" fontWeight={600}>
                Prevention Recommendation
              </Typography>
              <Typography variant="body2">{incident.preventionRecommendation}</Typography>
            </Grid>
          </Grid>
        </Box>
      )}
    </Paper>
  );
}
