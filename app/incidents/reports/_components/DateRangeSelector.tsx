'use client';

import { useState, useRef } from 'react';
import {
    Box, Button, ButtonGroup, Popover, Stack, Typography,
    TextField, Divider, alpha
} from '@mui/material';
import { DateRange as DateRangeIcon, CalendarMonth } from '@mui/icons-material';
import { format, isValid } from 'date-fns';

type DateRangePreset = '7d' | '30d' | '90d' | '1y' | 'custom';

interface DateRange {
    start: Date;
    end: Date;
}

interface DateRangeSelectorProps {
    preset: DateRangePreset;
    dateRange: DateRange;
    onPresetChange: (preset: DateRangePreset) => void;
    onRangeChange: (range: DateRange) => void;
}

const PRESETS: { value: DateRangePreset; label: string }[] = [
    { value: '7d', label: '7D' },
    { value: '30d', label: '30D' },
    { value: '90d', label: '90D' },
    { value: '1y', label: '1Y' },
    { value: 'custom', label: 'Custom' },
];

export function DateRangeSelector({
    preset,
    dateRange,
    onPresetChange,
    onRangeChange,
}: DateRangeSelectorProps) {
    const [anchorEl, setAnchorEl] = useState<HTMLButtonElement | null>(null);
    const [tempStart, setTempStart] = useState(format(dateRange.start, 'yyyy-MM-dd'));
    const [tempEnd, setTempEnd] = useState(format(dateRange.end, 'yyyy-MM-dd'));

    const handlePresetClick = (newPreset: DateRangePreset) => {
        if (newPreset === 'custom') {
            // Don't close, let the popover handle custom selection
            return;
        }
        onPresetChange(newPreset);
        setAnchorEl(null);
    };

    const handleCustomClick = (event: React.MouseEvent<HTMLButtonElement>) => {
        setAnchorEl(event.currentTarget);
        setTempStart(format(dateRange.start, 'yyyy-MM-dd'));
        setTempEnd(format(dateRange.end, 'yyyy-MM-dd'));
    };

    const handleApplyCustom = () => {
        const startDate = new Date(tempStart);
        const endDate = new Date(tempEnd);

        if (isValid(startDate) && isValid(endDate) && startDate <= endDate) {
            onRangeChange({ start: startDate, end: endDate });
            onPresetChange('custom');
            setAnchorEl(null);
        }
    };

    const handleClose = () => {
        setAnchorEl(null);
    };

    const open = Boolean(anchorEl);

    const displayRange = () => {
        const startStr = format(dateRange.start, 'MMM d, yyyy');
        const endStr = format(dateRange.end, 'MMM d, yyyy');
        return `${startStr} - ${endStr}`;
    };

    return (
        <Box>
            <Stack direction="row" spacing={0.5} alignItems="center">
                <ButtonGroup size="small" variant="outlined">
                    {PRESETS.filter(p => p.value !== 'custom').map((p) => (
                        <Button
                            key={p.value}
                            onClick={() => handlePresetClick(p.value)}
                            variant={preset === p.value ? 'contained' : 'outlined'}
                            sx={{
                                minWidth: 40,
                                px: 1.5,
                                fontSize: '0.75rem',
                                fontWeight: preset === p.value ? 600 : 400,
                            }}
                        >
                            {p.label}
                        </Button>
                    ))}
                    <Button
                        onClick={handleCustomClick}
                        variant={preset === 'custom' ? 'contained' : 'outlined'}
                        sx={{
                            minWidth: 'auto',
                            px: 1.5,
                            fontSize: '0.75rem',
                            fontWeight: preset === 'custom' ? 600 : 400,
                        }}
                        startIcon={<CalendarMonth sx={{ fontSize: 16 }} />}
                    >
                        {preset === 'custom' ? displayRange() : 'Custom'}
                    </Button>
                </ButtonGroup>
            </Stack>

            <Popover
                open={open}
                anchorEl={anchorEl}
                onClose={handleClose}
                anchorOrigin={{
                    vertical: 'bottom',
                    horizontal: 'right',
                }}
                transformOrigin={{
                    vertical: 'top',
                    horizontal: 'right',
                }}
                slotProps={{
                    paper: {
                        sx: {
                            mt: 1,
                            p: 2,
                            minWidth: 320,
                            bgcolor: 'background.paper',
                        }
                    }
                }}
            >
                <Stack spacing={2}>
                    <Stack direction="row" alignItems="center" spacing={1}>
                        <DateRangeIcon color="primary" fontSize="small" />
                        <Typography variant="subtitle2" fontWeight={600}>
                            Custom Date Range
                        </Typography>
                    </Stack>

                    <Divider />

                    <Stack direction="row" spacing={2}>
                        <TextField
                            label="Start Date"
                            type="date"
                            size="small"
                            value={tempStart}
                            onChange={(e) => setTempStart(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                        />
                        <TextField
                            label="End Date"
                            type="date"
                            size="small"
                            value={tempEnd}
                            onChange={(e) => setTempEnd(e.target.value)}
                            InputLabelProps={{ shrink: true }}
                            fullWidth
                        />
                    </Stack>

                    {/* Quick presets within popover */}
                    <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                            Quick Select
                        </Typography>
                        <Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
                            {[
                                { label: 'This Week', days: 7 },
                                { label: 'This Month', days: 30 },
                                { label: 'This Quarter', days: 90 },
                                { label: 'This Year', days: 365 },
                            ].map((quick) => (
                                <Button
                                    key={quick.label}
                                    size="small"
                                    variant="outlined"
                                    onClick={() => {
                                        const end = new Date();
                                        const start = new Date();
                                        start.setDate(start.getDate() - quick.days);
                                        setTempStart(format(start, 'yyyy-MM-dd'));
                                        setTempEnd(format(end, 'yyyy-MM-dd'));
                                    }}
                                    sx={{
                                        fontSize: '0.7rem',
                                        py: 0.5,
                                        px: 1,
                                        minWidth: 'auto',
                                        borderColor: (theme) => alpha(theme.palette.primary.main, 0.3),
                                        '&:hover': {
                                            borderColor: 'primary.main',
                                            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
                                        }
                                    }}
                                >
                                    {quick.label}
                                </Button>
                            ))}
                        </Stack>
                    </Box>

                    <Divider />

                    <Stack direction="row" spacing={1} justifyContent="flex-end">
                        <Button size="small" onClick={handleClose}>
                            Cancel
                        </Button>
                        <Button
                            size="small"
                            variant="contained"
                            onClick={handleApplyCustom}
                            disabled={!tempStart || !tempEnd || new Date(tempStart) > new Date(tempEnd)}
                        >
                            Apply
                        </Button>
                    </Stack>
                </Stack>
            </Popover>
        </Box>
    );
}
