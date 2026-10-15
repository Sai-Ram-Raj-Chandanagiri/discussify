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
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import LockIcon from '@mui/icons-material/Lock';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import ShieldIcon from '@mui/icons-material/Shield';
import HistoryIcon from '@mui/icons-material/History';
import LogoutIcon from '@mui/icons-material/Logout';
import SaveIcon from '@mui/icons-material/Save';
import NotificationsIcon from '@mui/icons-material/Notifications';
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

  // UI feedback state
  const [formErrors, setFormErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);

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
        }
      } catch (err) {
        console.error('Failed to fetch user profile:', err);
      } finally {
        setLoadingProfile(false);
      }
    };

    fetchLatestProfile();
  }, []);

  const handleFileChange = (e) => {
    setServerError('');
    setSuccessMessage('');

    const file = e.target.files?.[0];
    if (!file) return;

    // Strict Client-Side File Size Validation (2MB limit)
    if (file.size > MAX_IMAGE_SIZE_BYTES) {
      setServerError('Profile picture exceeds the maximum size limit of 2MB.');
      // Reset input value so same file can be re-selected if needed
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

    setIsSaving(true);
    try {
      const formData = new FormData();
      formData.append('name', name.trim());
      formData.append('bio', bio.trim());
      if (selectedFile) {
        formData.append('profilePicture', selectedFile);
      }

      const res = await api.put('/users/profile', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      setSuccessMessage(res.data.message || 'Profile updated successfully.');
      if (res.data.user) {
        setUser(res.data.user);
        setName(res.data.user.name || '');
        setBio(res.data.user.bio || '');
        if (res.data.user.profilePictureUrl) {
          setPreviewUrl(res.data.user.profilePictureUrl);
        }
      }
      setSelectedFile(null);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        'Failed to update profile details. Please try again.';
      setServerError(message);
    } finally {
      setIsSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (loadingProfile && !user) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  return (
    <Box component="section" aria-labelledby="profile-heading" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box sx={{ mb: 4 }}>
        <Typography id="profile-heading" variant="h4" component="h1" gutterBottom sx={{ fontWeight: 700 }}>
          Manage Profile
        </Typography>
        <Typography variant="body1" color="text.secondary">
          Update your public profile information, avatar, and review your platform activity timeline.
        </Typography>
      </Box>

      {/* Global Alert Banners */}
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
        {/* Left Column: Avatar & Overview */}
        <Grid item xs={12} md={4}>
          <Card sx={{ p: 2, height: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
            <CardContent sx={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              {/* Avatar with Upload Control */}
              <Box sx={{ position: 'relative', mb: 2 }}>
                <Avatar
                  src={previewUrl || user?.profilePictureUrl || undefined}
                  alt={`${user?.name}'s profile picture`}
                  sx={{
                    width: 120,
                    height: 120,
                    bgcolor: 'primary.main',
                    fontSize: '2.5rem',
                    border: '3px solid #e2e8f0'
                  }}
                >
                  {user?.name ? user.name.charAt(0).toUpperCase() : <PersonIcon sx={{ fontSize: 60 }} />}
                </Avatar>

                {/* Hidden File Input */}
                <input
                  type="file"
                  id="avatar-file-input"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  accept="image/jpeg,image/png,image/gif,image/webp"
                  style={{ display: 'none' }}
                  aria-label="Upload profile image"
                />

                <IconButton
                  id="upload-avatar-btn"
                  onClick={handleTriggerFileInput}
                  aria-label="Upload new profile picture"
                  sx={{
                    position: 'absolute',
                    bottom: 0,
                    right: 0,
                    bgcolor: 'primary.main',
                    color: '#ffffff',
                    boxShadow: 2,
                    '&:hover': { bgcolor: 'primary.dark' }
                  }}
                >
                  <PhotoCameraIcon fontSize="small" />
                </IconButton>
              </Box>

              <Typography variant="caption" color="text.secondary" sx={{ mb: 2, textAlign: 'center' }}>
                Max file size: 2MB (JPG, PNG, GIF, WEBP)
              </Typography>

              <Typography variant="h5" sx={{ fontWeight: 700, textAlign: 'center' }}>
                {user?.name}
              </Typography>

              <Chip
                icon={<ShieldIcon sx={{ fontSize: '1rem !important' }} />}
                label={user?.role === 'admin' ? 'Administrator' : 'Standard User'}
                color={user?.role === 'admin' ? 'secondary' : 'default'}
                size="small"
                sx={{ mt: 1, mb: 3, fontWeight: 600 }}
              />

              <Divider sx={{ width: '100%', mb: 3 }} />

              <Box sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}>
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

                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                  <NotificationsIcon color="action" />
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Notification Preferences
                    </Typography>
                    <Typography variant="body2">
                      Discussions: <strong>{user?.notificationSettings?.newDiscussions !== false ? 'Enabled' : 'Disabled'}</strong> | Resources: <strong>{user?.notificationSettings?.newResources !== false ? 'Enabled' : 'Disabled'}</strong>
                    </Typography>
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

        {/* Right Column: Edit Profile Form & Activity Timeline */}
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
