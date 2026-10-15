import React, { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Avatar from '@mui/material/Avatar';
import IconButton from '@mui/material/IconButton';
import Badge from '@mui/material/Badge';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Divider from '@mui/material/Divider';
import Tooltip from '@mui/material/Tooltip';
import CircularProgress from '@mui/material/CircularProgress';
import Chip from '@mui/material/Chip';
import ForumIcon from '@mui/icons-material/Forum';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import NotificationsIcon from '@mui/icons-material/Notifications';
import NotificationsNoneIcon from '@mui/icons-material/NotificationsNone';
import DoneAllIcon from '@mui/icons-material/DoneAll';
import DescriptionIcon from '@mui/icons-material/Description';
import SettingsIcon from '@mui/icons-material/Settings';
import CircleIcon from '@mui/icons-material/Circle';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const formatRelativeTime = (timestamp) => {
  if (!timestamp) return '';
  const diffMs = Date.now() - new Date(timestamp).getTime();
  const diffSec = Math.floor(diffMs / 1000);
  const diffMin = Math.floor(diffSec / 60);
  const diffHrs = Math.floor(diffMin / 60);
  const diffDays = Math.floor(diffHrs / 24);

  if (diffSec < 60) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  if (diffHrs < 24) return `${diffHrs}h ago`;
  if (diffDays === 1) return 'Yesterday';
  return new Date(timestamp).toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
};

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  // Notification state
  const [anchorEl, setAnchorEl] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loadingNotifs, setLoadingNotifs] = useState(false);
  const [markingAll, setMarkingAll] = useState(false);

  const isNotifMenuOpen = Boolean(anchorEl);

  // Fetch notifications from backend
  const fetchNotifications = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      setLoadingNotifs(true);
      const res = await api.get('/notifications');
      if (res.data) {
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unreadCount ?? 0);
      }
    } catch (err) {
      // Non-fatal: log silently to preserve UX
      console.warn('Failed to fetch notifications:', err?.response?.data?.message || err.message);
    } finally {
      setLoadingNotifs(false);
    }
  }, [isAuthenticated]);

  // Initial load and periodic polling when logged in
  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    fetchNotifications();

    // Poll every 25 seconds
    const interval = setInterval(fetchNotifications, 25000);

    // Refresh on custom event or window focus
    const handleCustomRefresh = () => fetchNotifications();
    window.addEventListener('discussify-refresh-notifications', handleCustomRefresh);
    window.addEventListener('focus', handleCustomRefresh);

    return () => {
      clearInterval(interval);
      window.removeEventListener('discussify-refresh-notifications', handleCustomRefresh);
      window.removeEventListener('focus', handleCustomRefresh);
    };
  }, [isAuthenticated, fetchNotifications]);

  const handleOpenNotifications = (event) => {
    setAnchorEl(event.currentTarget);
    fetchNotifications();
  };

  const handleCloseNotifications = () => {
    setAnchorEl(null);
  };

  const handleMarkAllRead = async () => {
    try {
      setMarkingAll(true);
      await api.put('/notifications/mark-all-read');
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      setUnreadCount(0);
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    } finally {
      setMarkingAll(false);
    }
  };

  const handleNotificationClick = async (notif) => {
    try {
      if (!notif.isRead) {
        await api.put(`/notifications/${notif._id}/read`);
        setNotifications((prev) =>
          prev.map((n) => (n._id === notif._id ? { ...n, isRead: true } : n))
        );
        setUnreadCount((prev) => Math.max(0, prev - 1));
      }
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }

    handleCloseNotifications();

    if (notif.community?._id) {
      navigate(`/communities/${notif.community._id}`);
    }
  };

  const handleLogout = () => {
    handleCloseNotifications();
    logout();
    navigate('/login');
  };

  return (
    <header className="app-header" role="banner">
      <AppBar position="static" color="inherit" elevation={0} sx={{ borderBottom: '1px solid #e2e8f0' }}>
        <Container maxWidth="lg">
          <Toolbar disableGutters sx={{ justifyContent: 'space-between', minHeight: 64 }}>
            {/* Logo & Brand */}
            <Box
              component={Link}
              to="/"
              sx={{
                display: 'flex',
                alignItems: 'center',
                gap: 1.5,
                textDecoration: 'none',
                color: 'primary.main',
                '&:focus-visible': {
                  outline: '2px solid #3b82f6',
                  borderRadius: 1
                }
              }}
              aria-label="Discussify Home"
            >
              <ForumIcon sx={{ fontSize: 32 }} aria-hidden="true" />
              <Typography
                variant="h6"
                component="span"
                sx={{
                  fontWeight: 700,
                  letterSpacing: '-0.5px',
                  color: 'primary.main'
                }}
              >
                Discussify
              </Typography>
            </Box>

            {/* Navigation Links & User Controls */}
            <nav aria-label="Main Navigation">
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                <Button
                  component={Link}
                  to="/"
                  color="inherit"
                  aria-label="Navigate to Home"
                  sx={{ fontWeight: 500 }}
                >
                  Home
                </Button>
                <Button
                  component={Link}
                  to="/communities"
                  color="inherit"
                  aria-label="Navigate to Communities"
                  sx={{ fontWeight: 500 }}
                >
                  Communities
                </Button>

                {isAuthenticated ? (
                  <>
                    {/* ACCESSIBLE NOTIFICATION BELL BADGE */}
                    <Tooltip title="Notifications">
                      <IconButton
                        id="notification-bell-btn"
                        color="inherit"
                        onClick={handleOpenNotifications}
                        aria-label={
                          unreadCount > 0
                            ? `${unreadCount} unread notifications`
                            : 'View notifications'
                        }
                        aria-controls={isNotifMenuOpen ? 'notifications-menu' : undefined}
                        aria-haspopup="true"
                        aria-expanded={isNotifMenuOpen ? 'true' : undefined}
                        sx={{
                          '&:focus-visible': {
                            outline: '2px solid #3b82f6',
                            borderRadius: 1
                          }
                        }}
                      >
                        <Badge
                          id="notification-badge"
                          badgeContent={unreadCount}
                          color="error"
                          max={99}
                          sx={{
                            '& .MuiBadge-badge': {
                              fontWeight: 700,
                              fontSize: '0.75rem'
                            }
                          }}
                        >
                          <NotificationsIcon aria-hidden="true" />
                        </Badge>
                      </IconButton>
                    </Tooltip>

                    {/* NOTIFICATIONS DROPDOWN / MENU */}
                    <Menu
                      id="notifications-menu"
                      anchorEl={anchorEl}
                      open={isNotifMenuOpen}
                      onClose={handleCloseNotifications}
                      transformOrigin={{ horizontal: 'right', vertical: 'top' }}
                      anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
                      PaperProps={{
                        elevation: 4,
                        sx: {
                          width: 380,
                          maxWidth: '92vw',
                          maxHeight: 480,
                          borderRadius: 2,
                          mt: 1.5,
                          border: '1px solid #e2e8f0',
                          overflow: 'hidden',
                          display: 'flex',
                          flexDirection: 'column'
                        }
                      }}
                      MenuListProps={{
                        'aria-labelledby': 'notification-bell-btn',
                        sx: { p: 0 }
                      }}
                    >
                      {/* Notifications Header */}
                      <Box
                        sx={{
                          p: 2,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderBottom: '1px solid #e2e8f0',
                          bgcolor: 'background.paper'
                        }}
                      >
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                          <Typography variant="subtitle1" sx={{ fontWeight: 700 }}>
                            Notifications
                          </Typography>
                          {unreadCount > 0 && (
                            <Chip
                              label={`${unreadCount} new`}
                              size="small"
                              color="primary"
                              sx={{ height: 20, fontSize: '0.7rem', fontWeight: 700 }}
                            />
                          )}
                        </Box>
                        {unreadCount > 0 && (
                          <Button
                            size="small"
                            onClick={handleMarkAllRead}
                            disabled={markingAll}
                            startIcon={<DoneAllIcon sx={{ fontSize: 16 }} />}
                            sx={{ fontSize: '0.75rem', textTransform: 'none', py: 0.25 }}
                            aria-label="Mark all notifications as read"
                          >
                            Mark all read
                          </Button>
                        )}
                      </Box>

                      {/* Notifications Content List */}
                      <Box sx={{ overflowY: 'auto', flex: 1, maxHeight: 340 }}>
                        {loadingNotifs ? (
                          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
                            <CircularProgress size={28} />
                          </Box>
                        ) : notifications.length === 0 ? (
                          <Box sx={{ textAlign: 'center', py: 5, px: 2 }}>
                            <NotificationsNoneIcon sx={{ fontSize: 48, color: 'text.secondary', opacity: 0.5, mb: 1 }} />
                            <Typography variant="body2" sx={{ fontWeight: 600, color: 'text.primary' }}>
                              You're all caught up!
                            </Typography>
                            <Typography variant="caption" color="text.secondary">
                              No new notifications from your communities.
                            </Typography>
                          </Box>
                        ) : (
                          notifications.map((notif) => {
                            const isDiscussion = notif.type === 'discussion';
                            return (
                              <MenuItem
                                key={notif._id}
                                onClick={() => handleNotificationClick(notif)}
                                sx={{
                                  py: 1.5,
                                  px: 2,
                                  borderBottom: '1px solid #f1f5f9',
                                  bgcolor: notif.isRead ? 'inherit' : 'rgba(59, 130, 246, 0.05)',
                                  alignItems: 'flex-start',
                                  whiteSpace: 'normal',
                                  gap: 1.5,
                                  '&:hover': {
                                    bgcolor: notif.isRead ? 'action.hover' : 'rgba(59, 130, 246, 0.1)'
                                  }
                                }}
                              >
                                {/* Notification Icon */}
                                <Avatar
                                  sx={{
                                    width: 36,
                                    height: 36,
                                    bgcolor: isDiscussion ? 'primary.light' : 'success.light',
                                    color: isDiscussion ? 'primary.dark' : 'success.dark',
                                    mt: 0.5
                                  }}
                                  aria-hidden="true"
                                >
                                  {isDiscussion ? (
                                    <ForumIcon sx={{ fontSize: 20 }} />
                                  ) : (
                                    <DescriptionIcon sx={{ fontSize: 20 }} />
                                  )}
                                </Avatar>

                                {/* Notification Text & Meta */}
                                <Box sx={{ flex: 1, minWidth: 0 }}>
                                  <Typography
                                    variant="body2"
                                    sx={{
                                      fontWeight: notif.isRead ? 400 : 600,
                                      color: 'text.primary',
                                      lineHeight: 1.35,
                                      mb: 0.5
                                    }}
                                  >
                                    {notif.message}
                                  </Typography>
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    {notif.community?.name && (
                                      <Chip
                                        label={notif.community.name}
                                        size="small"
                                        variant="outlined"
                                        sx={{
                                          height: 18,
                                          fontSize: '0.65rem',
                                          maxWidth: 120
                                        }}
                                      />
                                    )}
                                    <Typography variant="caption" color="text.secondary">
                                      {formatRelativeTime(notif.createdAt)}
                                    </Typography>
                                  </Box>
                                </Box>

                                {/* Unread indicator dot */}
                                {!notif.isRead && (
                                  <CircleIcon
                                    sx={{
                                      fontSize: 10,
                                      color: 'primary.main',
                                      mt: 1,
                                      flexShrink: 0
                                    }}
                                    titleAccess="Unread notification"
                                  />
                                )}
                              </MenuItem>
                            );
                          })
                        )}
                      </Box>

                      {/* Menu Footer */}
                      <Divider />
                      <Box sx={{ p: 1, bgcolor: 'background.default', textAlign: 'center' }}>
                        <Button
                          component={Link}
                          to="/profile"
                          onClick={handleCloseNotifications}
                          size="small"
                          fullWidth
                          startIcon={<SettingsIcon sx={{ fontSize: 16 }} />}
                          sx={{
                            fontSize: '0.75rem',
                            textTransform: 'none',
                            color: 'text.secondary',
                            fontWeight: 600
                          }}
                        >
                          Notification Settings
                        </Button>
                      </Box>
                    </Menu>

                    {/* Admin Dashboard Link (Admin only) */}
                    {user?.role === 'admin' && (
                      <Button
                        id="nav-admin-dashboard-btn"
                        component={Link}
                        to="/admin"
                        color="secondary"
                        variant="outlined"
                        size="small"
                        startIcon={<AdminPanelSettingsIcon aria-hidden="true" />}
                        aria-label="Navigate to Admin Dashboard"
                        sx={{ fontWeight: 700 }}
                      >
                        Admin
                      </Button>
                    )}

                    {/* Profile Link */}
                    <Button
                      component={Link}
                      to="/profile"
                      color="inherit"
                      startIcon={
                        user?.profilePictureUrl ? (
                          <Avatar
                            src={user.profilePictureUrl}
                            alt={`${user.name}'s profile picture`}
                            sx={{ width: 24, height: 24 }}
                          />
                        ) : (
                          <PersonIcon aria-hidden="true" />
                        )
                      }
                      aria-label="View user profile"
                      sx={{ fontWeight: 600 }}
                    >
                      {user?.name || 'Profile'}
                    </Button>

                    {/* Logout Button */}
                    <Button
                      onClick={handleLogout}
                      variant="outlined"
                      color="primary"
                      size="small"
                      startIcon={<LogoutIcon aria-hidden="true" />}
                      aria-label="Log out of account"
                    >
                      Logout
                    </Button>
                  </>
                ) : (
                  <>
                    <Button
                      component={Link}
                      to="/login"
                      color="inherit"
                      aria-label="Sign into existing account"
                      sx={{ fontWeight: 500 }}
                    >
                      Sign In
                    </Button>
                    <Button
                      component={Link}
                      to="/register"
                      variant="contained"
                      color="primary"
                      aria-label="Register a new account"
                    >
                      Sign Up
                    </Button>
                  </>
                )}
              </Box>
            </nav>
          </Toolbar>
        </Container>
      </AppBar>
    </header>
  );
}
