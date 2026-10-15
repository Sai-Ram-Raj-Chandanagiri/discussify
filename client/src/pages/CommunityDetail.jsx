import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Grid from '@mui/material/Grid';
import Chip from '@mui/material/Chip';
import Divider from '@mui/material/Divider';
import Avatar from '@mui/material/Avatar';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemAvatar from '@mui/material/ListItemAvatar';
import ListItemText from '@mui/material/ListItemText';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import TextField from '@mui/material/TextField';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import CircularProgress from '@mui/material/CircularProgress';
import LockIcon from '@mui/icons-material/Lock';
import PublicIcon from '@mui/icons-material/Public';
import EditIcon from '@mui/icons-material/Edit';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import GroupsIcon from '@mui/icons-material/Groups';
import EmailIcon from '@mui/icons-material/Email';
import StarIcon from '@mui/icons-material/Star';
import AlertBanner from '../components/AlertBanner';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function CommunityDetail() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [community, setCommunity] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Edit Community Dialog state
  const [openEdit, setOpenEdit] = useState(false);
  const [editName, setEditName] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editIsPrivate, setEditIsPrivate] = useState(false);
  const [editErrors, setEditErrors] = useState({});
  const [editServerError, setEditServerError] = useState('');
  const [editSuccessMessage, setEditSuccessMessage] = useState('');
  const [isEditing, setIsEditing] = useState(false);

  // Invite User Dialog state
  const [openInvite, setOpenInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteError, setInviteError] = useState('');
  const [inviteServerError, setInviteServerError] = useState('');
  const [inviteSuccessMessage, setInviteSuccessMessage] = useState('');
  const [isInviting, setIsInviting] = useState(false);

  const fetchCommunity = async () => {
    try {
      setLoading(true);
      const res = await api.get(`/communities/${id}`);
      setCommunity(res.data.community);
      setError('');
    } catch (err) {
      console.error('Fetch community detail error:', err);
      setError(
        err.response?.data?.message || 'Failed to load community details. It may not exist.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunity();
  }, [id]);

  const isCreator =
    isAuthenticated &&
    community &&
    (community.creator?._id === user?.id || community.creator === user?.id);

  const isMember =
    isAuthenticated &&
    community &&
    community.members?.some(
      (m) => (m._id || m) === user?.id
    );

  // Edit Handlers
  const handleOpenEdit = () => {
    setEditName(community.name);
    setEditDescription(community.description || '');
    setEditIsPrivate(community.isPrivate || false);
    setEditErrors({});
    setEditServerError('');
    setEditSuccessMessage('');
    setOpenEdit(true);
  };

  const handleCloseEdit = () => {
    if (!isEditing) {
      setOpenEdit(false);
    }
  };

  const handleEditSubmit = async (e) => {
    e.preventDefault();
    setEditServerError('');
    setEditSuccessMessage('');

    if (!editName.trim()) {
      setEditErrors({ name: 'Community name is required.' });
      return;
    }

    setIsEditing(true);
    try {
      const res = await api.put(`/communities/${id}`, {
        name: editName.trim(),
        description: editDescription.trim(),
        isPrivate: editIsPrivate
      });

      setEditSuccessMessage(res.data.message || 'Community updated successfully!');
      setCommunity(res.data.community);
      setTimeout(() => {
        setOpenEdit(false);
      }, 1000);
    } catch (err) {
      setEditServerError(
        err.response?.data?.message || 'Failed to update community details.'
      );
    } finally {
      setIsEditing(false);
    }
  };

  // Invite Handlers
  const handleOpenInvite = () => {
    setInviteEmail('');
    setInviteError('');
    setInviteServerError('');
    setInviteSuccessMessage('');
    setOpenInvite(true);
  };

  const handleCloseInvite = () => {
    if (!isInviting) {
      setOpenInvite(false);
    }
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    setInviteError('');
    setInviteServerError('');
    setInviteSuccessMessage('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!inviteEmail.trim()) {
      setInviteError('User email address is required.');
      return;
    }
    if (!emailRegex.test(inviteEmail.trim())) {
      setInviteError('Please enter a valid email address.');
      return;
    }

    setIsInviting(true);
    try {
      const res = await api.post(`/communities/${id}/invite`, {
        email: inviteEmail.trim()
      });

      setInviteSuccessMessage(res.data.message || 'Invitation sent successfully!');
      if (res.data.community) {
        setCommunity(res.data.community);
      }
      setTimeout(() => {
        setOpenInvite(false);
      }, 1200);
    } catch (err) {
      const message =
        err.response?.data?.message || 'Failed to send invitation. Please try again.';
      setInviteServerError(message);
    } finally {
      setIsInviting(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (error || !community) {
    return (
      <Box sx={{ py: 6 }}>
        <AlertBanner severity="error" message={error || 'Community not found.'} />
        <Button
          component={Link}
          to="/communities"
          startIcon={<ArrowBackIcon />}
          sx={{ mt: 2 }}
        >
          Back to Communities
        </Button>
      </Box>
    );
  }

  return (
    <Box component="section" aria-labelledby="community-detail-heading" sx={{ py: 4 }}>
      {/* Back link */}
      <Box sx={{ mb: 3 }}>
        <Button
          component={Link}
          to="/communities"
          startIcon={<ArrowBackIcon />}
          color="inherit"
          aria-label="Return to communities list"
          sx={{ fontWeight: 500 }}
        >
          All Communities
        </Button>
      </Box>

      {/* Header Banner */}
      <Card sx={{ p: { xs: 2, md: 4 }, mb: 4, borderRadius: 3 }}>
        <CardContent sx={{ p: 0 }}>
          <Box
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: { xs: 'flex-start', sm: 'center' },
              flexDirection: { xs: 'column', sm: 'row' },
              gap: 2,
              mb: 2
            }}
          >
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, flexWrap: 'wrap' }}>
              <Typography
                id="community-detail-heading"
                variant="h4"
                component="h1"
                sx={{ fontWeight: 800, color: 'text.primary' }}
              >
                {community.name}
              </Typography>
              <Chip
                icon={
                  community.isPrivate ? (
                    <LockIcon sx={{ fontSize: '0.9rem !important' }} />
                  ) : (
                    <PublicIcon sx={{ fontSize: '0.9rem !important' }} />
                  )
                }
                label={community.isPrivate ? 'Private Community' : 'Public Community'}
                color={community.isPrivate ? 'secondary' : 'default'}
                variant="outlined"
                sx={{ fontWeight: 600 }}
              />
            </Box>

            {/* Action Buttons for Creator / Members */}
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              {isCreator && (
                <Button
                  id="edit-community-btn"
                  variant="outlined"
                  color="primary"
                  startIcon={<EditIcon />}
                  onClick={handleOpenEdit}
                  aria-label="Edit community details"
                >
                  Edit Community
                </Button>
              )}

              {(isCreator || isMember) && (
                <Button
                  id="invite-member-btn"
                  variant="contained"
                  color="primary"
                  startIcon={<PersonAddIcon />}
                  onClick={handleOpenInvite}
                  aria-label="Invite a new user to this community"
                >
                  Invite Members
                </Button>
              )}
            </Box>
          </Box>

          <Typography variant="body1" color="text.secondary" sx={{ maxWidth: 850, mb: 3 }}>
            {community.description || 'No description provided for this community.'}
          </Typography>

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', gap: 3, flexWrap: 'wrap', alignItems: 'center' }}>
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
              <Avatar
                src={community.creator?.profilePictureUrl}
                alt={community.creator?.name}
                sx={{ width: 28, height: 28, fontSize: '0.875rem' }}
              >
                {community.creator?.name?.charAt(0) || 'C'}
              </Avatar>
              <Typography variant="body2" color="text.secondary">
                Created by <strong>{community.creator?.name || 'Community Leader'}</strong>
              </Typography>
            </Box>

            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
              <GroupsIcon color="action" sx={{ fontSize: '1.25rem' }} />
              <Typography variant="body2" color="text.secondary">
                <strong>{community.members?.length || 0}</strong> members
              </Typography>
            </Box>

            <Typography variant="caption" color="text.secondary">
              Established {new Date(community.createdAt).toLocaleDateString()}
            </Typography>
          </Box>
        </CardContent>
      </Card>

      <Grid container spacing={3}>
        {/* Members List */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', p: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <GroupsIcon color="primary" />
                <Typography variant="h6" component="h2" sx={{ fontWeight: 700 }}>
                  Community Members ({community.members?.length || 0})
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              <List disablePadding>
                {community.members?.map((member) => {
                  const isMemberCreator =
                    (member._id || member) ===
                    (community.creator?._id || community.creator);
                  return (
                    <ListItem
                      key={member._id || member}
                      sx={{
                        py: 1,
                        px: 1.5,
                        mb: 1,
                        borderRadius: 2,
                        bgcolor: 'background.default'
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          src={member.profilePictureUrl}
                          alt={member.name}
                          sx={{ bgcolor: 'primary.light', width: 36, height: 36 }}
                        >
                          {member.name ? member.name.charAt(0).toUpperCase() : 'U'}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Typography variant="body2" sx={{ fontWeight: 600 }}>
                              {member.name}
                            </Typography>
                            {isMemberCreator && (
                              <Chip
                                icon={<StarIcon sx={{ fontSize: '0.75rem !important' }} />}
                                label="Creator"
                                size="small"
                                color="primary"
                                sx={{ height: 20, fontSize: '0.65rem' }}
                              />
                            )}
                          </Box>
                        }
                        secondary={member.email}
                      />
                    </ListItem>
                  );
                })}
              </List>
            </CardContent>
          </Card>
        </Grid>

        {/* Invited / Pending Users & Overview */}
        <Grid item xs={12} md={6}>
          <Card sx={{ height: '100%', p: 2 }}>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                <EmailIcon color="secondary" />
                <Typography variant="h6" component="h2" sx={{ fontWeight: 700 }}>
                  Pending Invitations ({community.invitedUsers?.length || 0})
                </Typography>
              </Box>
              <Divider sx={{ mb: 2 }} />

              {community.invitedUsers && community.invitedUsers.length > 0 ? (
                <List disablePadding>
                  {community.invitedUsers.map((inv) => (
                    <ListItem
                      key={inv._id || inv}
                      sx={{
                        py: 1,
                        px: 1.5,
                        mb: 1,
                        borderRadius: 2,
                        bgcolor: 'background.default'
                      }}
                    >
                      <ListItemAvatar>
                        <Avatar
                          src={inv.profilePictureUrl}
                          alt={inv.name}
                          sx={{ bgcolor: 'secondary.light', width: 36, height: 36 }}
                        >
                          {inv.name ? inv.name.charAt(0).toUpperCase() : 'I'}
                        </Avatar>
                      </ListItemAvatar>
                      <ListItemText
                        primary={inv.name || 'Invited User'}
                        secondary={inv.email || 'Invitation sent'}
                      />
                      <Chip label="Invited" size="small" variant="outlined" color="secondary" />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Box sx={{ p: 4, textAlign: 'center', bgcolor: 'background.default', borderRadius: 2 }}>
                  <Typography variant="body2" color="text.secondary">
                    No pending invitations. Invite fellow peers to grow this community!
                  </Typography>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Edit Community Dialog */}
      <Dialog
        open={openEdit}
        onClose={handleCloseEdit}
        maxWidth="sm"
        fullWidth
        aria-labelledby="edit-community-dialog-title"
      >
        <DialogTitle id="edit-community-dialog-title" sx={{ fontWeight: 700 }}>
          Edit Community Details
        </DialogTitle>
        <Box component="form" onSubmit={handleEditSubmit} noValidate>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <AlertBanner
              severity="error"
              message={editServerError}
              onClose={() => setEditServerError('')}
            />
            <AlertBanner
              severity="success"
              message={editSuccessMessage}
              onClose={() => setEditSuccessMessage('')}
            />

            <TextField
              id="edit-community-name"
              name="name"
              label="Community Name"
              autoFocus
              fullWidth
              required
              value={editName}
              onChange={(e) => {
                setEditName(e.target.value);
                if (editErrors.name) setEditErrors({ ...editErrors, name: '' });
                if (editServerError) setEditServerError('');
              }}
              error={Boolean(editErrors.name)}
              helperText={editErrors.name || 'Unique community name (2-80 characters).'}
              inputProps={{
                'aria-required': 'true',
                'aria-invalid': Boolean(editErrors.name)
              }}
            />

            <TextField
              id="edit-community-description"
              name="description"
              label="Description"
              multiline
              rows={3}
              fullWidth
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
            />

            <FormControlLabel
              control={
                <Switch
                  id="edit-community-privacy"
                  checked={editIsPrivate}
                  onChange={(e) => setEditIsPrivate(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {editIsPrivate ? 'Private Community' : 'Public Community'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {editIsPrivate
                      ? 'Only invited users can view and participate.'
                      : 'Open to all registered members.'}
                  </Typography>
                </Box>
              }
            />
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={handleCloseEdit} color="inherit" disabled={isEditing}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="contained"
              color="primary"
              disabled={isEditing}
              aria-label="Save changes to community"
            >
              {isEditing ? <CircularProgress size={24} color="inherit" /> : 'Save Changes'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* Invite Member Dialog */}
      <Dialog
        open={openInvite}
        onClose={handleCloseInvite}
        maxWidth="sm"
        fullWidth
        aria-labelledby="invite-dialog-title"
      >
        <DialogTitle id="invite-dialog-title" sx={{ fontWeight: 700 }}>
          Invite to {community.name}
        </DialogTitle>
        <Box component="form" onSubmit={handleInviteSubmit} noValidate>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <AlertBanner
              severity="error"
              message={inviteServerError}
              onClose={() => setInviteServerError('')}
            />
            <AlertBanner
              severity="success"
              message={inviteSuccessMessage}
              onClose={() => setInviteSuccessMessage('')}
            />

            <Typography variant="body2" color="text.secondary">
              Enter the email address of the person you want to invite. They will receive an invitation on Discussify.
            </Typography>

            <TextField
              id="invite-email"
              name="email"
              label="User Email Address"
              type="email"
              autoFocus
              fullWidth
              required
              value={inviteEmail}
              onChange={(e) => {
                setInviteEmail(e.target.value);
                if (inviteError) setInviteError('');
                if (inviteServerError) setInviteServerError('');
              }}
              error={Boolean(inviteError)}
              helperText={inviteError}
              inputProps={{
                'aria-required': 'true',
                'aria-invalid': Boolean(inviteError)
              }}
            />
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={handleCloseInvite} color="inherit" disabled={isInviting}>
              Cancel
            </Button>
            <Button
              id="send-invite-btn"
              type="submit"
              variant="contained"
              color="primary"
              disabled={isInviting}
              aria-label="Send community invitation"
            >
              {isInviting ? <CircularProgress size={24} color="inherit" /> : 'Send Invite'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
