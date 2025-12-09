'use client';

import { AppLayout } from '@/components/AppLayout';
import { LoadingFallback } from '@/components/LoadingFallback';
import { CaseReviewSection } from '@/components/incident-form/CaseReviewSection';
import { CompletionAnimation } from '@/components/incident-form/CompletionAnimation';
import { CorrectiveActionsManagement } from '@/components/incident-form/CorrectiveActionsManagement';
import { InvestigationManagement } from '@/components/incident-form/InvestigationManagement';
import { MedicalAssessmentSection } from '@/components/incident-form/MedicalAssessmentSection';
import { OccurrenceDetailsSection } from '@/components/incident-form/OccurrenceDetailsSection';
import { PatientInfoSection } from '@/components/incident-form/PatientInfoSection';
import { QIFeedbackSection } from '@/components/incident-form/QIFeedbackSection';
import { QIReviewSection } from '@/components/incident-form/QIReviewSection';
import { RiskClassificationSection } from '@/components/incident-form/RiskClassificationSection';
import { SupervisorSection } from '@/components/incident-form/SupervisorSection';
import { useIncident } from '@/lib/hooks';
import { Box, Typography } from '@mui/material';
import { useParams } from 'next/navigation';
import { Suspense, useState } from 'react';
import { StatusTimeline } from '../../_shared/StatusTimeline';
import { ActionButtons } from './ActionButtons';
import { CommentsSection } from './CommentsSection';
import { IncidentHeader } from './IncidentHeader';
import { WorkflowSection } from './WorkflowSection';

// Inner component that fetches data
function IncidentDetails() {
  const params = useParams();
  const [showCompletion, setShowCompletion] = useState(false);

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

  // Handle successful closure
  const handleClosureSuccess = () => {
    mutate();
    setShowCompletion(true);
  };

  return (
    <AppLayout>
      <Box sx={{ maxWidth: 1400, mx: 'auto', pb: 4 }}>
        <IncidentHeader incident={incident} />

        {/* Show timeline only after submission */}
        {incident.status !== 'draft' && (
          <StatusTimeline status={incident.status} submittedAt={incident.submittedAt} />
        )}

        {/* ========== STATIC INFORMATION SECTIONS ========== */}
        {/* Always visible - Basic incident information */}
        <PatientInfoSection incident={incident} />
        <OccurrenceDetailsSection incident={incident} />

        {/* Medical Assessment - Conditional on physician involvement */}
        {incident.physicianSawPatient && <MedicalAssessmentSection incident={incident} />}

        {/* Supervisor Section - Read-only display */}
        {(incident.supervisorId || incident.supervisorAction) && (
          <SupervisorSection incident={incident} onUpdate={mutate} />
        )}

        {/* Risk Classification - If available */}
        {incident.riskScore && <RiskClassificationSection incident={incident} />}

        {/* ========== WORKFLOW SECTIONS ========== */}
        {/* Status-driven workflow components */}
        <WorkflowSection
          incident={incident}
          onUpdate={mutate}
          onClosureSuccess={handleClosureSuccess}
        />

        {/* ========== COMMENTS & ACTIONS ========== */}
        {/* Comments - Always visible after submission */}
        {incident.status !== 'draft' && <CommentsSection incidentId={incident.id} />}

        {/* Action Buttons - Context-aware actions */}
        <ActionButtons incident={incident} onUpdate={mutate} />
      </Box>

      {/* Completion Animation */}
      <CompletionAnimation
        open={showCompletion}
        incidentId={incident.id}
        onClose={() => setShowCompletion(false)}
      />
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
