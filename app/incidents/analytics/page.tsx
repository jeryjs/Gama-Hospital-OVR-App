'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { AppLayout } from '@/components/AppLayout';
import {
    Box, Stack, Typography, Paper, Grid, Tabs, Tab,
    IconButton, Tooltip, Menu, MenuItem, Alert
} from '@mui/material';
import {
    Download, Print, Refresh, FilterList,
    Dashboard, Timeline, PieChart, BarChart, TableChart
} from '@mui/icons-material';
import { motion } from 'framer-motion';
import { fadeIn } from '@/lib/theme';

// Import report components
import { DateRangeSelector } from './_components/DateRangeSelector';
import { ReportFilterPanel } from './_components/ReportFilterPanel';

// Date range type
type DateRangePreset = '7d' | '30d' | '90d' | '1y' | 'custom';

interface DateRange {
    start: Date;
    end: Date;
}

interface ReportFilters {
    locations: number[];
    departments: number[];
    statuses: string[];
    categories: string[];
}

export default function ReportsPage() {
    const { data: session } = useSession();

    // State
    const [datePreset, setDatePreset] = useState<DateRangePreset>('30d');
    const [dateRange, setDateRange] = useState<DateRange>(() => {
        const end = new Date();
        const start = new Date();
        start.setDate(start.getDate() - 30);
        return { start, end };
    });
    const [filters, setFilters] = useState<ReportFilters>({
        locations: [],
        departments: [],
        statuses: [],
        categories: [],
    });
    const [activeTab, setActiveTab] = useState(0);
    const [filtersOpen, setFiltersOpen] = useState(false);
    const [exportAnchor, setExportAnchor] = useState<null | HTMLElement>(null);

    // Handle date range change
    const handleDatePresetChange = (preset: DateRangePreset) => {
        setDatePreset(preset);
        const end = new Date();
        const start = new Date();

        switch (preset) {
            case '7d': start.setDate(start.getDate() - 7); break;
            case '30d': start.setDate(start.getDate() - 30); break;
            case '90d': start.setDate(start.getDate() - 90); break;
            case '1y': start.setFullYear(start.getFullYear() - 1); break;
        }

        setDateRange({ start, end });
    };

    // Export handlers
    const handleExport = (format: string) => {
        console.log(`Exporting as ${format}`);
        setExportAnchor(null);
    };

    const tabs = [
        { label: 'Overview', icon: <Dashboard /> },
        { label: 'Trends', icon: <Timeline /> },
        { label: 'Distribution', icon: <PieChart /> },
        { label: 'Comparison', icon: <BarChart /> },
        { label: 'Details', icon: <TableChart /> },
    ];

    const hasActiveFilters = filters.locations.length > 0 ||
        filters.departments.length > 0 ||
        filters.statuses.length > 0 ||
        filters.categories.length > 0;

    return (
        <AppLayout>
            <Box>
                <motion.div {...{ ...fadeIn, transition: { ...fadeIn.transition, ease: ['easeInOut'] } }}>
                    <Stack spacing={3}>
                        {/* Header */}
                        <Stack direction="row" justifyContent="space-between" alignItems="flex-start" flexWrap="wrap" gap={2}>
                            <Box>
                                <Typography variant="h4" fontWeight={700} gutterBottom>
                                    Incident Reports & Analytics
                                </Typography>
                                <Typography variant="body1" color="text.secondary">
                                    Comprehensive insights into incident patterns, performance metrics, and operational trends
                                </Typography>
                            </Box>

                            <Stack direction="row" spacing={1} alignItems="center">
                                <DateRangeSelector
                                    preset={datePreset}
                                    dateRange={dateRange}
                                    onPresetChange={handleDatePresetChange}
                                    onRangeChange={setDateRange}
                                />

                                <Tooltip title="Filters">
                                    <IconButton onClick={() => setFiltersOpen(!filtersOpen)}>
                                        <FilterList color={hasActiveFilters ? 'primary' : 'inherit'} />
                                    </IconButton>
                                </Tooltip>

                                <Tooltip title="Refresh">
                                    <IconButton onClick={() => console.log('Refresh')}>
                                        <Refresh />
                                    </IconButton>
                                </Tooltip>

                                <Tooltip title="Export">
                                    <IconButton onClick={(e) => setExportAnchor(e.currentTarget)}>
                                        <Download />
                                    </IconButton>
                                </Tooltip>

                                <Tooltip title="Print">
                                    <IconButton onClick={() => window.print()}>
                                        <Print />
                                    </IconButton>
                                </Tooltip>
                            </Stack>
                        </Stack>

                        {/* Filter Panel (collapsible) */}
                        {filtersOpen && (
                            <ReportFilterPanel
                                filters={filters}
                                onChange={setFilters}
                                onClose={() => setFiltersOpen(false)}
                            />
                        )}

                        {/* Tabs */}
                        <Paper sx={{ px: 2 }}>
                            <Tabs value={activeTab} onChange={(_, v) => setActiveTab(v)}>
                                {tabs.map((tab) => (
                                    <Tab key={tab.label} icon={tab.icon} label={tab.label} iconPosition="start" />
                                ))}
                            </Tabs>
                        </Paper>

                        {/* Tab Content */}
                        {activeTab === 0 && (
                            <OverviewTab dateRange={dateRange} filters={filters} />
                        )}
                        {activeTab === 1 && (
                            <TrendsTab dateRange={dateRange} filters={filters} />
                        )}
                        {activeTab === 2 && (
                            <DistributionTab dateRange={dateRange} filters={filters} />
                        )}
                        {activeTab === 3 && (
                            <ComparisonTab dateRange={dateRange} filters={filters} />
                        )}
                        {activeTab === 4 && (
                            <DetailsTab dateRange={dateRange} filters={filters} />
                        )}
                    </Stack>
                </motion.div>
            </Box>

            {/* Export Menu */}
            <Menu anchorEl={exportAnchor} open={Boolean(exportAnchor)} onClose={() => setExportAnchor(null)}>
                <MenuItem onClick={() => handleExport('pdf')}>Export as PDF</MenuItem>
                <MenuItem onClick={() => handleExport('png')}>Export as PNG</MenuItem>
                <MenuItem onClick={() => handleExport('csv')}>Export Data (CSV)</MenuItem>
                <MenuItem onClick={() => handleExport('excel')}>Export Data (Excel)</MenuItem>
            </Menu>
        </AppLayout>
    );
}

