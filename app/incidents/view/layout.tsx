'use client';

import { AppLayout } from '@/components/AppLayout';
import { Box } from '@mui/material';
import { useState, Suspense } from 'react';
import { IncidentsSidebar } from './IncidentsSidebar';

function SidebarWrapper({
    collapsed,
    onToggle
}: {
    collapsed: boolean;
    onToggle: () => void;
}) {
    return (
        <Suspense fallback={
            <Box sx={{
                width: collapsed ? 60 : 320,
                borderRight: '1px solid',
                borderColor: 'divider',
                height: '100%',
            }} />
        }>
            <IncidentsSidebar
                collapsed={collapsed}
                onToggle={onToggle}
            />
        </Suspense>
    );
}

export default function IncidentViewLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);

    return (
        <AppLayout>
            <Box sx={{ display: 'flex', height: 'calc(100vh - 64px)', overflow: 'hidden' }}>
                <SidebarWrapper
                    collapsed={sidebarCollapsed}
                    onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                />
                <Box sx={{ flex: 1, overflow: 'auto', p: 3 }}>
                    {children}
                </Box>
            </Box>
        </AppLayout>
    );
}
