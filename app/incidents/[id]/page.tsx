'use client';

import { AppLayout } from '@/components/AppLayout';
import { InvestigationSection } from '@/components/incident-form/InvestigationSection';
import { MedicalAssessmentSection } from '@/components/incident-form/MedicalAssessmentSection';
import { OccurrenceDetailsSection } from '@/components/incident-form/OccurrenceDetailsSection';
import { PatientInfoSection } from '@/components/incident-form/PatientInfoSection';
import { QIFeedbackSection } from '@/components/incident-form/QIFeedbackSection';
import { SupervisorSection } from '@/components/incident-form/SupervisorSection';
import { WitnessSection } from '@/components/incident-form/WitnessSection';
import { Box, LinearProgress } from '@mui/material';
import { useParams, useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { StatusTimeline } from '../_shared/StatusTimeline';
import type { OVRReport } from '../_shared/types';
import { ActionButtons } from './ActionButtons';
import { CommentsSection } from './CommentsSection';
import { IncidentHeader } from './IncidentHeader';

export default function IncidentViewPage() {
  const params = useParams();
  const router = useRouter();
  const [incident, setIncident] = useState<OVRReport | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchIncident();
  }, [params.id]);

  const fetchIncident = async () => {
    try {
      const res = await fetch(`/api/incidents/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setIncident(data);
      } else if (res.status === 404) {
        router.push('/incidents');
      }
    } catch (error) {
      console.error('Error fetching incident:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdate = () => {
    fetchIncident();
  };

  if (loading) {
    return (
      <AppLayout>
        <LinearProgress />
      </AppLayout>
    );
  }

  if (!incident) {
    return (
      <AppLayout>
        <Box>Incident not found</Box>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <Box sx={{ maxWidth: 1400, mx: 'auto', pb: 4 }}>
        <IncidentHeader incident={incident} onBack={() => router.push('/incidents')} />
        
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
        <SupervisorSection incident={incident} onUpdate={handleUpdate} />
        
        {/* Investigation Section (for HOD and investigators) */}
        {(incident.status === 'hod_assigned' || incident.status === 'qi_final_review' || incident.status === 'closed') && (
          <InvestigationSection incident={incident} onUpdate={handleUpdate} />
        )}
        
        {/* QI Final Feedback */}
        {(incident.status === 'qi_final_review' || incident.status === 'closed') && (
          <QIFeedbackSection incident={incident} onUpdate={handleUpdate} />
        )}
        
        {/* Comments Section */}
        <CommentsSection incidentId={incident.id} />
        
        {/* Action Buttons */}
        <ActionButtons incident={incident} onUpdate={handleUpdate} />
      </Box>
    </AppLayout>
  );
}