// Tab Components
interface TabProps {
    dateRange: DateRange;
    filters: ReportFilters;
}

function OverviewTab({ dateRange, filters }: TabProps) {
    return (
        <Grid container spacing={3}>
            {/* Executive Summary Row */}
            <Grid size={{ xs: 12 }}>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>Executive Summary</Typography>
                    <Alert severity="info" sx={{ mt: 2 }}>
                        Executive summary cards showing key metrics: Total incidents, Open cases, Avg resolution time, Compliance rate
                    </Alert>
                </Paper>
            </Grid>

            {/* Alerts */}
            <Grid size={{ xs: 12, lg: 4 }}>
                <Paper sx={{ p: 3, height: '100%' }}>
                    <Typography variant="h6" gutterBottom>Active Alerts</Typography>
                    <Alert severity="warning" sx={{ mt: 2 }}>
                        Alerts panel showing overdue items, high-risk incidents, and action items
                    </Alert>
                </Paper>
            </Grid>

            {/* Trend Overview */}
            <Grid size={{ xs: 12, lg: 8 }}>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>Incident Trend</Typography>
                    <Alert severity="info" sx={{ mt: 2 }}>
                        Line chart showing incident trends over the selected period
                    </Alert>
                </Paper>
            </Grid>

            {/* Status & Severity */}
            <Grid size={{ xs: 12, md: 6 }}>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>Status Distribution</Typography>
                    <Alert severity="info" sx={{ mt: 2 }}>
                        Pie chart showing distribution by status (Draft, Submitted, Under Review, etc.)
                    </Alert>
                </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>Risk Matrix</Typography>
                    <Alert severity="info" sx={{ mt: 2 }}>
                        Scatter plot showing incidents by risk impact vs likelihood
                    </Alert>
                </Paper>
            </Grid>

            {/* Quick Stats */}
            <Grid size={{ xs: 12, md: 6 }}>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>Compliance Metrics</Typography>
                    <Alert severity="info" sx={{ mt: 2 }}>
                        Compliance gauges: Reporting compliance, Investigation completion, Action closure rate
                    </Alert>
                </Paper>
            </Grid>

            <Grid size={{ xs: 12, md: 6 }}>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>Corrective Actions</Typography>
                    <Alert severity="info" sx={{ mt: 2 }}>
                        Progress tracker for open/closed corrective actions
                    </Alert>
                </Paper>
            </Grid>
        </Grid>
    );
}

