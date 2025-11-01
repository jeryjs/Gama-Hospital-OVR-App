'use client';

import { AppLayout } from '@/components/AppLayout';
import { InvestigationSection } from '@/components/incident-form/InvestigationSection';
import { MedicalAssessmentSection } from '@/components/incident-form/MedicalAssessmentSection';
import { OccurrenceDetailsSection } from '@/components/incident-form/OccurrenceDetailsSection';
import { PatientInfoSection } from '@/components/incident-form/PatientInfoSection';
import { QIAssignHODSection } from '@/components/incident-form/QIAssignHODSection';
import { QIFeedbackSection } from '@/components/incident-form/QIFeedbackSection';
import { SupervisorSection } from '@/components/incident-form/SupervisorSection';
import { WitnessSection } from '@/components/incident-form/WitnessSection';
import { useIncident } from '@/lib/hooks';
import { Box, LinearProgress, Typography } from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import { StatusTimeline } from '../../_shared/StatusTimeline';
import { ActionButtons } from './ActionButtons';
import { CommentsSection } from './CommentsSection';
import { IncidentHeader } from './IncidentHeader';

export default function IncidentViewPage() {
  const params = useParams();
  const router = useRouter();

  // Fetch incident with SWR - automatic caching and revalidation
  const { incident, isLoading, error, mutate } = useIncident(params.id as string);

  if (isLoading) {
    return (
      <AppLayout>
        <LinearProgress />
      </AppLayout>
    );
  }

  if (error || !incident) {
    return (
      <AppLayout>
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="error">
            {error ? 'Error loading incident' : 'Incident not found'}
          </Typography>
        </Box>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Box sx={{ maxWidth: 1400, mx: 'auto', pb: 4 }}>
        <IncidentHeader incident={incident} />

        {/* Show timeline only after submission */}
        {incident.status !== 'draft' && (
          <StatusTimeline status={incident.status} submittedAt={incident.submittedAt} />
        )}

        {/* Patient & Occurrence Information */}
        <PatientInfoSection incident={incident} />
        <OccurrenceDetailsSection incident={incident} />

        {/* Witness Information */}
        {incident.witnessName && <WitnessSection incident={incident} />}

        {/* Medical Assessment */}
        {incident.physicianSawPatient && <MedicalAssessmentSection incident={incident} />}

        {/* Supervisor Section */}
        {incident.status !== 'draft' && <SupervisorSection incident={incident} onUpdate={mutate} />}

        {/* QI Assign HOD Section */}
        {incident.status === 'supervisor_approved' && <QIAssignHODSection incident={incident} onUpdate={mutate} />}

        {/* Investigation Section (for HOD and investigators) */}
        {(incident.status === 'hod_assigned' || incident.status === 'qi_final_review' || incident.status === 'closed') && (
          <InvestigationSection incident={incident} onUpdate={mutate} />
        )}

        {/* QI Final Feedback */}
        {(incident.status === 'qi_final_review' || incident.status === 'closed') && (
          <QIFeedbackSection incident={incident} onUpdate={mutate} />
        )}

        {/* Comments Section */}
        <CommentsSection incidentId={incident.id} />

        {/* Action Buttons */}
        <ActionButtons incident={incident} onUpdate={mutate} />
      </Box>
    </AppLayout>
  );
}
