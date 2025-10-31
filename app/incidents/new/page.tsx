'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Paper,
  Stack,
  Alert,
  CircularProgress,
  LinearProgress,
  alpha,
} from '@mui/material';
import { motion, AnimatePresence } from 'framer-motion';
import { AppLayout } from '@/components/AppLayout';
import { fadeIn, slideIn } from '@/lib/theme';
import { BasicInfoStep } from '@/components/incident-form/BasicInfoStep';
import { OccurrenceDetailsStep } from '@/components/incident-form/OccurrenceDetailsStep';
import { WitnessInfoStep } from '@/components/incident-form/WitnessInfoStep';
import { MedicalAssessmentStep } from '@/components/incident-form/MedicalAssessmentStep';
import { ReviewStep } from '@/components/incident-form/ReviewStep';

const steps = [
  'Basic Information',
  'Occurrence Details',
  'Witness Information',
  'Medical Assessment',
  'Review & Submit',
];

export default function NewIncidentPage() {
  const router = useRouter();
  const { data: session } = useSession();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    // Basic Info
    occurrenceDate: new Date().toISOString().slice(0, 10), // YYYY-MM-DD
    occurrenceTime: new Date().toTimeString().slice(0, 8), // HH:mm:ss
    locationId: (localStorage.getItem('GH:IF:locationId') || null) as number | null,
    specificLocation: '',
    personInvolved: 'patient' as const,
    isSentinelEvent: false,
    sentinelEventDetails: '',
    // Patient Info (if applicable)
    patientName: '',
    patientMRN: '',
    patientAge: '',
    patientSex: '',
    patientUnit: '',
    
    // Staff Involved
    staffInvolvedName: '',
    staffPosition: '',
    staffEmployeeId: '',
    staffDepartment: '',
    
    // Occurrence Classification
    occurrenceCategory: '',
    occurrenceSubcategory: '',
    occurrenceOtherDetails: '',
    
    // Description
    description: '',
    
    // Witness
    witnessName: '',
    witnessAccount: '',
    witnessDepartment: '',
    witnessPosition: '',
    witnessEmployeeId: '',
    
    // Medical Assessment
    physicianNotified: false,
    physicianSawPatient: false,
    assessment: '',
    diagnosis: '',
    injuryOutcome: '' as 'no_injury' | 'minor' | 'serious' | 'death' | '',
    treatmentProvided: '',
    physicianName: '',
    physicianId: '',
  });

  // Auto-save draft every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (formData.description && formData.occurrenceCategory) {
        saveDraft();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [formData]);

  const saveDraft = async () => {
    try {
      await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, status: 'draft' }),
      });
    } catch (error) {
      console.error('Error saving draft:', error);
    }
  };

  const handleNext = () => {
    setActiveStep((prev) => prev + 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleBack = () => {
    setActiveStep((prev) => prev - 1);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSubmit = async (isDraft: boolean = false) => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/incidents', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          status: isDraft ? 'draft' : 'submitted',
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to submit incident report');
      }

      const data = await response.json();
      router.push(`/incidents/${data.id}`);
    } catch (error) {
      setError(error instanceof Error ? error.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  const getStepContent = (step: number) => {
    switch (step) {
      case 0:
        return (
          <BasicInfoStep
            formData={formData}
            setFormData={setFormData}
            onNext={handleNext}
          />
        );
      case 1:
        return (
          <OccurrenceDetailsStep
            formData={formData}
            setFormData={setFormData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 2:
        return (
          <WitnessInfoStep
            formData={formData}
            setFormData={setFormData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 3:
        return (
          <MedicalAssessmentStep
            formData={formData}
            setFormData={setFormData}
            onNext={handleNext}
            onBack={handleBack}
          />
        );
      case 4:
        return (
          <ReviewStep
            formData={formData}
            onBack={handleBack}
            onSubmit={handleSubmit}
            loading={loading}
          />
        );
      default:
        return null;
    }
  };

  return (
    <AppLayout>
      <Box sx={{ maxWidth: 1200, mx: 'auto' }}>
        <motion.div {...{ ...fadeIn, transition: { ...fadeIn.transition, ease: ['easeInOut'] } }}>
          <Stack spacing={4}>
            {/* Header */}
            <Box>
              <Typography variant="h4" gutterBottom fontWeight={700}>
                New OVR Report
              </Typography>
              <Typography variant="body1" color="text.secondary">
                Complete all required information about the occurrence variance
              </Typography>
            </Box>

            {/* Progress */}
            <Paper sx={{ p: 3 }}>
              <Stepper activeStep={activeStep} alternativeLabel>
                {steps.map((label) => (
                  <Step key={label}>
                    <StepLabel>{label}</StepLabel>
                  </Step>
                ))}
              </Stepper>
              <LinearProgress
                variant="determinate"
                value={(activeStep / (steps.length - 1)) * 100}
                sx={{ mt: 3, height: 6, borderRadius: 3 }}
              />
            </Paper>

            {/* Error Alert */}
            {error && (
              <Alert severity="error" onClose={() => setError(null)}>
                {error}
              </Alert>
            )}

            {/* Form Content */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeStep}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                {getStepContent(activeStep)}
              </motion.div>
            </AnimatePresence>

            {/* Auto-save indicator */}
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="caption" color="text.secondary">
                💾 Drafts are auto-saved every 30 seconds
              </Typography>
            </Box>
          </Stack>
        </motion.div>
      </Box>
    </AppLayout>
  );
}
