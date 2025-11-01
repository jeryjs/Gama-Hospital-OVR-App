'use client';

import {
  AccountCircle,
  Add,
  Dashboard,
  Description,
  ExpandLess,
  ExpandMore,
  Logout,
  Menu as MenuIcon
} from '@mui/icons-material';
import {
  AppBar,
  Avatar,
  Box,
  Chip,
  Collapse,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Menu,
  MenuItem,
  Stack,
  Toolbar,
  Tooltip,
  Typography
} from '@mui/material';
import { AnimatePresence, motion } from 'framer-motion';
import { User } from 'next-auth';
import { signOut, useSession } from 'next-auth/react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

const DRAWER_WIDTH = 280;

interface NavItem {
  title: string;
  icon: React.ReactNode;
  path?: string;
  open?: boolean;
  children?: Array<{
    title: string;
    path: string;
    roles?: User['role'][];
    badge?: { content: string | React.ReactNode; link?: string; tooltip?: string };
  }>;
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: session, status: sessionStatus } = useSession();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const router = useRouter();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [navItems, setNavItems] = useState<NavItem[]>(() => {
    const items: NavItem[] = [
      { title: 'Dashboard', icon: <Dashboard />, path: '/dashboard' },
      {
        title: 'Incidents', icon: <Description />, open: pathname.startsWith('/incidents') || pathname === '/qi/review' || pathname === '/hod/review',
        children: [
          { title: 'My Reports', path: '/incidents', badge: { content: <Add />, link: '/incidents', tooltip: 'Report New incident' } },
          { title: 'Pending Approval', path: '/incidents?status=submitted', roles: ['supervisor', 'employee'], badge: { content: 3, tooltip: 'Found 3 reports pending approval' } },
          { title: 'Investigation', path: '/hod/review', roles: ['department_head', 'admin'], badge: { content: 0, tooltip: 'Found 1 incidents requiring investigation' } },
          { title: 'QI Review', path: '/qi/review', roles: ['quality_manager', 'admin'], badge: { content: 1, tooltip: 'Found 1 QI reviews pending' } },
        ],
      },
    ];

    // process the items based on the children roles
    items.forEach((item) => {
      if (item.children) {
        item.children = item.children.filter((child) =>
          session?.user.role == 'admin' ||
          !child.roles ||
          child.roles.includes(session?.user?.role || 'employee'));
      }
    });

    return items;
  });

  const handleMenuItemClick = (item: NavItem) => {
    if (item.children) {
      setNavItems((prevItems) =>
        prevItems.map((navItem) =>
          navItem.title === item.title ? { ...navItem, open: !navItem.open } : navItem
        )
      );
    } else if (item.path) {
      setMobileOpen(false);
    }
  };

  const drawerContent = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <Box
        sx={{
          p: 3,
          borderBottom: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <Typography
          variant="h5"
          sx={{
            fontWeight: 700,
            background: (theme) => `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
            backgroundClip: 'text',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
          }}
        >
          OVR System
        </Typography>
        <Typography variant="caption" color="text.secondary">
          Gama Hospital
        </Typography>
      </Box>

      {/* Navigation */}
      <List sx={{ flex: 1, px: 2, py: 2 }}>
        {navItems.map((item) => {
          const hasChildren = !!item.children;
          const isActive = item.path === pathname;

          return (
            <Box key={item.title}>
              <ListItemButton
                component={item.path ? Link : 'li'}
                href={item.path}
                selected={isActive}
                onClick={() => handleMenuItemClick(item)}
                sx={{
                  borderRadius: 2,
                  mb: 0.5,
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <ListItemIcon sx={{ color: 'inherit', minWidth: 40 }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.title} />
                {hasChildren && (item.open ? <ExpandLess /> : <ExpandMore />)}
              </ListItemButton>

              {hasChildren && (
                <Collapse in={item.open} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.children?.map((child) => {
                      // Determine if child is active with support for search params
                      const isChildActive = `${pathname}${searchParams.toString() ? `?${searchParams}` : ''}`.replace(/\/?\??$/, '') === child.path;
                      
                      return (
                        <ListItemButton
                          key={child.path}
                          component={Link}
                          href={child.path}
                          selected={isChildActive}
                          onClick={() => setMobileOpen(false)}
                          sx={{
                            pl: 7,
                            borderRadius: 2,
                            mb: 0.5,
                          }}
                        >
                          <ListItemText primary={child.title} />
                          {child.badge && (
                            <Tooltip title={child.badge.tooltip} arrow placement='right'>
                              <Chip
                                label={child.badge.content}
                                size="small"
                                color="primary"
                                sx={{ height: 20, fontSize: '0.7rem' }}
                              />
                            </Tooltip>
                          )}
                        </ListItemButton>
                      );
                    })}
                  </List>
                </Collapse>
              )}
            </Box>
          );
        })}
      </List>

      {/* User Info */}
      {session?.user && (
        <Box
          sx={{
            p: 2,
            borderTop: (theme) => `1px solid ${theme.palette.divider}`,
          }}
        >
          <Stack direction="row" spacing={2} alignItems="center">
            <Avatar
              src={session.user.image || ''}
              sx={{
                width: 40,
                height: 40,
                bgcolor: 'primary.main',
              }}
            >
              {session.user.name?.charAt(0)}
            </Avatar>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography variant="body2" noWrap fontWeight={600}>
                {session.user.name}
              </Typography>
              <Typography variant="caption" color="text.secondary" noWrap>
                {session.user.email}
              </Typography>
            </Box>
          </Stack>
        </Box>
      )}
    </Box>
  );

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      {/* App Bar */}
      <AppBar
        position="fixed"
        sx={{
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          ml: { sm: `${DRAWER_WIDTH}px` },
        }}
      >
        <Toolbar>
          <IconButton
            color="inherit"
            edge="start"
            onClick={() => setMobileOpen(!mobileOpen)}
            sx={{ mr: 2, display: { sm: 'none' } }}
          >
            <MenuIcon />
          </IconButton>

          <Box sx={{ flex: 1 }} />

          <IconButton
            onClick={(e) => setAnchorEl(e.currentTarget)}
            size="small"
          >
            <Avatar
              src={session?.user?.image || ''}
              sx={{ width: 36, height: 36 }}
            >
              {session?.user?.name?.charAt(0)}
            </Avatar>
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={() => setAnchorEl(null)}
            transformOrigin={{ horizontal: 'right', vertical: 'top' }}
            anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
            slotProps={{
              paper: {
                sx: {
                  minWidth: 240,
                  p: 2,
                  borderRadius: 3,
                  boxShadow: 6,
                  background: (theme) =>
                    `linear-gradient(135deg, ${theme.palette.background.paper} 80%, ${theme.palette.primary.light} 100%)`,
                },
              },
            }}
          >
            <Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2, px: 1 }}>
              <Avatar
                src={session?.user?.image || ''}
                sx={{
                  width: 48,
                  height: 48,
                  bgcolor: 'primary.main',
                  fontWeight: 700,
                  fontSize: 24,
                }}
              >
                {session?.user?.name?.charAt(0)}
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="subtitle1" fontWeight={700} noWrap>
                  {session?.user?.name}
                </Typography>
                <Typography variant="body2" color="text.secondary" noWrap>
                  {session?.user?.email}
                </Typography>
              </Box>
            </Stack>
            <Divider sx={{ mb: 1 }} />
            <MenuItem
              onClick={() => router.push('/profile')}
              sx={{ borderRadius: 2, mb: 0.5, fontWeight: 500, gap: 1, px: 2 }}
            >
              <AccountCircle fontSize="small" sx={{ color: 'primary.main' }} />
              Profile
            </MenuItem>
            <MenuItem
              onClick={() => signOut({ callbackUrl: '/login' })}
              sx={{ borderRadius: 2, color: 'error.main', fontWeight: 500, gap: 1, px: 2 }}
            >
              <Logout fontSize="small" sx={{ color: 'error.main' }} />
              Sign Out
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Drawer */}
      <Box
        component="nav"
        sx={{ width: { sm: DRAWER_WIDTH }, flexShrink: { sm: 0 } }}
      >
        {/* Mobile drawer */}
        <Drawer
          variant="temporary"
          open={mobileOpen}
          onClose={() => setMobileOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
        >
          {drawerContent}
        </Drawer>

        {/* Desktop drawer */}
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': {
              boxSizing: 'border-box',
              width: DRAWER_WIDTH,
            },
          }}
          open
        >
          {drawerContent}
        </Drawer>
      </Box>

      {/* Main content */}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 3,
          width: { sm: `calc(100% - ${DRAWER_WIDTH}px)` },
          mt: 8,
        }}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={pathname}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
          >
            {children}
          </motion.div>
        </AnimatePresence>
      </Box>
    </Box>
  );
}
