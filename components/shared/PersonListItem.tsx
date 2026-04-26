/**
 * @fileoverview PersonListItem - Reusable Person Display Component
 * 
 * Displays person information in a list item format with avatar, name, and metadata
 * Supports both standard and modern variants
 */

'use client';

import { Email } from '@mui/icons-material';
import { Avatar, Box, List, ListItem, ListItemAvatar, ListItemIcon, ListItemText, Stack, Tooltip, Typography } from '@mui/material';
import type { ReactNode } from 'react';

export interface PersonListItemData {
  id?: number;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
  position?: string | null;
  department?: string | null;
  profilePicture?: string | null;
}

export interface PersonListItemProps {
  person: PersonListItemData;
  primary?: ReactNode;
  secondary?: ReactNode;
  secondaryAction?: ReactNode;
  sx?: any;
}

function getInitials(firstName?: string | null, lastName?: string | null): string {
  const first = firstName?.[0] || '';
  const last = lastName?.[0] || '';
  return (first + last).toUpperCase() || '?';
}

function getFullName(person: PersonListItemData): string {
  return `${person.firstName || ''} ${person.lastName || ''}`.trim() || person.email;
}

function getPersonSubtitle(person: PersonListItemData): string {
  return [person.position, person.department].filter(Boolean).join(' • ');
}

/**
 * PersonListItem Component
 * 
 * Displays person information in a consistent format across the app
 * 
 * @example
 * <PersonListItem
 *   person={personData}
 *   secondary="Invited 2 days ago"
 *   secondaryAction={<IconButton>...</IconButton>}
 * />
 */
export function PersonListItem({
  person,
  primary,
  secondary,
  secondaryAction,
  sx,
}: PersonListItemProps) {
  const fullName = getFullName(person);
  const initials = getInitials(person.firstName, person.lastName);
  const subtitle = getPersonSubtitle(person);

  return (
    <Tooltip arrow placement='left' enterDelay={750} title={
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
        <Typography variant="caption" sx={{ color: 'text.secondary' }}>EmaiL: {person.email}</Typography>
        {person.position && (<Typography variant="caption" sx={{ color: 'text.secondary' }}>Position: {person.position}</Typography>)}
        {person.department && (<Typography variant="caption" sx={{ color: 'text.secondary' }}>Department: {person.department}</Typography>)}
      </Box>
    }>
      <ListItem
        sx={{
          px: 0,
          py: 1.5,
          borderBottom: '1px solid',
          borderColor: 'divider',
          '&:last-child': {
            borderBottom: 'none',
          },
          '.MuiListItem-secondaryAction': {
            right: 0,
          },
          ...sx,
        }}
        secondaryAction={secondaryAction}
      >
        <ListItemAvatar>
          <Avatar
            src={person.profilePicture || undefined}
            sx={{
              width: 40,
              height: 40,
              bgcolor: 'primary.main',
              fontSize: '1rem',
            }}
          >
            {initials}
          </Avatar>
        </ListItemAvatar>
        <ListItemText
          primary={
            primary || (
              <Typography variant="body1" sx={{ fontWeight: 500 }}>
                {fullName}
              </Typography>

            )
          }
          secondary={
            secondary || (
              <Box component="span">
                {subtitle && (
                  <Typography variant="body2" component="span" sx={{ color: 'text.secondary' }}>
                    {subtitle}
                  </Typography>
                )}
              </Box>
            )
          }
          slotProps={{ secondary: { component: 'div' } }}
        />
      </ListItem>
    </Tooltip>
  );
}
