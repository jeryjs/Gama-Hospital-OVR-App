/**
 * @fileoverview Report Utilities
 * 
 * Data transformation utilities for chart-ready report data formats
 */

import { format, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, startOfDay, startOfWeek, startOfMonth, differenceInDays } from 'date-fns';

// Types
export interface DateRange {
    start: Date;
    end: Date;
}

export interface TrendDataPoint {
    date: string;
    count: number;
    label: string;
}

export interface GroupedData<T> {
    key: string;
    items: T[];
    count: number;
}

/**
 * Get appropriate date grouping based on range
 */
export function getDateGrouping(dateRange: DateRange): 'day' | 'week' | 'month' {
    const days = differenceInDays(dateRange.end, dateRange.start);
    if (days <= 14) return 'day';
    if (days <= 90) return 'week';
    return 'month';
}

/**
 * Generate date labels for the given range
 */
export function generateDateLabels(dateRange: DateRange): string[] {
    const grouping = getDateGrouping(dateRange);

    switch (grouping) {
        case 'day':
            return eachDayOfInterval(dateRange).map((d) => format(d, 'MMM dd'));
        case 'week':
            return eachWeekOfInterval(dateRange).map((d) => format(d, 'MMM dd'));
        case 'month':
            return eachMonthOfInterval(dateRange).map((d) => format(d, 'MMM yyyy'));
    }
}

/**
 * Group incidents by date
 */
export function groupByDate<T extends { createdAt: string | Date }>(
    items: T[],
    dateRange: DateRange
): TrendDataPoint[] {
    const grouping = getDateGrouping(dateRange);
    const counts = new Map<string, number>();

    // Initialize all dates with 0
    const dates = grouping === 'day'
        ? eachDayOfInterval(dateRange)
        : grouping === 'week'
            ? eachWeekOfInterval(dateRange)
            : eachMonthOfInterval(dateRange);

    dates.forEach((d) => {
        const key = format(d, 'yyyy-MM-dd');
        counts.set(key, 0);
    });

    // Count items
    items.forEach((item) => {
        const date = new Date(item.createdAt);
        let key: string;

        switch (grouping) {
            case 'day':
                key = format(startOfDay(date), 'yyyy-MM-dd');
                break;
            case 'week':
                key = format(startOfWeek(date), 'yyyy-MM-dd');
                break;
            case 'month':
                key = format(startOfMonth(date), 'yyyy-MM-dd');
                break;
        }

        if (counts.has(key)) {
            counts.set(key, (counts.get(key) || 0) + 1);
        }
    });

    // Convert to array
    return Array.from(counts.entries()).map(([date, count]) => ({
        date,
        count,
        label: format(new Date(date), grouping === 'month' ? 'MMM yyyy' : 'MMM dd'),
    }));
}

/**
 * Group items by a key
 */
export function groupBy<T>(items: T[], keyFn: (item: T) => string): GroupedData<T>[] {
    const groups = new Map<string, T[]>();

    items.forEach((item) => {
        const key = keyFn(item);
        if (!groups.has(key)) {
            groups.set(key, []);
        }
        groups.get(key)!.push(item);
    });

    return Array.from(groups.entries()).map(([key, groupItems]) => ({
        key,
        items: groupItems,
        count: groupItems.length,
    }));
}

/**
 * Calculate percentage distribution
 */
export function calculateDistribution<T>(
    items: T[],
    keyFn: (item: T) => string
): { key: string; count: number; percentage: number }[] {
    const groups = groupBy(items, keyFn);
    const total = items.length || 1;

    return groups.map((group) => ({
        key: group.key,
        count: group.count,
        percentage: Math.round((group.count / total) * 100),
    })).sort((a, b) => b.count - a.count);
}

/**
 * Calculate trend percentage change
 */
export function calculateTrendChange(current: number, previous: number): number {
    if (previous === 0) return current > 0 ? 100 : 0;
    return Math.round(((current - previous) / previous) * 100);
}

/**
 * Format duration in days/hours
 */
export function formatDuration(hours: number): string {
    if (hours < 24) return `${Math.round(hours)}h`;
    const days = Math.round(hours / 24);
    return `${days}d`;
}

/**
 * Get severity color
 */
export function getSeverityColor(severity: string): string {
    const colors: Record<string, string> = {
        critical: '#EF4444',
        high: '#F97316',
        medium: '#F59E0B',
        low: '#10B981',
    };
    return colors[severity.toLowerCase()] || '#6B7280';
}

/**
 * Calculate heat map intensity
 */
export function calculateHeatIntensity(value: number, max: number): number {
    if (max === 0) return 0;
    return Math.min(1, value / max);
}

/**
 * Generate color scale
 */
export function getHeatColor(intensity: number): string {
    // Green to Yellow to Red
    if (intensity < 0.33) {
        return `rgba(16, 185, 129, ${0.2 + intensity * 0.8})`; // Green
    } else if (intensity < 0.66) {
        return `rgba(245, 158, 11, ${0.3 + intensity * 0.7})`; // Yellow/Orange
    } else {
        return `rgba(239, 68, 68, ${0.4 + intensity * 0.6})`; // Red
    }
}

/**
 * Calculate moving average
 */
export function calculateMovingAverage(data: number[], window: number): number[] {
    if (data.length < window) return data;

    const result: number[] = [];
    for (let i = 0; i < data.length; i++) {
        if (i < window - 1) {
            result.push(data[i]);
        } else {
            const slice = data.slice(i - window + 1, i + 1);
            const avg = slice.reduce((a, b) => a + b, 0) / window;
            result.push(Math.round(avg * 10) / 10);
        }
    }
    return result;
}

/**
 * Export data to CSV format
 */
export function toCSV<T extends Record<string, any>>(data: T[], columns: string[]): string {
    const header = columns.join(',');
    const rows = data.map((item) =>
        columns.map((col) => {
            const value = item[col];
            if (typeof value === 'string' && value.includes(',')) {
                return `"${value}"`;
            }
            return value ?? '';
        }).join(',')
    );
    return [header, ...rows].join('\n');
}
