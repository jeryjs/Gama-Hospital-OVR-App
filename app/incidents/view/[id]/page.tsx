'use client';

import { AppLayout } from '@/components/AppLayout';
import { LoadingFallback } from '@/components/LoadingFallback';
import { InvestigationSection } from '@/components/incident-form/InvestigationSection';
import { MedicalAssessmentSection } from '@/components/incident-form/MedicalAssessmentSection';
import { OccurrenceDetailsSection } from '@/components/incident-form/OccurrenceDetailsSection';
import { PatientInfoSection } from '@/components/incident-form/PatientInfoSection';
import { QIAssignHODSection } from '@/components/incident-form/QIAssignHODSection';
import { QIFeedbackSection } from '@/components/incident-form/QIFeedbackSection';
import { RiskClassificationSection } from '@/components/incident-form/RiskClassificationSection';
import { SupervisorSection } from '@/components/incident-form/SupervisorSection';
import { useIncident } from '@/lib/hooks';
import { Box, Typography } from '@mui/material';
import { useParams } from 'next/navigation';
import { Suspense } from 'react';
import { StatusTimeline } from '../../_shared/StatusTimeline';
import { ActionButtons } from './ActionButtons';
import { CommentsSection } from './CommentsSection';
import { IncidentHeader } from './IncidentHeader';

// Inner component that fetches data
function IncidentDetails() {
  const params = useParams();

  // This will suspend while loading
  const { incident, mutate } = useIncident(params.id as string);


  if (!incident) {
    return (
      <AppLayout>
        <Box sx={{ textAlign: 'center', py: 8 }}>
          <Typography variant="h6" color="error">
            Incident not found
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

        {/* Medical Assessment */}
        {incident.physicianSawPatient && <MedicalAssessmentSection incident={incident} />}

        {/* Supervisor Section - Display only, no approval needed */}
        {(incident.supervisorId || incident.supervisorAction) && (
          <SupervisorSection incident={incident} onUpdate={mutate} />
        )}

        {/* Risk Classification Section */}
        {incident.riskScore && <RiskClassificationSection incident={incident} />}

        {/* QI Assign HOD Section - Can assign directly after submission */}
        {incident.status === 'hod_assigned' && !incident.departmentHeadId && (
          <QIAssignHODSection incident={incident} onUpdate={mutate} />
        )}

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

// Main page component with Suspense boundary
export default function IncidentViewPage() {
  return (
    <Suspense fallback={
      <LoadingFallback />
    }>
      <IncidentDetails />
    </Suspense>
  );
}
