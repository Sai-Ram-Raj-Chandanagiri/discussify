import React, { useState, useEffect, useRef } from 'react';
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
import TextField from '@mui/material/TextField';
import CircularProgress from '@mui/material/CircularProgress';
import Paper from '@mui/material/Paper';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemText from '@mui/material/ListItemText';
import IconButton from '@mui/material/IconButton';
import Switch from '@mui/material/Switch';
import FormControlLabel from '@mui/material/FormControlLabel';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import ShieldIcon from '@mui/icons-material/Shield';
import HistoryIcon from '@mui/icons-material/History';
import LogoutIcon from '@mui/icons-material/Logout';
import SaveIcon from '@mui/icons-material/Save';
import NotificationsIcon from '@mui/icons-material/Notifications';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined';
import ForumIcon from '@mui/icons-material/Forum';
import DescriptionIcon from '@mui/icons-material/Description';
import AlertBanner from '../components/AlertBanner';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const MAX_IMAGE_SIZE_BYTES = 2 * 1024 * 1024; // 2MB

export default function Profile() {
  const { user, setUser, logout } = useAuth();
  const navigate = useNavigate();
  const fileInputRef = useRef(null);

  // Profile form state
  const [name, setName] = useState('');
  const [bio, setBio] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState('');

  // UI feedback state for Profile Details
  const [formErrors, setFormErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

  // Notification Preferences state
  const [notifSettings, setNotifSettings] = useState({
    newDiscussions: true,
    newResources: true
  });
  const [settingsError, setSettingsError] = useState('');
  const [settingsSuccess, setSettingsSuccess] = useState('');
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  // Fetch fresh profile details on mount
  useEffect(() => {
    const fetchLatestProfile = async () => {
      try {
        setLoadingProfile(true);
        const res = await api.get('/users/profile');
        if (res.data?.user) {
          setUser(res.data.user);
          setName(res.data.user.name || '');
          setBio(res.data.user.bio || '');
          if (res.data.user.profilePictureUrl) {
            setPreviewUrl(res.data.user.profilePictureUrl);
          }
          if (res.data.user.notificationSettings) {
            setNotifSettings({
              newDiscussions: res.data.user.notificationSettings.newDiscussions !== false,
              newResources: res.data.user.notificationSettings.newResources !== false
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchLatestProfile();
  }, []);

  // Sync notificationSettings state when user in context updates
  useEffect(() => {
    if (user?.notificationSettings) {
      setNotifSettings({
        newDiscussions: user.notificationSettings.newDiscussions !== false,
        newResources: user.notificationSettings.newResources !== false
      });
    }
  }, [user?.notificationSettings]);

  const handleFileChange = (e) => {
    setServerError('');
    setSuccessMessage('');

    const file = e.target.files?.[0];
    if (!file) return;

    // Strict Client-Side File Size Validation (2MB limit)
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setServerError('Profile picture exceeds the maximum size limit of 2MB.');
      e.target.value = '';
      setSelectedFile(null);
      return;
    }

    if (!file.type.startsWith('image/')) {
      setServerError('Only image files (JPEG, PNG, GIF, WEBP) are allowed.');
      e.target.value = '';
      setSelectedFile(null);
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleTriggerFileInput = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!name.trim()) {
      errors.name = 'Full name is required.';
    }
    if (bio && bio.length > 500) {
      errors.bio = 'Bio cannot exceed 500 characters.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setSuccessMessage('');

    if (!validateForm()) {
      return;
    }

    try {
      setIsSaving(true);
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('bio', bio.trim());
      if (selectedFile) {
        formData.append('profilePicture', selectedFile);
      }

      const res = await api.put('/users/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      if (res.data?.user) {
        setUser(res.data.user);
        localStorage.setItem('user', JSON.stringify(res.data.user));
      }

      setSuccessMessage(res.data.message || 'Profile updated successfully.');
      setSelectedFile(null);
    } catch (err) {
      console.error('Profile update failed:', err);
      const errMsg = err?.response?.data?.message || 'Failed to update profile. Please try again.';
      setServerError(errMsg);
    } finally {
      setIsSaving(false);
    }
  };

  // STRICT NEGATIVE CRITERION 2:
  // Prevent toggling off all notification switches at once
  const handleToggleDiscussions = (e) => {
    const nextVal = e.target.checked;
    setSettingsError('');
    setSettingsSuccess('');

    if (!nextVal && !notifSettings.newResources) {
      setSettingsError('You cannot turn off all notifications. At least one notification type must remain enabled.');
      return;
    }

    setNotifSettings((prev) => ({
      ...prev,
      newDiscussions: nextVal
    }));
  };

  const handleToggleResources = (e) => {
    const nextVal = e.target.checked;
    setSettingsError('');
    setSettingsSuccess('');

    if (!nextVal && !notifSettings.newDiscussions) {
      setSettingsError('You cannot turn off all notifications. At least one notification type must remain enabled.');
      return;
    }

    setNotifSettings((prev) => ({
      ...prev,
      newResources: nextVal
    }));
  };

  const handleSaveNotificationSettings = async () => {
    setSettingsError('');
    setSettingsSuccess('');

    // Strict Negative Criterion 2 validation check before API call
    if (!notifSettings.newDiscussions && !notifSettings.newResources) {
      setSettingsError('You cannot turn off all notifications. At least one notification type must remain enabled.');
      return;
    }

    try {
      setIsSavingSettings(true);
      const res = await api.put('/users/notification-settings', {
        newDiscussions: notifSettings.newDiscussions,
        newResources: notifSettings.newResources
      });

      if (res.data?.user) {
        setUser(res.data.user);
        localStorage.setItem('user', JSON.stringify(res.data.user));
      }

      setSettingsSuccess(res.data.message || 'Notification settings updated successfully.');
      window.dispatchEvent(new Event('discussify-refresh-notifications'));
    } catch (err) {
      console.error('Failed to update notification settings:', err);
      const errMsg = err?.response?.data?.message || 'Failed to update notification settings.';
      setSettingsError(errMsg);
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loadingProfile) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh' }}>
        <CircularProgress size={48} />
      </Box>
    );
  }

  return (
    <Box component="main" sx={{ py: 4 }} aria-label="User Profile Management">
      <Typography variant="h4" component="h1" gutterBottom sx={{ fontWeight: 800, mb: 3 }}>
        User Profile
      </Typography>

      {/* Global alert feedback */}
      <AlertBanner
        severity="error"
        message={serverError}
        onClose={() => setServerError('')}
      />
      <AlertBanner
        severity="success"
        message={successMessage}
        onClose={() => setSuccessMessage('')}
      />

      <Grid container spacing={4}>
        {/* Left Column: Profile Card & Identity Overview */}
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', display: 'flex', flexDirection: 'column', p: 2 }}>
            <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
              {/* Avatar with Camera upload button */}
              <Box sx={{ position: 'relative', mb: 2 }}>
                <Avatar
                  src={previewUrl}
                  alt={`${user?.name}'s avatar`}
                  sx={{ width: 120, height: 120, border: '4px solid #3b82f6', bgcolor: 'primary.light' }}
                >
                  <PersonIcon sx={{ fontSize: 64 }} />
                </Avatar>
                <IconButton
                  color="primary"
                  aria-label="Upload profile picture (Max 2MB)"
                  onClick={handleTriggerFileInput}
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    bgcolor: 'background.paper',
                    boxShadow: 2,
                    '&:hover': { bgcolor: 'grey.100' }
                  }}
                >
                  <PhotoCameraIcon fontSize="small" />
                </IconButton>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  hidden
                  onChange={handleFileChange}
                  aria-label="Select profile picture file"
                />
              </Box>

              <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>
                {user?.name}
              </Typography>

              <Chip
                icon={<ShieldIcon sx={{ fontSize: '1rem !important' }} />}
                label={user?.role?.toUpperCase() || 'USER'}
                size="small"
                color={user?.role === 'admin' ? 'secondary' : 'default'}
                sx={{ mt: 1, mb: 2, fontWeight: 600 }}
              />

              <Typography variant="body2" color="text.secondary" sx={{ mb: 3, px: 2 }}>
                {user?.bio || 'No bio provided yet. Click below to share your story with the community.'}
              </Typography>

              <Divider sx={{ width: '100%', mb: 2 }} />

              {/* Immutable & System Info Fields */}
              <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2, textAlign: 'left' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <EmailIcon color="action" />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Email Address
                    </Typography>
                    <Typography variant="body2" sx={{ fontWeight: 600 }}>
                      {user?.email}
                    </Typography>
                  </Box>
                  <Chip
                    icon={<LockIcon sx={{ fontSize: '0.85rem !important' }} />}
                    label="Immutable"
                    size="small"
                    variant="outlined"
                    color="primary"
                    sx={{ fontSize: '0.75rem', fontWeight: 600 }}
                    title="User email is permanently locked and cannot be edited"
                  />
                </Box>

                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                  <NotificationsIcon color="action" sx={{ mt: 0.5 }} />
                  <Box sx={{ flex: 1 }}>
                    <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                      Active Notification Types
                    </Typography>
                    <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap' }}>
                      <Chip
                        label={user?.notificationSettings?.newDiscussions !== false ? 'Discussions: ON' : 'Discussions: OFF'}
                        size="small"
                        color={user?.notificationSettings?.newDiscussions !== false ? 'primary' : 'default'}
                        variant={user?.notificationSettings?.newDiscussions !== false ? 'filled' : 'outlined'}
                        sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      />
                      <Chip
                        label={user?.notificationSettings?.newResources !== false ? 'Resources: ON' : 'Resources: OFF'}
                        size="small"
                        color={user?.notificationSettings?.newResources !== false ? 'success' : 'default'}
                        variant={user?.notificationSettings?.newResources !== false ? 'filled' : 'outlined'}
                        sx={{ fontSize: '0.7rem', fontWeight: 600 }}
                      />
                    </Box>
                  </Box>
                </Box>
              </Box>

              <Box sx={{ mt: 'auto', pt: 4, width: '100%' }}>
                <Button
                  variant="outlined"
                  color="error"
                  fullWidth
                  startIcon={<LogoutIcon />}
                  onClick={handleLogout}
                  aria-label="Log out of your account"
                >
                  Log Out
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        {/* Right Column: Edit Profile Form, Notification Preferences Panel, & Activity Timeline */}
        <Grid item xs={12} md={8}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {/* Edit Profile Form */}
            <Card sx={{ p: 2 }}>
              <CardContent>
                <Typography variant="h6" component="h2" gutterBottom sx={{ fontWeight: 700 }}>
                  Edit Profile Details
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                  Update your display name and bio. Note: Email address cannot be changed.
                </Typography>

                <Box
                  component="form"
                  onSubmit={handleProfileSubmit}
                  noValidate
                  sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}
                >
                  {/* Email Field - Strictly Disabled / ReadOnly */}
                  <TextField
                    id="profile-email"
                    name="email"
                    label="Email Address (Immutable)"
                    type="email"
                    fullWidth
                    disabled
                    value={user?.email || ''}
                    InputProps={{
                      readOnly: true,
                      endAdornment: <LockIcon color="action" sx={{ mr: 1 }} />
                    }}
                    helperText="Your registered email address is strictly immutable and cannot be edited."
                    aria-label="Email address (read-only)"
                  />

                  {/* Full Name Field */}
                  <TextField
                    id="profile-name"
                    name="name"
                    label="Full Name"
                    fullWidth
                    required
                    value={name}
                    onChange={(e) => {
                      setName(e.target.value);
                      if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
                    }}
                    error={Boolean(formErrors.name)}
                    helperText={formErrors.name}
                    FormHelperTextProps={{
                      role: formErrors.name ? 'alert' : undefined
                    }}
                    inputProps={{
                      'aria-required': 'true',
                      'aria-invalid': Boolean(formErrors.name)
                    }}
                  />

                  {/* Bio Field */}
                  <TextField
                    id="profile-bio"
                    name="bio"
                    label="Bio"
                    multiline
                    rows={3}
                    fullWidth
                    value={bio}
                    onChange={(e) => {
                      setBio(e.target.value);
                      if (formErrors.bio) setFormErrors({ ...formErrors, bio: '' });
                    }}
                    error={Boolean(formErrors.bio)}
                    helperText={formErrors.bio || `${bio.length}/500 characters. Tell the community about your interests.`}
                    FormHelperTextProps={{
                      role: formErrors.bio ? 'alert' : undefined
                    }}
                    inputProps={{
                      maxLength: 500
                    }}
                  />

                  <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                    <Button
                      id="save-profile-btn"
                      type="submit"
                      variant="contained"
                      color="primary"
                      size="large"
                      disabled={isSaving}
                      startIcon={<SaveIcon />}
                      aria-label="Save profile updates"
                      sx={{ px: 4 }}
                    >
                      {isSaving ? <CircularProgress size={24} color="inherit" /> : 'Save Profile'}
                    </Button>
                  </Box>
                </Box>
              </CardContent>
            </Card>

            {/* NOTIFICATION SETTINGS PANEL (User Story 7) */}
            <section aria-labelledby="notification-settings-heading">
              <Card sx={{ p: 2 }}>
                <CardContent>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, mb: 1 }}>
                    <NotificationsIcon color="primary" />
                    <Typography variant="h6" component="h2" id="notification-settings-heading" sx={{ fontWeight: 700 }}>
                      Notification Preferences
                    </Typography>
                  </Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
                    Choose which notifications you wish to receive from your joined communities.
                    To stay connected, at least one notification category must remain enabled.
                  </Typography>

                  {/* Settings Specific Feedback */}
                  <AlertBanner
                    severity="error"
                    message={settingsError}
                    onClose={() => setSettingsError('')}
                  />
                  <AlertBanner
                    severity="success"
                    message={settingsSuccess}
                    onClose={() => setSettingsSuccess('')}
                  />

                  {/* Single switch warning callout */}
                  {(!notifSettings.newDiscussions || !notifSettings.newResources) && (
                    <Box
                      sx={{
                        mb: 2,
                        p: 1.5,
                        bgcolor: 'info.50',
                        border: '1px solid #bfdbfe',
                        borderRadius: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 1
                      }}
                    >
                      <InfoOutlinedIcon color="info" fontSize="small" />
                      <Typography variant="caption" sx={{ fontWeight: 600, color: 'info.dark' }}>
                        Notice: You cannot turn off all notifications. At least one notification type must remain enabled.
                      </Typography>
                    </Box>
                  )}

                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    {/* New Discussions Switch */}
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        bgcolor: notifSettings.newDiscussions ? 'inherit' : 'action.hover',
                        transition: 'background-color 0.2s ease'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, pr: 2 }}>
                        <ForumIcon color={notifSettings.newDiscussions ? 'primary' : 'disabled'} sx={{ mt: 0.5 }} />
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            New Discussions
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Receive notifications whenever another member starts a new discussion in your communities.
                          </Typography>
                          {notifSettings.newDiscussions && !notifSettings.newResources && (
                            <Typography
                              variant="caption"
                              color="warning.main"
                              sx={{ display: 'block', mt: 0.5, fontWeight: 600 }}
                            >
                              * Cannot be toggled off while resource notifications are disabled.
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      <FormControlLabel
                        control={
                          <Switch
                            id="switch-new-discussions"
                            checked={notifSettings.newDiscussions}
                            onChange={handleToggleDiscussions}
                            color="primary"
                            inputProps={{
                              'aria-label': 'Toggle notifications for new discussions',
                              'aria-checked': notifSettings.newDiscussions
                            }}
                          />
                        }
                        label=""
                        sx={{ m: 0 }}
                      />
                    </Paper>

                    {/* New Resources Switch */}
                    <Paper
                      variant="outlined"
                      sx={{
                        p: 2,
                        borderRadius: 2,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        bgcolor: notifSettings.newResources ? 'inherit' : 'action.hover',
                        transition: 'background-color 0.2s ease'
                      }}
                    >
                      <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, pr: 2 }}>
                        <DescriptionIcon color={notifSettings.newResources ? 'success' : 'disabled'} sx={{ mt: 0.5 }} />
                        <Box>
                          <Typography variant="subtitle2" sx={{ fontWeight: 600 }}>
                            New Resources
                          </Typography>
                          <Typography variant="body2" color="text.secondary">
                            Receive notifications whenever an article, video, or file is shared in your communities.
                          </Typography>
                          {notifSettings.newResources && !notifSettings.newDiscussions && (
                            <Typography
                              variant="caption"
                              color="warning.main"
                              sx={{ display: 'block', mt: 0.5, fontWeight: 600 }}
                            >
                              * Cannot be toggled off while discussion notifications are disabled.
                            </Typography>
                          )}
                        </Box>
                      </Box>
                      <FormControlLabel
                        control={
                          <Switch
                            id="switch-new-resources"
                            checked={notifSettings.newResources}
                            onChange={handleToggleResources}
                            color="primary"
                            inputProps={{
                              'aria-label': 'Toggle notifications for new resources',
                              'aria-checked': notifSettings.newResources
                            }}
                          />
                        }
                        label=""
                        sx={{ m: 0 }}
                      />
                    </Paper>

                    <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 1 }}>
                      <Button
                        id="save-notifications-btn"
                        variant="contained"
                        color="primary"
                        onClick={handleSaveNotificationSettings}
                        disabled={isSavingSettings}
                        startIcon={<SaveIcon />}
                        aria-label="Save notification preferences"
                        sx={{ px: 3 }}
                      >
                        {isSavingSettings ? (
                          <CircularProgress size={24} color="inherit" />
                        ) : (
                          'Save Notification Preferences'
                        )}
                      </Button>
                    </Box>
                  </Box>
                </CardContent>
              </Card>
            </section>

            {/* Activity Timeline Section */}
            <Card sx={{ p: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <HistoryIcon color="primary" />
                  <Typography variant="h6" component="h2" sx={{ fontWeight: 700 }}>
                    Activity Timeline
                  </Typography>
                </Box>
                <Divider sx={{ mb: 2 }} />

                {user?.activityLog && user.activityLog.length > 0 ? (
                  <List disablePadding>
                    {user.activityLog
                      .slice()
                      .reverse()
                      .map((item, idx) => (
                        <ListItem
                          key={idx}
                          sx={{
                            py: 1.5,
                            px: 2,
                            mb: 1.5,
                            bgcolor: 'background.default',
                            borderRadius: 2,
                            borderLeft: '4px solid #1e40af',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: { xs: 'flex-start', sm: 'center' },
                            flexDirection: { xs: 'column', sm: 'row' },
                            gap: 0.5
                          }}
                        >
                          <ListItemText
                            primary={item.action}
                            primaryTypographyProps={{ fontWeight: 600, variant: 'body2' }}
                            secondary={
                              item.timestamp
                                ? new Date(item.timestamp).toLocaleString()
                                : 'Recent action'
                            }
                            secondaryTypographyProps={{ variant: 'caption', color: 'text.secondary' }}
                          />
                          <Chip
                            label={item.action.split(' ')[0] || 'Event'}
                            size="small"
                            variant="outlined"
                            sx={{ fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}
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
                      No platform activities recorded yet.
                    </Typography>
                  </Paper>
                )}
              </CardContent>
            </Card>
          </Box>
        </Grid>
      </Grid>
    </Box>
  );
}
