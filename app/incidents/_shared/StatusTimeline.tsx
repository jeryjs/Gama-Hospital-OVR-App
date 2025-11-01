import { Check, Circle } from '@mui/icons-material';
import { Box, Paper, Step, StepConnector, StepLabel, Stepper, styled } from '@mui/material';
import { format } from 'date-fns';

interface Props {
  status: string;
  submittedAt: string | null;
}

const steps = [
  { key: 'submitted', label: 'Submitted', description: { current: '', final: 'Report submitted by employee' } },
  { key: 'supervisor_approved', label: 'Approval', description: { current: 'Awaiting supervisor approval', final: 'Approved by supervisor' } },
  { key: 'qi_review', label: 'QI Review', description: { current: 'Undergoing QI review', final: 'Quality Improvement review' } },
  { key: 'hod_assigned', label: 'Investigation', description: { current: 'HOD assigned to investigate', final: 'HOD investigating' } },
  { key: 'qi_final_review', label: 'Final Review', description: { current: 'Awaiting final review', final: 'QI final feedback' } },
  { key: 'closed', label: 'Closed', description: { current: 'Case closed', final: 'Case closed' } },
];

const ColorlibConnector = styled(StepConnector)(({ theme }) => ({
  alternativeLabel: {
    top: 22,
  },
  active: {
    '& .MuiStepConnector-line': {
      backgroundImage: `linear-gradient(95deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
    },
  },
  completed: {
    '& .MuiStepConnector-line': {
      backgroundImage: `linear-gradient(95deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
    },
  },
  line: {
    height: 3,
    border: 0,
    backgroundColor: theme.palette.divider,
    borderRadius: 1,
  },
}));

const ColorlibStepIconRoot = styled('div')<{
  ownerState: { completed?: boolean; active?: boolean };
}>(({ theme, ownerState }) => ({
  backgroundColor: theme.palette.mode === 'dark' ? theme.palette.grey[700] : '#ccc',
  zIndex: 1,
  color: '#fff',
  width: 50,
  height: 50,
  display: 'flex',
  borderRadius: '50%',
  justifyContent: 'center',
  alignItems: 'center',
  boxShadow: '0 4px 10px 0 rgba(0,0,0,.25)',
  ...(ownerState.active && {
    backgroundImage: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
    boxShadow: '0 4px 10px 0 rgba(0,0,0,.25)',
  }),
  ...(ownerState.completed && {
    backgroundImage: `linear-gradient(135deg, ${theme.palette.primary.main} 0%, ${theme.palette.secondary.main} 100%)`,
  }),
}));

function ColorlibStepIcon(props: {
  active?: boolean;
  completed?: boolean;
  className?: string;
  icon: React.ReactNode;
}) {
  const { active, completed, className } = props;

  return (
    <ColorlibStepIconRoot ownerState={{ completed, active }} className={className}>
      {completed ? <Check /> : <Circle sx={{ fontSize: 12 }} />}
    </ColorlibStepIconRoot>
  );
}

export function StatusTimeline({ status, submittedAt }: Props) {
  const activeStep = steps.findIndex(step => step.key === status) + 1;

  return (
    <Paper sx={{ p: 3, mb: 3 }}>
      <Stepper alternativeLabel activeStep={activeStep} connector={<ColorlibConnector />}>
        {steps.map((step, index) => (
          <Step key={step.key} completed={index < activeStep}>
            <StepLabel
              StepIconComponent={ColorlibStepIcon}
              optional={
                <Box sx={{ textAlign: 'center', mt: 0.5 }}>
                  {step.description && (
                    <Box component="span" sx={{ fontSize: '0.75rem', color: 'text.secondary' }}>
                      {index === activeStep
                        ? step.description.current
                        : step.description.final}
                    </Box>
                  )}
                </Box>
              }
            >
              {step.label}
            </StepLabel>
          </Step>
        ))}
      </Stepper>
      
      {submittedAt && (
        <Box sx={{ textAlign: 'center', mt: 2, fontSize: '0.875rem', color: 'text.secondary' }}>
          Submitted on {format(new Date(submittedAt), 'MMMM dd, yyyy HH:mm')}
        </Box>
      )}
    </Paper>
  );
}
