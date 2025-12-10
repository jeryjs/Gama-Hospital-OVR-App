'use client';

import { Add, Description } from '@mui/icons-material';
import { Box, Button, Paper, Stack, Typography, alpha } from '@mui/material';
import Link from 'next/link';
import { motion } from 'framer-motion';

export default function IncidentViewIndexPage() {
    return (
        <Box
            component={motion.div}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                minHeight: '60vh',
            }}
        >
            <Paper
                elevation={0}
                sx={{
                    p: 6,
                    textAlign: 'center',
                    maxWidth: 400,
                    borderRadius: 4,
                    bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
                    border: '1px dashed',
                    borderColor: 'divider',
                }}
            >
                <Box
                    sx={{
                        width: 80,
                        height: 80,
                        borderRadius: '50%',
                        bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        mx: 'auto',
                        mb: 3,
                    }}
                >
                    <Description sx={{ fontSize: 40, color: 'primary.main' }} />
                </Box>

                <Typography variant="h5" fontWeight={600} gutterBottom>
                    Select an Incident
                </Typography>
                <Typography color="text.secondary" sx={{ mb: 4 }}>
                    Choose an incident from the sidebar to view details, or create a new report.
                </Typography>

                <Stack direction="row" spacing={2} justifyContent="center">
                    <Button
                        variant="contained"
                        startIcon={<Add />}
                        component={Link}
                        href="/incidents/new"
                    >
                        New Report
                    </Button>
                </Stack>
            </Paper>
        </Box>
    );
}
