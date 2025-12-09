'use client';

import React, { useMemo } from 'react';
import {
    Paper,
    Box,
    Typography,
    Skeleton,
    List,
    ListItem,
    ListItemText,
    Chip,
} from '@mui/material';

interface StatusDistributionPieProps {
    loading?: boolean;
    onSegmentClick?: (status: string) => void;
}

interface StatusData {
    status: string;
    count: number;
    color: string;
    percentage: number;
}

// Placeholder data
const placeholderData: StatusData[] = [
    { status: 'Open', count: 23, color: '#2196f3', percentage: 14.7 },
    { status: 'In Progress', count: 45, color: '#ff9800', percentage: 28.8 },
    { status: 'Under Investigation', count: 18, color: '#9c27b0', percentage: 11.5 },
    { status: 'Pending Review', count: 31, color: '#00bcd4', percentage: 19.9 },
    { status: 'Closed', count: 39, color: '#4caf50', percentage: 25.0 },
];

interface SegmentData {
    segment: StatusData;
    strokeDasharray: string;
    strokeDashoffset: number;
}

const DonutChart = ({
    data,
    size = 180,
    thickness = 30,
    onSegmentClick,
}: {
    data: StatusData[];
    size?: number;
    thickness?: number;
    onSegmentClick?: (status: string) => void;
}) => {
    const total = data.reduce((sum, d) => sum + d.count, 0);
    const radius = (size - thickness) / 2;
    const circumference = 2 * Math.PI * radius;

    // Pre-calculate all segment data to avoid mutation during render
    const segmentData = useMemo((): SegmentData[] => {
        let accumulated = 0;
        return data.map((segment) => {
            const percentage = segment.count / total;
            const strokeDasharray = `${circumference * percentage} ${circumference * (1 - percentage)}`;
            const strokeDashoffset = -circumference * accumulated;
            accumulated += percentage;
            return { segment, strokeDasharray, strokeDashoffset };
        });
    }, [data, total, circumference]);

    return (
        <Box sx={{ position: 'relative', width: size, height: size }}>
            <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
                {segmentData.map(({ segment, strokeDasharray, strokeDashoffset }, index) => (
                    <circle
                        key={index}
                        cx={size / 2}
                        cy={size / 2}
                        r={radius}
                        fill="none"
                        stroke={segment.color}
                        strokeWidth={thickness}
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        transform={`rotate(-90 ${size / 2} ${size / 2})`}
                        style={{
                            cursor: onSegmentClick ? 'pointer' : 'default',
                            transition: 'all 0.2s ease-in-out',
                        }}
                        onClick={() => onSegmentClick?.(segment.status)}
                        onMouseEnter={(e) => {
                            (e.target as SVGCircleElement).style.opacity = '0.8';
                        }}
                        onMouseLeave={(e) => {
                            (e.target as SVGCircleElement).style.opacity = '1';
                        }}
                    />
                ))}
            </svg>
            {/* Center text */}
            <Box
                sx={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    textAlign: 'center',
                }}
            >
                <Typography variant="h4" fontWeight="bold">
                    {total}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                    Total
                </Typography>
            </Box>
        </Box>
    );
};

const Legend = ({
    data,
    onItemClick
}: {
    data: StatusData[];
    onItemClick?: (status: string) => void;
}) => {
    return (
        <List dense sx={{ width: '100%' }}>
            {data.map((item, index) => (
                <ListItem
                    key={index}
                    sx={{
                        px: 1,
                        py: 0.5,
                        borderRadius: 1,
                        cursor: onItemClick ? 'pointer' : 'default',
                        '&:hover': onItemClick ? {
                            bgcolor: 'action.hover',
                        } : {},
                    }}
                    onClick={() => onItemClick?.(item.status)}
                >
                    <Box
                        sx={{
                            width: 12,
                            height: 12,
                            borderRadius: '50%',
                            bgcolor: item.color,
                            mr: 1.5,
                            flexShrink: 0,
                        }}
                    />
                    <ListItemText
                        primary={item.status}
                        primaryTypographyProps={{ variant: 'body2' }}
                        sx={{ flex: 1 }}
                    />
                    <Chip
                        label={`${item.percentage.toFixed(1)}%`}
                        size="small"
                        sx={{
                            bgcolor: `${item.color}20`,
                            color: item.color,
                            fontWeight: 500,
                            fontSize: '0.75rem',
                        }}
                    />
                    <Typography
                        variant="body2"
                        color="text.secondary"
                        sx={{ ml: 1, minWidth: 30, textAlign: 'right' }}
                    >
                        {item.count}
                    </Typography>
                </ListItem>
            ))}
        </List>
    );
};

export default function StatusDistributionPie({
    loading = false,
    onSegmentClick,
}: StatusDistributionPieProps) {
    const data = placeholderData;

    if (loading) {
        return (
            <Paper
                elevation={0}
                sx={{
                    p: 3,
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'divider',
                }}
            >
                <Skeleton variant="text" width="60%" height={32} sx={{ mb: 2 }} />
                <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }}>
                    <Skeleton variant="circular" width={180} height={180} />
                </Box>
                {Array.from({ length: 5 }).map((_, i) => (
                    <Skeleton key={i} variant="text" height={36} sx={{ mb: 0.5 }} />
                ))}
            </Paper>
        );
    }

    return (
        <Paper
            elevation={0}
            sx={{
                p: 3,
                borderRadius: 2,
                border: '1px solid',
                borderColor: 'divider',
            }}
        >
            <Typography variant="h6" fontWeight="bold" gutterBottom>
                Status Distribution
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Current incident status breakdown
            </Typography>

            <Box sx={{ display: 'flex', justifyContent: 'center', mb: 3 }}>
                <DonutChart data={data} onSegmentClick={onSegmentClick} />
            </Box>

            <Legend data={data} onItemClick={onSegmentClick} />
        </Paper>
    );
}
