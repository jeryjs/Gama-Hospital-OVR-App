'use client';

import { useNotifications } from '@/lib/hooks';
import { Box, Button, Card, CardContent, Chip, Divider, Stack, Typography } from '@mui/material';
import Link from 'next/link';

export default function NotificationsPage() {
  const { notifications, unreadCount, markRead, markAllRead } = useNotifications();

  return (
    <Stack spacing={3}>
      <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h4" sx={{ fontWeight: 700 }} gutterBottom>
            Notifications
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Keep track of workflow updates even when you missed the toast.
          </Typography>
        </Box>
        <Button variant="outlined" onClick={markAllRead} disabled={unreadCount === 0}>
          Mark all read
        </Button>
      </Stack>

      <Stack spacing={2}>
        {notifications.length === 0 ? (
          <Card>
            <CardContent>
              <Typography variant="body1" sx={{ fontWeight: 600 }} gutterBottom>
                No notifications yet
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Workflow events will appear here as they happen.
              </Typography>
            </CardContent>
          </Card>
        ) : notifications.map((notification) => (
          <Card key={notification.id} variant={notification.isRead ? 'outlined' : 'elevation'}>
            <CardContent>
              <Stack spacing={1}>
                <Stack direction="row" spacing={2} sx={{ justifyContent: 'space-between', alignItems: 'center' }}>
                  <Box>
                    <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                      {notification.title}
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      {new Date(notification.createdAt).toLocaleString()}
                    </Typography>
                  </Box>
                  <Chip
                    label={notification.isRead ? 'Read' : 'Unread'}
                    size="small"
                    color={notification.isRead ? 'default' : 'primary'}
                  />
                </Stack>
                <Typography variant="body2" color="text.secondary">
                  {notification.body}
                </Typography>
                <Stack direction="row" spacing={1}>
                  {notification.url ? (
                    <Button component={Link} href={notification.url} size="small" variant="text">
                      Open item
                    </Button>
                  ) : null}
                  {!notification.isRead ? (
                    <Button size="small" onClick={() => markRead(notification.id)}>
                      Mark read
                    </Button>
                  ) : null}
                </Stack>
              </Stack>
            </CardContent>
            <Divider />
          </Card>
        ))}
      </Stack>
    </Stack>
  );
}