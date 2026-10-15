import React from 'react';
import { useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import Avatar from '@mui/material/Avatar';
import Button from '@mui/material/Button';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Grid from '@mui/material/Grid';
import Paper from '@mui/material/Paper';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import ShieldIcon from '@mui/icons-material/Shield';
import HistoryIcon from '@mui/icons-material/History';
import LogoutIcon from '@mui/icons-material/Logout';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { useAuth } from '../context/AuthContext';

export default function Profile() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!user) {
    return null;
  }

  return (
    <Box component="section" aria-labelledby="profile-heading" sx={{ py: 4 }}>
      <Typography id="profile-heading" variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
        User Profile
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 4 }}>
        Manage your Discussify account settings and review platform activities.
      </Typography>

      <Grid container spacing={3}>
        {/* Main Profile Info Card */}
        <Grid item xs={12} md={5}>
          <Card sx={{ p: 2 }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <Avatar
                src={user.profilePictureUrl || undefined}
                alt={`${user.name}'s profile picture`}
                sx={{
                  width: 96,
                  height: 96,
                  mb: 2,
                  bgcolor: 'primary.main',
                  fontSize: '2rem'
                }}
              >
                {user.name ? user.name.charAt(0).toUpperCase() : <PersonIcon />}
              </Avatar>

              <Typography variant="h5" sx={{ fontWeight: 700 }}>
                {user.name}
              </Typography>

              <Chip
                icon={<ShieldIcon sx={{ fontSize: '1rem !important' }} />}
                label={user.role === 'admin' ? 'Administrator' : 'Standard User'}
                color={user.role === 'admin' ? 'secondary' : 'default'}
                size="small"
                sx={{ mt: 1, mb: 2, fontWeight: 600 }}
              />

              {user.bio ? (
                <Typography variant="body2" color="text.secondary" sx={{ textAlign: 'center', mb: 2 }}>
                  "{user.bio}"
                </Typography>
              ) : (
                <Typography variant="body2" color="text.secondary" sx={{ fontStyle: 'italic', mb: 2 }}>
                  No bio provided yet.
                </Typography>
              )}

              <Divider sx={{ width: '100%', my: 2 }} />

              <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <EmailIcon color="action" />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Email Address
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {user.email}
                    </Typography>
                  </Box>
                  <Chip
                    icon={<LockIcon sx={{ fontSize: '0.85rem !important' }} />}
                    label="Immutable"
                    size="small"
                    variant="outlined"
                    color="primary"
                    sx={{ fontSize: '0.75rem' }}
                    title="User email is permanently locked and cannot be edited"
                  />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <NotificationsIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Notification Preferences
                    </Typography>
                    <Typography variant="body2">
                      Discussions: <strong>{user.notificationSettings?.newDiscussions !== false ? 'Enabled' : 'Disabled'}</strong> | Resources: <strong>{user.notificationSettings?.newResources !== false ? 'Enabled' : 'Disabled'}</strong>
                    </Typography>
                  </Box>
                </Box>
              </Box>

              <Button
                variant="outlined"
                color="error"
                fullWidth
                startIcon={<LogoutIcon />}
                onClick={handleLogout}
                aria-label="Log out of your account"
                sx={{ mt: 4 }}
              >
                Log Out
              </Button>
            </CardContent>
          </Card>
        </Grid>

        {/* Activity Log Card */}
        <Grid item xs={12} md={7}>
          <Card sx={{ height: '100%', p: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <HistoryIcon color="primary" />
                <Typography variant="h6" component="h2" sx={{ fontWeight: 700 }}>
                  Recent Platform Activity
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {user.activityLog && user.activityLog.length > 0 ? (
                <List disablePadding>
                  {user.activityLog
                    .slice()
                    .reverse()
                    .map((item, idx) => (
                      <ListItem
                        key={idx}
                        sx={{
                          py: 1.25,
                          px: 2,
                          mb: 1,
                          bgcolor: 'background.default',
                          borderRadius: 2
                        }}
                      >
                        <ListItemText
                          primary={item.action}
                          primaryTypographyProps={{ fontWeight: 600, variant: 'body2' }}
                          secondary={
                            item.timestamp
                              ? new Date(item.timestamp).toLocaleString()
                              : 'Recently'
                          }
                          secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                        />
                      </ListItem>
                    ))}
                </List>
              ) : (
                <Paper
                  variant="outlined"
                  sx={{ p: 4, textAlign: 'center', bgcolor: 'background.default' }}
                >
                  <Typography variant="body2" color="text.secondary">
                    No recent activity recorded yet.
                  </Typography>
                </Paper>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}
