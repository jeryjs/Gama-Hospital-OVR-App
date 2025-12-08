'use client';

import { useUsers, useIncidentActions } from '@/lib/hooks';
import { ACCESS_CONTROL } from '@/lib/access-control';
import { PersonAdd, Science, ExpandMore } from '@mui/icons-material';
import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Alert,
  alpha,
  Autocomplete,
  Box,
  Button,
  Chip,
  Grid,
  Paper,
  Stack,
  TextField,
  Typography,
} from '@mui/material';
import { format } from 'date-fns';
import { useSession } from 'next-auth/react';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import type { OVRReportWithRelations } from '../../app/incidents/_shared/types';

interface Props {
  incident: OVRReportWithRelations;
  onUpdate: () => void;
}

export function InvestigationSection({ incident, onUpdate }: Props) {
  const { data: session } = useSession();
  const [selectedInvestigator, setSelectedInvestigator] = useState<number | null>(null);
  const [findings, setFindings] = useState('');
  const [problemsIdentified, setProblemsIdentified] = useState(incident.problemsIdentified || '');
  const [causeClassification, setCauseClassification] = useState(incident.causeClassification || '');
  const [preventionRecommendation, setPreventionRecommendation] = useState(incident.preventionRecommendation || '');
  const [expandedInvestigator, setExpandedInvestigator] = useState<number | false>(false);
  const [editMode, setEditMode] = useState<Record<number, boolean>>({});

  // Fetch users with SWR
  const { users } = useUsers();

  const { performAction, submitting } = useIncidentActions(incident.id, onUpdate);

  const isAssignedHOD = session?.user?.id === incident.departmentHeadId?.toString();
  const canEditInvestigation = ACCESS_CONTROL.ui.incidentForm.canEditInvestigationSection(
    session?.user.roles || [],
    isAssignedHOD
  );
  const isInvestigator = incident.investigators?.some(inv => inv.investigatorId.toString() === session?.user?.id);

  const canAssignInvestigator = canEditInvestigation && incident.status === 'hod_assigned';
  const canSubmitFindings = isInvestigator && incident.investigators?.find(inv => inv.investigatorId.toString() === session?.user?.id)?.status === 'pending';
  const canSubmitHODReport = canEditInvestigation && incident.status === 'hod_assigned';

  const handleAssignInvestigator = async () => {
    if (!selectedInvestigator) return;

    const result = await performAction('assign-investigator', {
      investigatorId: selectedInvestigator
    });

    if (!result.success) {
      alert(result.error || 'Failed to assign investigator');
      return;
    }

    setSelectedInvestigator(null);
  };

  const handleSubmitFindings = async (investigatorId: number) => {
    const inv = incident.investigators?.find(inv => inv.id === investigatorId);
    if (!inv || !findings.trim()) {
      alert('Please provide investigation findings');
      return;
    }

    const result = await performAction('submit-findings', { findings });

    if (!result.success) {
      alert(result.error || 'Failed to submit findings');
    }
  };

  const handleSubmitHODReport = async () => {
    if (!problemsIdentified.trim() || !causeClassification.trim() || !preventionRecommendation.trim()) {
      alert('Please fill all required fields');
      return;
    }

    const result = await performAction('hod-submit', {
      investigationFindings: incident.investigationFindings || '',
      problemsIdentified,
      causeClassification,
      causeDetails: causeClassification,
      preventionRecommendation,
    });

    if (!result.success) {
      alert(result.error || 'Failed to submit HOD report');
    }
  };

  const stripMarkdown = (markdown: string) => {
    return markdown
      .replace(/#{1,6}\s*/g, '') // Remove headers
      .replace(/\*\*(.*?)\*\*/g, '$1') // Remove bold
      .replace(/\*(.*?)\*/g, '$1') // Remove italic
      .replace(/\[.*?\]\(.*?\)/g, '') // Remove links
      .replace(/```[\s\S]*?```/g, '') // Remove code blocks
      .replace(/`(.*?)`/g, '$1') // Remove inline code
      .replace(/^\s*[-*+]\s+/gm, '') // Remove list markers
      .replace(/\n+/g, ' ') // Replace newlines with spaces
      .trim();
  };

  const handleAccordionChange = (investigatorId: number) => (event: React.SyntheticEvent, isExpanded: boolean) => {
    setExpandedInvestigator(isExpanded ? investigatorId : false);
  };

  const toggleEditMode = (investigatorId: number) => {
    setEditMode(prev => ({ ...prev, [investigatorId]: !prev[investigatorId] }));
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
          {incident.investigators.map(inv => {
            const isCurrentUser = inv.investigatorId.toString() === session?.user?.id;
            const canEdit = isCurrentUser && inv.status === 'pending';
            const summary = inv.findings ? stripMarkdown(inv.findings).substring(0, 100) + (stripMarkdown(inv.findings).length > 100 ? '...' : '') : 'No findings submitted yet.';
            return (
              <Accordion
                key={inv.id}
                expanded={expandedInvestigator === inv.id}
                onChange={handleAccordionChange(inv.id)}
                sx={{ mt: 1 }}
              >
                <AccordionSummary expandIcon={<ExpandMore />}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Typography variant="subtitle2" fontWeight={600}>
                      {inv.investigator.firstName} {inv.investigator.lastName}
                    </Typography>
                    <Chip
                      label={inv.status === 'submitted' ? 'Submitted' : 'Pending'}
                      color={inv.status === 'submitted' ? 'success' : 'default'}
                      size="small"
                    />
                    <Typography variant="body2" color="text.secondary">
                      {summary}
                    </Typography>
                  </Box>
                </AccordionSummary>
                <AccordionDetails>
                  {canEdit ? (
                    <Box>
                      <Stack direction="row" spacing={1} sx={{ mb: 2 }}>
                        <Button
                          variant={editMode[inv.id] ? 'outlined' : 'contained'}
                          onClick={() => toggleEditMode(inv.id)}
                        >
                          {editMode[inv.id] ? 'Edit' : 'Preview'}
                        </Button>
                      </Stack>
                      {editMode[inv.id] ? (
                        <Box sx={{ mt: 2, '& p': { mb: 1 }, '& ul': { pl: 2 } }}>
                          <ReactMarkdown>{findings || '## Investigation Summary\n\n### Findings\n- Finding 1\n- Finding 2'}</ReactMarkdown>
                        </Box>
                      ) : (
                        <TextField
                          fullWidth
                          multiline
                          rows={8}
                          label="Investigation Findings (Markdown supported)"
                          value={findings}
                          onChange={(e) => setFindings(e.target.value)}
                          placeholder="## Investigation Summary&#10;&#10;### Findings&#10;- Finding 1&#10;- Finding 2"
                        />
                      )}
                      <Button
                        variant="contained"
                        onClick={() => handleSubmitFindings(inv.id)}
                        disabled={submitting || !findings.trim()}
                        sx={{ mt: 2 }}
                      >
                        Submit Findings
                      </Button>
                    </Box>
                  ) : (
                    <Box>
                      {inv.findings ? (
                        <>
                          <Typography variant="caption" color="text.secondary">
                            Submitted on {inv.submittedAt && format(new Date(inv.submittedAt), 'MMM dd, yyyy HH:mm')}
                          </Typography>
                          <Box sx={{ mt: 2, '& p': { mb: 1 }, '& ul': { pl: 2 } }}>
                            <ReactMarkdown>{inv.findings}</ReactMarkdown>
                          </Box>
                        </>
                      ) : (
                        <Typography variant="body2" color="text.secondary">
                          No findings submitted yet.
                        </Typography>
                      )}
                    </Box>
                  )}
                </AccordionDetails>
              </Accordion>
            );
          })}
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
              getOptionLabel={(option) => `${option.firstName} ${option.lastName}`}
              onChange={(_, value) => setSelectedInvestigator(value?.id || null)}
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