function TrendsTab({ dateRange, filters }: TabProps) {
    return (
        <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>Incident Trend Analysis</Typography>
                    <Alert severity="info" sx={{ mt: 2 }}>
                        Detailed line chart with incident counts over time, with ability to toggle by category/status
                    </Alert>
                </Paper>
            </Grid>
            <Grid size={{ xs: 12 }}>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>Seasonal Patterns</Typography>
                    <Alert severity="info" sx={{ mt: 2 }}>
                        Calendar heatmap showing incident density by day/week/month
                    </Alert>
                </Paper>
            </Grid>
            <Grid size={{ xs: 12, lg: 6 }}>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>Response Time Analytics</Typography>
                    <Alert severity="info" sx={{ mt: 2 }}>
                        Box plot showing response times by workflow stage
                    </Alert>
                </Paper>
            </Grid>
            <Grid size={{ xs: 12, lg: 6 }}>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>Workflow Bottlenecks</Typography>
                    <Alert severity="info" sx={{ mt: 2 }}>
                        Sankey or funnel chart showing where incidents get stuck
                    </Alert>
                </Paper>
            </Grid>
        </Grid>
    );
}

function DistributionTab({ dateRange, filters }: TabProps) {
    return (
        <Grid container spacing={3}>
            <Grid size={{ xs: 12, md: 6 }}>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>Status Distribution</Typography>
                    <Alert severity="info" sx={{ mt: 2 }}>
                        Donut chart showing incidents by status
                    </Alert>
                </Paper>
            </Grid>
            <Grid size={{ xs: 12, md: 6 }}>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>Category Breakdown</Typography>
                    <Alert severity="info" sx={{ mt: 2 }}>
                        Treemap or horizontal bar chart showing incidents by taxonomy category
                    </Alert>
                </Paper>
            </Grid>
            <Grid size={{ xs: 12 }}>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>Severity Heatmap</Typography>
                    <Alert severity="info" sx={{ mt: 2 }}>
                        Heatmap showing severity levels across departments/locations
                    </Alert>
                </Paper>
            </Grid>
        </Grid>
    );
}

function ComparisonTab({ dateRange, filters }: TabProps) {
    return (
        <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>Location Comparison</Typography>
                    <Alert severity="info" sx={{ mt: 2 }}>
                        Grouped bar chart comparing incident counts across locations
                    </Alert>
                </Paper>
            </Grid>
            <Grid size={{ xs: 12 }}>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>User Activity Metrics</Typography>
                    <Alert severity="info" sx={{ mt: 2 }}>
                        Table/chart showing user activity: reports submitted, investigations completed, actions closed
                    </Alert>
                </Paper>
            </Grid>
        </Grid>
    );
}

function DetailsTab({ dateRange, filters }: TabProps) {
    return (
        <Grid container spacing={3}>
            <Grid size={{ xs: 12 }}>
                <Paper sx={{ p: 3 }}>
                    <Typography variant="h6" gutterBottom>Detailed Incident Data</Typography>
                    <Alert severity="info" sx={{ mt: 2 }}>
                        Data table with advanced filtering, sorting, and pagination. Includes export capabilities for CSV/Excel.
                    </Alert>
                </Paper>
            </Grid>
        </Grid>
    );
}
