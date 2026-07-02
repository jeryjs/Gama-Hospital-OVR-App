'use client';

import { ArrowBack as ArrowBackIcon, Login as LoginIcon } from '@mui/icons-material';
import { Box, Button, IconButton, InputAdornment, Stack, TextField, Tooltip, Typography, alpha } from '@mui/material';
import { useState } from 'react';

interface PasswordSignInCardProps {
  employeeId: string;
  displayName: string;
  submitting: boolean;
  password: string;
  onPasswordChange: (value: string) => void;
  onSignIn: () => void;
  onBack: () => void;
}

export function PasswordSignInCard({
  employeeId,
  displayName,
  submitting,
  password,
  onPasswordChange,
  onSignIn,
  onBack,
}: PasswordSignInCardProps) {
  const [showPassword, setShowPassword] = useState(false);

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') onSignIn();
  };

  return (
    <Stack spacing={3} sx={{ textAlign: 'left' }}>
      {/* User identity banner */}
      <Box
        sx={{
          p: 2.5,
          borderRadius: 3,
          background: (theme) =>
            `linear-gradient(135deg, ${alpha(theme.palette.primary.main, 0.1)}, ${alpha(theme.palette.secondary.main, 0.06)})`,
          border: (theme) => `1px solid ${alpha(theme.palette.primary.main, 0.16)}`,
        }}
      >
        <Stack direction="row" spacing={2} sx={{ alignItems: 'center', justifyContent: 'space-between' }}>
          <Box>
            <Typography variant="overline" sx={{ color: 'primary.main', fontWeight: 700, lineHeight: 1 }}>
              Welcome back
            </Typography>
            <Typography variant="h6" sx={{ fontWeight: 800, mt: 0.25 }}>
              {displayName || employeeId}
            </Typography>
            <Typography variant="caption" color="text.secondary">
              Staff ID: {employeeId}
            </Typography>
          </Box>
          <Tooltip title="Not you? Use a different ID">
            <IconButton onClick={onBack} size="small" sx={{ color: 'text.secondary' }}>
              <ArrowBackIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Stack>
      </Box>

      {/* Password field */}
      <Stack spacing={1.5}>
        <Typography variant="subtitle2" color="text.secondary">
          Enter your password to continue
        </Typography>
        <TextField
          label="Password"
          type={showPassword ? 'text' : 'password'}
          value={password}
          onChange={(e) => onPasswordChange(e.target.value)}
          onKeyDown={handleKeyDown}
          fullWidth
          autoFocus
          disabled={submitting}
          slotProps={{
            input: {
              endAdornment: (
                <InputAdornment position="end">
                  <IconButton
                    size="small"
                    onClick={() => setShowPassword((prev) => !prev)}
                    tabIndex={-1}
                    edge="end"
                    sx={{ color: 'text.secondary' }}
                  >
                    {showPassword ? (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z" />
                      </svg>
                    ) : (
                      <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z" />
                      </svg>
                    )}
                  </IconButton>
                </InputAdornment>
              ),
            },
          }}
        />
      </Stack>

      <Button
        fullWidth
        variant="contained"
        size="large"
        onClick={onSignIn}
        disabled={submitting || !password}
        startIcon={submitting ? undefined : <LoginIcon />}
        sx={{ py: 1.5, fontWeight: 700, borderRadius: 2 }}
      >
        {submitting ? 'Signing in...' : 'Sign in'}
      </Button>
    </Stack>
  );
}
