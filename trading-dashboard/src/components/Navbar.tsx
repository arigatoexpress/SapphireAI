import React, { useState } from 'react';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Drawer,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Divider,
  useTheme,
  Chip,
  Avatar,
  Fade,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  AccountBalance as PortfolioIcon,
  Psychology as AgentsIcon,
  Analytics as AnalyticsIcon,
  RocketLaunch as MissionControlIcon,
  Settings as SettingsIcon,
  AccountCircle,
  Menu as MenuIcon,
  Diamond as DiamondIcon,
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import { useTrading } from '../contexts/TradingContext';

const drawerWidth = 280;

const Navbar: React.FC = () => {
  const theme = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const { portfolio, agentActivities } = useTrading();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const navItems = [
    { path: '/', label: 'Neural Network', icon: <AnalyticsIcon />, description: 'Multi-agent consensus visualization' },
    { path: '/dashboard', label: 'Command Center', icon: <DashboardIcon />, description: 'Real-time trading operations' },
    { path: '/portfolio', label: 'Portfolio Matrix', icon: <PortfolioIcon />, description: 'Dynamic capital allocation' },
    { path: '/agents', label: 'Agent Council', icon: <AgentsIcon />, description: '6 specialized AI traders' },
    { path: '/mission-control', label: 'Mission Control', icon: <MissionControlIcon />, description: 'System health & performance' },
    { path: '/workflow', label: 'Architecture', icon: <SettingsIcon />, description: 'Enterprise infrastructure' },
  ];

  const handleDrawerToggle = () => {
    setDrawerOpen(!drawerOpen);
  };

  const handleNavigation = (path: string) => {
    navigate(path);
    setDrawerOpen(false);
  };

  const drawer = (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Drawer Header */}
      <Box
        sx={{
          p: 3,
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          borderBottom: '1px solid',
          borderColor: 'divider',
          background: `linear-gradient(135deg, ${theme.palette.background.paper} 0%, ${theme.palette.action.hover} 100%)`,
        }}
      >
        <Avatar
          sx={{
            bgcolor: 'primary.main',
            width: 48,
            height: 48,
            boxShadow: `0 4px 12px ${theme.palette.primary.main}30`,
          }}
        >
          <DiamondIcon />
        </Avatar>
        <Box>
          <Typography
            variant="h6"
            sx={{
              fontWeight: 700,
              fontSize: '1.1rem',
              background: `linear-gradient(135deg, #00d4aa 0%, #00f5d4 50%, #8a2be2 100%)`,
              backgroundClip: 'text',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '0.5px',
            }}
          >
            Sapphire AI
          </Typography>
          <Typography variant="caption" color="text.secondary" sx={{ fontWeight: 500, fontSize: '0.75rem' }}>
            INSTITUTIONAL TRADING
          </Typography>
        </Box>
      </Box>

      {/* Portfolio Stats */}
      {portfolio && (
        <Box sx={{ p: 2, borderBottom: '1px solid', borderColor: 'divider' }}>
          <Typography variant="overline" sx={{ fontWeight: 600, color: 'text.secondary', mb: 1, display: 'block' }}>
            Portfolio
          </Typography>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 1 }}>
            <Typography variant="body2" color="text.secondary">Bot Trading Capital</Typography>
            <Typography variant="body2" sx={{ fontWeight: 600, color: 'primary.main' }}>
              ${portfolio?.agent_allocations ? Object.values(portfolio.agent_allocations).reduce((sum: number, val: any) => sum + (val || 0), 0).toLocaleString() : '3,000'}
            </Typography>
          </Box>
          {agentActivities && (
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography variant="body2" color="text.secondary">Active Agents</Typography>
              <Chip
                label={agentActivities.length}
                size="small"
                sx={{
                  height: 20,
                  fontSize: '0.7rem',
                  bgcolor: 'primary.main',
                  color: 'primary.contrastText',
                }}
              />
            </Box>
          )}
        </Box>
      )}

      {/* Navigation Menu */}
      <List sx={{ flexGrow: 1, pt: 2 }}>
        {navItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <ListItem key={item.path} disablePadding sx={{ mb: 0.5 }}>
              <ListItemButton
                onClick={() => handleNavigation(item.path)}
                sx={{
                  mx: 2,
                  borderRadius: 2,
                  minHeight: 56,
                  px: 2,
                  position: 'relative',
                  '&::before': isActive ? {
                    content: '""',
                    position: 'absolute',
                    left: 0,
                    top: '50%',
                    transform: 'translateY(-50%)',
                    width: 4,
                    height: '60%',
                    bgcolor: 'primary.main',
                    borderRadius: '0 4px 4px 0',
                    boxShadow: `0 0 8px ${theme.palette.primary.main}50`,
                  } : {},
                  bgcolor: isActive ? 'rgba(0, 212, 170, 0.1)' : 'transparent',
                  border: isActive ? '1px solid rgba(0, 212, 170, 0.3)' : '1px solid transparent',
                  '&:hover': {
                    bgcolor: isActive ? 'rgba(0, 212, 170, 0.15)' : 'action.hover',
                    borderColor: isActive ? 'rgba(0, 212, 170, 0.4)' : 'rgba(0, 212, 170, 0.2)',
                    transform: 'translateX(2px)',
                  },
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                }}
              >
                <ListItemIcon
                  sx={{
                    color: isActive ? 'primary.main' : 'text.secondary',
                    minWidth: 40,
                    transition: 'color 0.2s ease-in-out',
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText
                  primary={
                    <Typography
                      variant="body1"
                      sx={{
                        fontWeight: isActive ? 600 : 500,
                        color: isActive ? 'primary.main' : 'text.primary',
                        fontSize: '0.95rem',
                      }}
                    >
                      {item.label}
                    </Typography>
                  }
                  secondary={
                    <Typography
                      variant="caption"
                      sx={{
                        color: 'text.secondary',
                        fontSize: '0.7rem',
                      }}
                    >
                      {item.description}
                    </Typography>
                  }
                />
              </ListItemButton>
            </ListItem>
          );
        })}
      </List>

      {/* Drawer Footer */}
      <Divider sx={{ mx: 2 }} />
      <Box sx={{ p: 2, textAlign: 'center' }}>
        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 0.5 }}>
          <Box
            sx={{
              width: 8,
              height: 8,
              borderRadius: '50%',
              bgcolor: 'success.main',
              boxShadow: '0 0 8px rgba(76, 175, 80, 0.5)',
              animation: 'pulse 2s infinite',
            }}
          />
          <Typography variant="caption" sx={{ fontWeight: 600, color: 'success.main' }}>
            SYSTEMS OPERATIONAL
          </Typography>
        </Box>
        <Typography variant="caption" color="text.secondary" sx={{ fontSize: '0.7rem', fontWeight: 500 }}>
          Enterprise AI Trading Protocol Active
        </Typography>
      </Box>
    </Box>
  );

  return (
    <>
      <AppBar
        position="static"
        sx={{
          background: 'linear-gradient(90deg, #1a1a1a 0%, #2a2a2a 100%)',
          boxShadow: '0 2px 10px rgba(0,0,0,0.3)',
        }}
      >
        <Toolbar sx={{ minHeight: { xs: 56, md: 64 } }}>
          {/* Hamburger Menu Button - Always Visible */}
          <IconButton
            color="inherit"
            aria-label="open drawer"
            edge="start"
            onClick={handleDrawerToggle}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>

          {/* Logo */}
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              gap: 1,
              flexGrow: 1,
            }}
          >
            <Typography
              variant="h6"
              component="div"
              sx={{
                fontWeight: 700,
                fontSize: { xs: '1rem', sm: '1.1rem', md: '1.25rem' },
                background: 'linear-gradient(135deg, #00d4aa 0%, #00f5d4 50%, #8a2be2 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                letterSpacing: '0.5px',
              }}
            >
              🔷 Sapphire AI
            </Typography>
            <Box sx={{ display: { xs: 'none', sm: 'flex' }, flexDirection: 'column', gap: 0.5, alignItems: 'flex-start' }}>
              <Chip
                label="⚡ INSTITUTIONAL GRADE"
                size="small"
                sx={{
                  bgcolor: 'rgba(0, 212, 170, 0.15)',
                  color: '#00d4aa',
                  border: '1px solid rgba(0, 212, 170, 0.3)',
                  fontWeight: 600,
                  fontSize: '0.65rem',
                  height: '20px',
                  '& .MuiChip-label': {
                    px: 1,
                  },
                }}
              />
              <Chip
                label="🤖 MULTI-AGENT AI"
                size="small"
                sx={{
                  bgcolor: 'rgba(138, 43, 226, 0.15)',
                  color: '#8a2be2',
                  border: '1px solid rgba(138, 43, 226, 0.3)',
                  fontWeight: 600,
                  fontSize: '0.65rem',
                  height: '20px',
                  '& .MuiChip-label': {
                    px: 1,
                  },
                }}
              />
            </Box>
          </Box>

          {/* Bot Trading Capital Chip */}
          {portfolio && (
            <Chip
              label={`$${(portfolio?.agent_allocations ? Object.values(portfolio.agent_allocations).reduce((sum: number, val: any) => sum + (val || 0), 0) : 3000).toLocaleString()}`}
              variant="outlined"
              sx={{
                color: '#00d4aa',
                borderColor: '#00d4aa',
                fontWeight: 600,
                mr: 2,
              }}
            />
          )}

          {/* User Menu */}
          <IconButton
            size="large"
            aria-label="account of current user"
            aria-controls="menu-appbar"
            aria-haspopup="true"
            onClick={handleMenu}
            color="inherit"
          >
            <AccountCircle />
          </IconButton>
          <Menu
            id="menu-appbar"
            anchorEl={anchorEl}
            anchorOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            keepMounted
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right',
            }}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            sx={{
              '& .MuiPaper-root': {
                bgcolor: 'background.paper',
                border: '1px solid',
                borderColor: 'divider',
              }
            }}
          >
            <MenuItem disabled sx={{ opacity: 0.7 }}>
              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                Public Access
              </Typography>
            </MenuItem>
          </Menu>
        </Toolbar>
      </AppBar>

      {/* Drawer Menu - Always Available */}
      <Drawer
        anchor="left"
        open={drawerOpen}
        onClose={handleDrawerToggle}
        sx={{
          '& .MuiDrawer-paper': {
            boxSizing: 'border-box',
            width: drawerWidth,
            bgcolor: 'background.paper',
            borderRight: '1px solid',
            borderColor: 'divider',
          },
        }}
        ModalProps={{
          keepMounted: true, // Better open performance
        }}
      >
        {drawer}
      </Drawer>
    </>
  );
};

export default Navbar;
