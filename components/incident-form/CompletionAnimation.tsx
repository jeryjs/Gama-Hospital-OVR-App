/**
 * @fileoverview Completion Animation - Success Celebration
 * 
 * Shows success animation when incident is successfully closed
 * Provides visual feedback and next steps
 */

'use client';

import {
    Box,
    Button,
    Dialog,
    DialogContent,
    Stack,
    Typography,
    useTheme,
} from '@mui/material';
import {
    CheckCircle as SuccessIcon,
    Home as HomeIcon,
    List as ListIcon,
} from '@mui/icons-material';
import { useRouter } from 'next/navigation';
import { keyframes } from '@mui/system';

interface CompletionAnimationProps {
    open: boolean;
    incidentId: string;
    onClose?: () => void;
}

// Animations
const scaleIn = keyframes`
  0% {
    transform: scale(0);
    opacity: 0;
  }
  50% {
    transform: scale(1.1);
  }
  100% {
    transform: scale(1);
    opacity: 1;
  }
`;

const fadeIn = keyframes`
  from {
    opacity: 0;
    transform: translateY(10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
`;

/**
 * Completion Animation Component
 * Celebratory success screen after closing incident
 */
export function CompletionAnimation({ open, incidentId, onClose }: CompletionAnimationProps) {
    const theme = useTheme();
    const router = useRouter();

    const handleGoToDashboard = () => {
        router.push('/dashboard');
        onClose?.();
    };

    const handleViewIncidents = () => {
        router.push('/incidents');
        onClose?.();
    };

    return (
        <Dialog
            open={open}
            onClose={onClose}
            maxWidth="sm"
            fullWidth
            PaperProps={{
                sx: {
                    borderRadius: 3,
                    textAlign: 'center',
                    overflow: 'hidden',
                },
            }}
        >
            <DialogContent sx={{ p: 6 }}>
                {/* Success Icon */}
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'center',
                        mb: 3,
                        animation: `${scaleIn} 0.6s cubic-bezier(0.34, 1.56, 0.64, 1)`,
                    }}
                >
                    <SuccessIcon
                        sx={{
                            fontSize: 120,
                            color: 'success.main',
                            filter: 'drop-shadow(0 4px 12px rgba(46, 125, 50, 0.3))',
                        }}
                    />
                </Box>

                {/* Success Message */}
                <Stack
                    spacing={2}
                    sx={{
                        animation: `${fadeIn} 0.6s ease-out 0.3s both`,
                    }}
                >
                    <Typography variant="h4" fontWeight={600} color="success.main">
                        Incident Closed Successfully!
                    </Typography>

                    <Typography variant="body1" color="text.secondary">
                        Incident <strong>{incidentId}</strong> has been successfully resolved and archived.
                    </Typography>

                    {/* Stats */}
                    <Box
                        sx={{
                            display: 'inline-block',
                            bgcolor: 'success.lighter',
                            borderRadius: 2,
                            px: 3,
                            py: 2,
                            mt: 2,
                        }}
                    >
                        <Typography variant="body2" color="success.dark">
                            ✓ Case review completed
                        </Typography>
                        <Typography variant="body2" color="success.dark">
                            ✓ Feedback provided to reporter
                        </Typography>
                        <Typography variant="body2" color="success.dark">
                            ✓ All actions closed
                        </Typography>
                    </Box>

                    {/* Action Buttons */}
                    <Stack
                        direction="row"
                        spacing={2}
                        sx={{ mt: 4, justifyContent: 'center' }}
                    >
                        <Button
                            variant="contained"
                            size="large"
                            onClick={handleGoToDashboard}
                            startIcon={<HomeIcon />}
                        >
                            Go to Dashboard
                        </Button>
                        <Button
                            variant="outlined"
                            size="large"
                            onClick={handleViewIncidents}
                            startIcon={<ListIcon />}
                        >
                            View All Incidents
                        </Button>
                    </Stack>
                </Stack>
            </DialogContent>
        </Dialog>
    );
}
