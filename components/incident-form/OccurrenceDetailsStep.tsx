'use client';

import {
  Box,
  TextField,
  Button,
  Stack,
  Paper,
  Typography,
  Grid,
  FormControl,
  FormLabel,
  RadioGroup,
  FormControlLabel,
  Radio,
  Collapse,
  alpha,
  Chip,
} from '@mui/material';
import { ArrowForward, ArrowBack } from '@mui/icons-material';
import { OVR_CATEGORIES } from '@/lib/ovr-categories';
import { useState } from 'react';

interface OccurrenceDetailsStepProps {
  formData: any;
  setFormData: (data: any) => void;
  onNext: () => void;
  onBack: () => void;
}

export function OccurrenceDetailsStep({
  formData,
  setFormData,
  onNext,
  onBack,
}: OccurrenceDetailsStepProps) {
  const [selectedCategory, setSelectedCategory] = useState(formData.occurrenceCategory || '');

  const handleChange = (field: string, value: any) => {
    setFormData({ ...formData, [field]: value });
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);
    handleChange('occurrenceCategory', categoryId);
    handleChange('occurrenceSubcategory', ''); // Reset subcategory
  };

  const selectedCategoryData = OVR_CATEGORIES.find((cat) => cat.id === selectedCategory);

  const isValid = () => {
    return (
      formData.occurrenceCategory &&
      formData.occurrenceSubcategory &&
      formData.description
    );
  };

  return (
    <Paper sx={{ p: 4 }}>
      <Stack spacing={4}>
        <Typography variant="h6" fontWeight={600}>
          Occurrence Details
        </Typography>

        {/* Category Selection */}
        <Box>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Classification of Occurrence / Variance *
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Select the category that best describes this occurrence
          </Typography>

          <Grid container spacing={1.5}>
            {OVR_CATEGORIES.map((category) => (
              <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={category.id}>
                <Box
                  onClick={() => handleCategorySelect(category.id)}
                  sx={{
                    p: 2,
                    borderRadius: 2,
                    border: (theme) =>
                      `2px solid ${
                        selectedCategory === category.id
                          ? theme.palette.primary.main
                          : theme.palette.divider
                      }`,
                    bgcolor: (theme) =>
                      selectedCategory === category.id
                        ? alpha(theme.palette.primary.main, 0.1)
                        : 'transparent',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    '&:hover': {
                      borderColor: 'primary.main',
                      transform: 'translateY(-2px)',
                      boxShadow: (theme) => `0 4px 12px ${alpha(theme.palette.primary.main, 0.2)}`,
                    },
                  }}
                >
                  <Typography variant="body2" fontWeight={600}>
                    {category.label}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {category.subcategories.length} options
                  </Typography>
                </Box>
              </Grid>
            ))}
          </Grid>
        </Box>

        {/* Subcategory Selection */}
        <Collapse in={!!selectedCategory}>
          {selectedCategoryData && (
            <Box>
              <Typography variant="subtitle1" fontWeight={600} gutterBottom>
                Select Specific Type *
              </Typography>
              <FormControl component="fieldset" fullWidth>
                <RadioGroup
                  value={formData.occurrenceSubcategory}
                  onChange={(e) => handleChange('occurrenceSubcategory', e.target.value)}
                >
                  <Grid container spacing={1}>
                    {selectedCategoryData.subcategories.map((sub) => (
                      <Grid size={{ xs: 12, sm: 6 }} key={sub.id}>
                        <FormControlLabel
                          value={sub.id}
                          control={<Radio />}
                          label={sub.label}
                          sx={{
                            m: 0,
                            p: 1.5,
                            borderRadius: 1,
                            border: (theme) => `1px solid ${theme.palette.divider}`,
                            width: '100%',
                            '&:hover': {
                              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.05),
                            },
                          }}
                        />
                      </Grid>
                    ))}
                  </Grid>
                </RadioGroup>
              </FormControl>

              {/* If "Others" is selected, show text field */}
              {formData.occurrenceSubcategory?.includes('others') && (
                <TextField
                  fullWidth
                  label="Please Specify"
                  value={formData.occurrenceOtherDetails}
                  onChange={(e) => handleChange('occurrenceOtherDetails', e.target.value)}
                  sx={{ mt: 2 }}
                  required
                />
              )}
            </Box>
          )}
        </Collapse>

        {/* Description */}
        <Box>
          <Typography variant="subtitle1" fontWeight={600} gutterBottom>
            Description of Occurrence / Variance *
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Record only known facts. Brief explanation without comment or conclusion.
          </Typography>
          <TextField
            fullWidth
            multiline
            rows={6}
            placeholder="Describe what happened in detail..."
            value={formData.description}
            onChange={(e) => handleChange('description', e.target.value)}
            required
            helperText={`${formData.description.length}/1000 characters`}
            inputProps={{ maxLength: 1000 }}
          />
        </Box>

        {/* Navigation */}
        <Stack direction="row" spacing={2} justifyContent="space-between">
          <Button
            variant="outlined"
            startIcon={<ArrowBack />}
            onClick={onBack}
            size="large"
          >
            Back
          </Button>
          <Button
            variant="contained"
            endIcon={<ArrowForward />}
            onClick={onNext}
            disabled={!isValid()}
            size="large"
          >
            Next: Witness Information
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}
