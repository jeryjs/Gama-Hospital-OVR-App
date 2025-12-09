'use client';

import { useMemo, useState } from 'react';
import {
    alpha,
    Box,
    Paper,
    Skeleton,
    Stack,
    Tooltip,
    Typography,
} from '@mui/material';
import { CalendarMonth } from '@mui/icons-material';
import { format, eachDayOfInterval, startOfMonth, endOfMonth, getDay, subMonths } from 'date-fns';

interface DateRange {
    start: Date;
    end: Date;
}

interface SeasonalPatternsCalendarProps {
    dateRange: DateRange;
    loading?: boolean;
}

// Generate placeholder data
function generateCalendarData(dateRange: DateRange) {
    const days = eachDayOfInterval({ start: dateRange.start, end: dateRange.end });
    return days.map((date) => ({
        date,
        count: Math.floor(Math.random() * 10),
    }));
}

// Get intensity color based on count
function getIntensityColor(count: number, maxCount: number): string {
    if (count === 0) return 'transparent';
    const intensity = count / maxCount;
    if (intensity < 0.25) return alpha('#10B981', 0.3);
    if (intensity < 0.5) return alpha('#10B981', 0.5);
    if (intensity < 0.75) return alpha('#F59E0B', 0.6);
    return alpha('#EF4444', 0.7);
}

export function SeasonalPatternsCalendar({ dateRange, loading = false }: SeasonalPatternsCalendarProps) {
    const [hoveredDate, setHoveredDate] = useState<Date | null>(null);

    const data = useMemo(() => generateCalendarData(dateRange), [dateRange]);
    const maxCount = Math.max(...data.map((d) => d.count), 1);

    // Group by month
    const monthsData = useMemo(() => {
        const months: { month: Date; days: typeof data }[] = [];
        let currentMonth = startOfMonth(dateRange.start);

        while (currentMonth <= dateRange.end) {
            const monthEnd = endOfMonth(currentMonth);
            const monthDays = data.filter(
                (d) => d.date >= currentMonth && d.date <= monthEnd
            );
            months.push({ month: currentMonth, days: monthDays });
            currentMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1);
        }

        return months.slice(-3); // Show last 3 months
    }, [data, dateRange]);

    if (loading) {
        return (
            <Paper sx={{ p: 3, height: '100%' }}>
                <Stack spacing={2}>
                    <Skeleton variant="text" width={200} height={32} />
                    <Skeleton variant="rectangular" height={200} />
                </Stack>
            </Paper>
        );
    }

    const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

    return (
        <Paper sx={{ p: 3, height: '100%' }}>
            <Stack spacing={3}>
                <Stack direction="row" alignItems="center" spacing={1}>
                    <CalendarMonth color="primary" />
                    <Typography variant="h6" fontWeight={600}>
                        Seasonal Patterns Calendar
                    </Typography>
                </Stack>

                <Stack direction="row" spacing={4} sx={{ overflowX: 'auto', pb: 1 }}>
                    {monthsData.map(({ month, days }) => (
                        <Box key={month.toISOString()}>
                            <Typography variant="subtitle2" fontWeight={600} gutterBottom>
                                {format(month, 'MMMM yyyy')}
                            </Typography>

                            {/* Week day headers */}
                            <Stack direction="row" spacing={0.5} mb={0.5}>
                                {weekDays.map((day) => (
                                    <Typography
                                        key={day}
                                        variant="caption"
                                        color="text.secondary"
                                        sx={{ width: 24, textAlign: 'center', fontSize: '0.65rem' }}
                                    >
                                        {day[0]}
                                    </Typography>
                                ))}
                            </Stack>

                            {/* Calendar grid */}
                            <Box
                                sx={{
                                    display: 'grid',
                                    gridTemplateColumns: 'repeat(7, 24px)',
                                    gap: 0.5,
                                }}
                            >
                                {/* Empty cells for first week offset */}
                                {Array.from({ length: getDay(startOfMonth(month)) }).map((_, i) => (
                                    <Box key={`empty-${i}`} sx={{ width: 24, height: 24 }} />
                                ))}

                                {/* Day cells */}
                                {days.map(({ date, count }) => (
                                    <Tooltip
                                        key={date.toISOString()}
                                        title={`${format(date, 'MMM d, yyyy')}: ${count} incidents`}
                                        arrow
                                    >
                                        <Box
                                            onMouseEnter={() => setHoveredDate(date)}
                                            onMouseLeave={() => setHoveredDate(null)}
                                            sx={{
                                                width: 24,
                                                height: 24,
                                                borderRadius: 0.5,
                                                bgcolor: getIntensityColor(count, maxCount),
                                                border: 1,
                                                borderColor: hoveredDate?.getTime() === date.getTime() ? 'primary.main' : 'divider',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                cursor: 'pointer',
                                                transition: 'all 0.2s',
                                                '&:hover': {
                                                    transform: 'scale(1.1)',
                                                    zIndex: 1,
                                                },
                                            }}
                                        >
                                            <Typography variant="caption" sx={{ fontSize: '0.6rem', color: count > maxCount * 0.5 ? 'white' : 'text.secondary' }}>
                                                {date.getDate()}
                                            </Typography>
                                        </Box>
                                    </Tooltip>
                                ))}
                            </Box>
                        </Box>
                    ))}
                </Stack>

                {/* Legend */}
                <Stack direction="row" alignItems="center" spacing={2} justifyContent="center">
                    <Typography variant="caption" color="text.secondary">Less</Typography>
                    {[0, 0.25, 0.5, 0.75, 1].map((intensity) => (
                        <Box
                            key={intensity}
                            sx={{
                                width: 16,
                                height: 16,
                                borderRadius: 0.5,
                                bgcolor: intensity === 0 ? 'transparent' : getIntensityColor(intensity * maxCount, maxCount),
                                border: 1,
                                borderColor: 'divider',
                            }}
                        />
                    ))}
                    <Typography variant="caption" color="text.secondary">More</Typography>
                </Stack>
            </Stack>
        </Paper>
    );
}
