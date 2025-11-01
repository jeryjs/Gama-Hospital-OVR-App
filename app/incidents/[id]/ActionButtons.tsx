'use client';

import { Delete, Edit } from '@mui/icons-material';
import { Box, Button, Stack } from '@mui/material';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import type { OVRReport } from '../_shared/types';

interface Props {
  incident: OVRReport;
  onUpdate: () => void;
}

export function ActionButtons({ incident, onUpdate }: Props) {
  const { data: session } = useSession();
  const router = useRouter();

  const isOwner = session?.user?.id === incident.reporterId.toString();
  const canEdit = incident.status === 'draft' && isOwner;
  const canDelete = (incident.status === 'draft' && isOwner) || session?.user?.role === 'admin';

  const handleEdit = () => {
    router.push(`/incidents/${incident.id}/edit`);
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
        alert('Failed to delete report');
      }
    } catch (error) {
      console.error('Error deleting report:', error);
      alert('An error occurred');
    }
  };

  if (!canEdit && !canDelete) {
    return null;
  }

  return (
    <Box sx={{ position: 'sticky', bottom: 16, zIndex: 10 }}>
      <Stack
        direction="row"
        spacing={2}
        justifyContent="flex-end"
        sx={{
          p: 2,
          bgcolor: 'background.paper',
          borderRadius: 2,
          boxShadow: 3,
        }}
      >
        {canEdit && (
          <Button variant="outlined" startIcon={<Edit />} onClick={handleEdit}>
            Edit Draft
          </Button>
        )}
        {canDelete && (
          <Button variant="outlined" color="error" startIcon={<Delete />} onClick={handleDelete}>
            Delete Report
          </Button>
        )}
      </Stack>
    </Box>
  );
}
