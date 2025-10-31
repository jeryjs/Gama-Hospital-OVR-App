'use client';

import { useState } from 'react';
import { useSession, signOut } from 'next-auth/react';
import { usePathname, useRouter } from 'next/navigation';
import {
  Box,
  Drawer,
  AppBar,
  Toolbar,
  List,
  Typography,
  Divider,
  IconButton,
  Avatar,
  Menu,
  MenuItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Collapse,
  alpha,
  Stack,
  Chip,
} from '@mui/material';
import {
  Dashboard,
  Description,
  AddCircleOutline,
  ExpandLess,
  ExpandMore,
  Logout,
  AccountCircle,
  Menu as MenuIcon,
} from '@mui/icons-material';
import { motion, AnimatePresence } from 'framer-motion';

const DRAWER_WIDTH = 280;

interface NavItem {
  title: string;
  icon: React.ReactNode;
  path?: string;
  children?: Array<{
    title: string;
    path: string;
    badge?: string;
  }>;
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();
  const pathname = usePathname();
  const router = useRouter();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [openMenus, setOpenMenus] = useState<Record<string, boolean>>({});

  const navItems: NavItem[] = [
    {
      title: 'Dashboard',
      icon: <Dashboard />,
      path: '/dashboard',
    },
    {
      title: 'Incidents',
      icon: <Description />,
      children: [
        { title: 'My Reports', path: '/incidents' },
        { title: 'New Report', path: '/incidents/new', badge: 'New' },
        ...(session?.user?.role === 'quality_manager' || session?.user?.role === 'admin'
          ? [{ title: 'QI Review', path: '/qi/review' }]
          : []),
      ],
    },
  ];

  const handleMenuToggle = (title: string) => {
    setOpenMenus((prev) => ({
      ...prev,
      [title]: !prev[title],
    }));
  };

  const handleNavigation = (path: string) => {
    router.push(path);
    setMobileOpen(false);
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
            background: (theme) =>
              `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.secondary.main})`,
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
          const isOpen = openMenus[item.title];
          const isActive = item.path === pathname;

          return (
            <Box key={item.title}>
              <ListItemButton
                selected={isActive}
                onClick={() => {
                  if (hasChildren) {
                    handleMenuToggle(item.title);
                  } else if (item.path) {
                    handleNavigation(item.path);
                  }
                }}
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
                {hasChildren && (isOpen ? <ExpandLess /> : <ExpandMore />)}
              </ListItemButton>

              {hasChildren && (
                <Collapse in={isOpen} timeout="auto" unmountOnExit>
                  <List component="div" disablePadding>
                    {item.children?.map((child) => {
                      const isChildActive = child.path === pathname;
                      return (
                        <ListItemButton
                          key={child.path}
                          selected={isChildActive}
                          onClick={() => handleNavigation(child.path)}
                          sx={{
                            pl: 7,
                            borderRadius: 2,
                            mb: 0.5,
                          }}
                        >
                          <ListItemText primary={child.title} />
                          {child.badge && (
                            <Chip
                              label={child.badge}
                              size="small"
                              color="primary"
                              sx={{ height: 20, fontSize: '0.7rem' }}
                            />
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
          >
            <MenuItem onClick={() => router.push('/profile')}>
              <ListItemIcon>
                <AccountCircle fontSize="small" />
              </ListItemIcon>
              Profile
            </MenuItem>
            <Divider />
            <MenuItem onClick={() => signOut({ callbackUrl: '/login' })}>
              <ListItemIcon>
                <Logout fontSize="small" />
              </ListItemIcon>
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
