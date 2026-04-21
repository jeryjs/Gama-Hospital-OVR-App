import { Alert, Box, Paper, Stack, Typography } from '@mui/material';
import { RichTextPreview } from '@/components/editor';
import { format } from 'date-fns';
import { UserMinimal } from '@/lib/api/schemas';

interface Props {
  rejectionReason: string;
  qiReviewedByPerson?: UserMinimal | null;
  qiReviewedAt?: Date | null;
}

export function RejectionReasonSection({
  rejectionReason,
  qiReviewedByPerson,
  qiReviewedAt,
}: Props) {
  return (
    <Box sx={{ my: 3 }}>
      <Paper
        sx={{
          p: 3,
          bgcolor: 'error.lighter',
          border: '1px solid',
          borderColor: 'error.main',
          borderRadius: 2,
        }}
      >
        <Stack spacing={2}>
          <Box>
            <Typography
              variant="h6"
              sx={{
                fontWeight: 600,
                color: 'error.main',
                mb: 1,
              }}
            >
              ⛔ Incident Rejected
            </Typography>
            <Typography variant="body2" sx={{ color: 'text.secondary', mb: 2 }}>
              This incident report was rejected by the QI department and cannot proceed to investigation.
            </Typography>
          </Box>

          <Box>
            <Typography
              variant="subtitle2"
              sx={{
                fontWeight: 600,
                mb: 1,
                color: 'text.primary',
              }}
            >
              Rejection Reason
            </Typography>
            <Box
              sx={{
                bgcolor: 'background.paper',
                p: 2,
                borderRadius: 1,
                border: '1px solid',
                borderColor: 'divider',
              }}
            >
              <RichTextPreview value={rejectionReason} />
            </Box>
          </Box>

          {qiReviewedAt && (
            <Box sx={{ pt: 1, borderTop: '1px solid', borderColor: 'divider' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                Rejected {qiReviewedByPerson ? `by ${qiReviewedByPerson.firstName} ${qiReviewedByPerson.lastName} ` : ''}on{' '}
                {format(new Date(qiReviewedAt), 'MMMM dd, yyyy HH:mm')}
              </Typography>
            </Box>
          )}

          <Alert severity="info" sx={{ mt: 2 }}>
            To resubmit this incident, please contact the QI department for guidance on addressing the rejection reason.
          </Alert>
        </Stack>
      </Paper>
    </Box>
  );
}
