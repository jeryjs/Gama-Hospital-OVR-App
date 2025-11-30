'use client';

import { fadeIn } from '@/lib/theme';
import { Microsoft as MicrosoftIcon } from '@mui/icons-material';
import {
  Alert,
  Box,
  Button,
  Container,
  Paper,
  Stack,
  Typography,
  alpha,
} from '@mui/material';
import { motion } from 'framer-motion';
import { signIn, useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

export default function LoginPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isSigningIn, setIsSigningIn] = useState(false);

  // Initialize error state from URL params directly
  const errorParam = searchParams.get('error');
  const [error, setError] = useState<string | null>(() => {
    if (errorParam === 'AccessDenied') {
      return 'Access denied. Please ensure you are using a @gamahospital.com email address.';
    } else if (errorParam === 'Configuration') {
      return 'Authentication configuration error. Please contact support.';
    } else if (errorParam) {
      return 'An authentication error occurred. Please try again.';
    }
    return null;
  });

  useEffect(() => {
    // Redirect if already authenticated
    if (session) {
      // Get callback URL, but sanitize it to prevent redirect loops
      let callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

      // Prevent redirect loops by checking if callback contains /login
      if (callbackUrl.includes('/login') || callbackUrl.includes('%2Flogin')) {
        callbackUrl = '/dashboard';
      }

      // Limit callback URL length to prevent header size issues
      if (callbackUrl.length > 200) {
        callbackUrl = '/dashboard';
      }

      router.replace(callbackUrl);
    }
  }, [session, searchParams, router]);

  const handleSignIn = async () => {
    if (isSigningIn) return; // Prevent spam clicking

    setIsSigningIn(true);
    setError(null);

    try {
      // Get callback URL and sanitize it
      let callbackUrl = searchParams.get('callbackUrl') || '/dashboard';

      // Prevent redirect loops
      if (callbackUrl.includes('/login') || callbackUrl.includes('%2Flogin')) {
        callbackUrl = '/dashboard';
      }

      // Limit length to prevent header size issues
      if (callbackUrl.length > 200) {
        callbackUrl = '/dashboard';
      }

      await signIn('azure-ad', {
        callbackUrl,
        redirect: true,
      });
    } catch (err) {
      console.error('Sign in error:', err);
      setError('Failed to initiate sign in. Please try again.');
      setIsSigningIn(false);
    }
  };

  // Loading state while checking session
  if (status === 'loading') {
    return (
      <Box
        sx={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: (theme) =>
            `linear-gradient(135deg, ${theme.palette.background.default} 0%, ${alpha(theme.palette.primary.main, 0.03)} 100%)`,
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: { xs: 4, sm: 6 },
            textAlign: 'center',
            backdropFilter: 'blur(20px)',
            background: (theme) => alpha(theme.palette.background.paper, 0.8),
            border: (theme) => `1px solid ${theme.palette.divider}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 2,
          }}
        >
          <Typography variant="h6" color="text.secondary" sx={{ mb: 2 }}>
            Checking authentication...
          </Typography>
          <Box
            sx={{
              width: 32,
              height: 32,
              border: (theme) => `3px solid ${alpha(theme.palette.primary.main, 0.2)}`,
              borderTop: (theme) => `3px solid ${theme.palette.primary.main}`,
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              '@keyframes spin': {
                to: { transform: 'rotate(360deg)' },
              },
            }}
          />
        </Paper>
      </Box>
    );
  }

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

              {/* Error Alert */}
              {error && (
                <Alert
                  severity="error"
                  onClose={() => setError(null)}
                  sx={{ textAlign: 'left' }}
                >
                  {error}
                </Alert>
              )}

              {/* Sign In Section */}
              <Box>
                <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
                  Sign in with your Gama Hospital account
                </Typography>

                <Button
                  fullWidth
                  size="large"
                  variant="contained"
                  startIcon={isSigningIn ? null : <MicrosoftIcon />}
                  onClick={handleSignIn}
                  disabled={isSigningIn}
                  sx={{
                    py: 1.5,
                    fontSize: '1rem',
                    fontWeight: 600,
                    background: (theme) =>
                      isSigningIn
                        ? theme.palette.action.disabledBackground
                        : `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
                    '&:hover': {
                      background: (theme) =>
                        `linear-gradient(135deg, ${theme.palette.primary.dark}, ${theme.palette.secondary.dark})`,
                      transform: 'translateY(-2px)',
                    },
                    '&.Mui-disabled': {
                      background: (theme) => theme.palette.action.disabledBackground,
                      color: (theme) => theme.palette.action.disabled,
                    },
                    transition: 'all 0.3s ease',
                  }}
                >
                  {isSigningIn ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <Box
                        sx={{
                          width: 20,
                          height: 20,
                          border: (theme) => `2px solid ${alpha('#fff', 0.3)}`,
                          borderTop: (theme) => `2px solid #fff`,
                          borderRadius: '50%',
                          animation: 'spin 0.8s linear infinite',
                        }}
                      />
                      <span>Signing in...</span>
                    </Box>
                  ) : (
                    'Sign in with Microsoft'
                  )}
                </Button>
              </Box>

              {/* Footer Note */}
              <Typography variant="caption" color="text.secondary" sx={{ pt: 2 }}>
                Access restricted to @gamahospital.com accounts only
              </Typography>
            </Stack>
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