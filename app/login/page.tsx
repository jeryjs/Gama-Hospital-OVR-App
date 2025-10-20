'use client';

import { signIn } from 'next-auth/react';
import {
  Box,
  Button,
  Container,
  Paper,
  Typography,
  Stack,
  alpha,
} from '@mui/material';
import { Google as GoogleIcon } from '@mui/icons-material';
import { motion } from 'framer-motion';
import { fadeIn, scaleIn } from '@/lib/theme';

export default function LoginPage() {
  const handleGoogleSignIn = () => {
    signIn('google', { callbackUrl: '/dashboard' });
  };

  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: (theme) =>
          `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${alpha(
            '#00E599',
            0.03
          )} 100%)`,
        position: 'relative',
        overflow: 'hidden',
        '&::before': {
          content: '""',
          position: 'absolute',
          top: '-50%',
          right: '-50%',
          width: '100%',
          height: '100%',
          background: `radial-gradient(circle, ${alpha('#00E599', 0.08)} 0%, transparent 70%)`,
          animation: 'pulse 8s ease-in-out infinite',
        },
        '@keyframes pulse': {
          '0%, 100%': { opacity: 0.3 },
          '50%': { opacity: 0.6 },
        },
      }}
    >
      <Container maxWidth="sm">
        <motion.div {...{ ...fadeIn, transition: { ...fadeIn.transition, ease: ['easeInOut'] } }}>
          <Paper
            elevation={0}
            sx={{
              p: { xs: 4, sm: 6 },
              textAlign: 'center',
              position: 'relative',
              zIndex: 1,
              backdropFilter: 'blur(20px)',
              background: (theme) => alpha(theme.palette.background.paper, 0.8),
              border: (theme) => `1px solid ${theme.palette.divider}`,
            }}
          >
            <motion.div>
              <Stack spacing={4}>
                {/* Logo/Brand */}
                <Box>
                  <Typography
                    variant="h3"
                    gutterBottom
                    sx={{
                      fontWeight: 700,
                      background: (theme) =>
                        `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      backgroundClip: 'text',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                    }}
                  >
                    OVR System
                  </Typography>
                  <Typography variant="h6" color="text.secondary" sx={{ mb: 1 }}>
                    Gama Hospital
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    Occurrence Variance Reporting System
                  </Typography>
                </Box>

                {/* Sign In Section */}
                <Box>
                  <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                    Sign in with your Gama Hospital account
                  </Typography>

                  <Button
                    fullWidth
                    size="large"
                    variant="contained"
                    startIcon={<GoogleIcon />}
                    onClick={handleGoogleSignIn}
                    sx={{
                      py: 1.5,
                      fontSize: '1rem',
                      fontWeight: 600,
                      background: (theme) =>
                        `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                      '&:hover': {
                        background: (theme) =>
                          `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                        transform: 'translateY(-2px)',
                      },
                    }}
                  >
                    Continue with Google
                  </Button>
                </Box>

                {/* Footer Note */}
                <Typography variant="caption" color="text.secondary" sx={{ pt: 2 }}>
                  Access restricted to @gamahospital.com accounts only
                </Typography>
              </Stack>
            </motion.div>
          </Paper>
        </motion.div>

        {/* Decorative elements */}
        <Box
          sx={{
            position: 'absolute',
            bottom: '10%',
            left: '10%',
            width: 100,
            height: 100,
            borderRadius: '50%',
            background: (theme) => alpha(theme.palette.primary.main, 0.1),
            filter: 'blur(40px)',
            animation: 'float 6s ease-in-out infinite',
            '@keyframes float': {
              '0%, 100%': { transform: 'translateY(0px)' },
              '50%': { transform: 'translateY(-20px)' },
            },
          }}
        />
      </Container>
    </Box>
  );
}