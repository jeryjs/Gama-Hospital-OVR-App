'use client';

import { useErrorDialog } from '@/components/ErrorDialog';
import { ACCESS_CONTROL } from '@/lib/access-control';
import { Delete, Edit } from '@mui/icons-material';
import { Box, Button, Stack } from '@mui/material';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import type { OVRReport } from '../../_shared/types';

interface Props {
  incident: OVRReport;
  onUpdate: () => void;
  hidden?: boolean;
}

export function ActionButtons({ incident, onUpdate, hidden = false }: Props) {
  const { data: session } = useSession();
  const router = useRouter();
  const { showError, ErrorDialogComponent } = useErrorDialog();
  const roles = session?.user.roles || [];

  const isOwner = session?.user?.id === incident.reporterId.toString();
  const canEditDraft = incident.status === 'draft' && isOwner;
  const canEditAsQI =
    incident.status !== 'closed' &&
    ACCESS_CONTROL.ui.incidentForm.canEditQISection(roles);
  const canEdit = canEditDraft || canEditAsQI;
  const isDraft = incident.status === 'draft';
  const canDelete = ACCESS_CONTROL.api.incidents.canDelete(
    roles,
    isOwner,
    isDraft
  );

  const handleEdit = () => {
    router.push(`/incidents/new?draft=${incident.id}`);
  };

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this report? This action cannot be undone.')) {
      return;
    }

    try {
      const res = await fetch(`/api/incidents/${incident.id}`, {
        method: 'DELETE',
      });

      if (res.ok) {
        router.replace('/incidents');
      } else {
        await showError(res);
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      await showError(error);
    }
  };

  if (hidden || (!canEdit && !canDelete)) {
    return null;
  }

  return (
    <>
    <Box sx={{ position: 'sticky', bottom: 16, zIndex: 10 }}>
      <Stack
        direction="row"
        spacing={2}
        sx={{
          justifyContent: "flex-end",
          p: 2,
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 3
        }}>
        {canEdit && (
          <Button variant="outlined" startIcon={<Edit />} onClick={handleEdit}>
            {canEditDraft && !canEditAsQI ? 'Edit Draft' : 'Edit Report'}
          </Button>
        )}
        {canDelete && (
          <Button variant="outlined" color="error" startIcon={<Delete />} onClick={handleDelete}>
            Delete Report
          </Button>
        )}
      </Stack>
    </Box>
    {ErrorDialogComponent}
    </>
  );
}
