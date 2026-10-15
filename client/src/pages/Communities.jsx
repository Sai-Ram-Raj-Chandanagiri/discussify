import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
import Grid from '@mui/material/Grid';
import TextField from '@mui/material/TextField';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import Chip from '@mui/material/Chip';
import CircularProgress from '@mui/material/CircularProgress';
import InputAdornment from '@mui/material/InputAdornment';
import AddIcon from '@mui/icons-material/Add';
import SearchIcon from '@mui/icons-material/Search';
import LockIcon from '@mui/icons-material/Lock';
import PublicIcon from '@mui/icons-material/Public';
import PeopleIcon from '@mui/icons-material/People';
import GroupsIcon from '@mui/icons-material/Groups';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import AlertBanner from '../components/AlertBanner';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

export default function Communities() {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [pageError, setPageError] = useState('');
  const [pageSuccess, setPageSuccess] = useState('');

  // Create Dialog state
  const [openCreate, setOpenCreate] = useState(false);
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [createServerError, setCreateServerError] = useState('');
  const [createSuccessMessage, setCreateSuccessMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Joining/Leaving states
  const [actionLoadingId, setActionLoadingId] = useState(null);

  const fetchCommunities = async (searchQuery = '') => {
    try {
      setLoading(true);
      const url = searchQuery ? `/communities?search=${encodeURIComponent(searchQuery)}` : '/communities';
      const res = await api.get(url);
      setCommunities(res.data.communities || []);
      setPageError('');
    } catch (err) {
      console.error('Fetch communities error:', err);
      setPageError('Failed to load communities. Please refresh the page.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const delayDebounceFn = setTimeout(() => {
      fetchCommunities(searchTerm.trim());
    }, 300);

    return () => clearTimeout(delayDebounceFn);
  }, [searchTerm]);

  const handleOpenCreate = () => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/communities' } } });
      return;
    }
    setName('');
    setDescription('');
    setIsPrivate(false);
    setFormErrors({});
    setCreateServerError('');
    setCreateSuccessMessage('');
    setOpenCreate(true);
  };

  const handleCloseCreate = () => {
    if (!isSubmitting) {
      setOpenCreate(false);
    }
  };

  const validateCreate = () => {
    const errors = {};
    if (!name.trim()) {
      errors.name = 'Community name is required.';
    } else if (name.trim().length < 2) {
      errors.name = 'Community name must be at least 2 characters.';
    } else if (name.trim().length > 80) {
      errors.name = 'Community name cannot exceed 80 characters.';
    }
    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCreateSubmit = async (e) => {
    e.preventDefault();
    setCreateServerError('');
    setCreateSuccessMessage('');

    if (!validateCreate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/communities', {
        name: name.trim(),
        description: description.trim(),
        isPrivate
      });

      setCreateSuccessMessage(res.data.message || 'Community created successfully!');
      setTimeout(() => {
        setOpenCreate(false);
        fetchCommunities(searchTerm.trim());
        if (res.data.community?._id) {
          navigate(`/communities/${res.data.community._id}`);
        }
      }, 1000);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        'Failed to create community. Please check your network and try again.';
      setCreateServerError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Join Community Handler
  const handleJoin = async (communityId) => {
    if (!isAuthenticated) {
      navigate('/login', { state: { from: { pathname: '/communities' } } });
      return;
    }

    setPageError('');
    setPageSuccess('');
    setActionLoadingId(communityId);

    try {
      const res = await api.post(`/communities/${communityId}/join`);
      setPageSuccess(res.data.message || 'Successfully joined community!');
      fetchCommunities(searchTerm.trim());
    } catch (err) {
      const message =
        err.response?.data?.message || 'Failed to join community.';
      setPageError(message);
    } finally {
      setActionLoadingId(null);
    }
  };

  // Leave Community Handler
  const handleLeave = async (communityId) => {
    if (!isAuthenticated) return;

    setPageError('');
    setPageSuccess('');
    setActionLoadingId(communityId);

    try {
      const res = await api.post(`/communities/${communityId}/leave`);
      setPageSuccess(res.data.message || 'Successfully left community.');
      fetchCommunities(searchTerm.trim());
    } catch (err) {
      const message =
        err.response?.data?.message || 'Failed to leave community.';
      setPageError(message);
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <Box component="section" aria-labelledby="communities-heading" sx={{ py: 4 }}>
      {/* Page Header */}
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: { xs: 'flex-start', sm: 'center' },
          flexDirection: { xs: 'column', sm: 'row' },
          gap: 2,
          mb: 4
        }}
      >
        <Box>
          <Typography
            id="communities-heading"
            variant="h4"
            component="h1"
            sx={{ fontWeight: 700 }}
          >
            Community Directory
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Find and join communities centered on your topics of passion, or start your own.
          </Typography>
        </Box>

        <Button
          id="create-community-open-btn"
          variant="contained"
          color="primary"
          size="large"
          startIcon={<AddIcon />}
          onClick={handleOpenCreate}
          aria-label="Create a new community"
          sx={{ fontWeight: 600, whiteSpace: 'nowrap' }}
        >
          Create Community
        </Button>
      </Box>

      {/* Global Alerts */}
      <AlertBanner severity="error" message={pageError} onClose={() => setPageError('')} />
      <AlertBanner severity="success" message={pageSuccess} onClose={() => setPageSuccess('')} />

      {/* Search Bar */}
      <Box sx={{ mb: 4 }}>
        <TextField
          id="community-search"
          label="Search Communities"
          placeholder="Search communities by name or topic keyword..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          fullWidth
          inputProps={{
            'aria-label': 'Search communities by name or topic keyword'
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon color="action" />
              </InputAdornment>
            )
          }}
          sx={{ bgcolor: 'background.paper', borderRadius: 2 }}
        />
      </Box>

      {/* Communities Grid */}
      {loading ? (
        <Box
          sx={{ display: 'flex', justifyContent: 'center', py: 8 }}
          aria-busy="true"
          aria-label="Loading communities list"
        >
          <CircularProgress color="primary" />
        </Box>
      ) : communities.length > 0 ? (
        <Grid container spacing={3}>
          {communities.map((comm) => {
            const isCreator =
              user &&
              ((comm.creator?._id || comm.creator) === user.id);
            const isMember =
              user &&
              comm.members?.some((m) => (m._id || m) === user.id);
            const isActionLoading = actionLoadingId === comm._id;

            return (
              <Grid item xs={12} sm={6} md={4} key={comm._id}>
                <Card
                  sx={{
                    height: '100%',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'transform 0.2s, box-shadow 0.2s',
                    '&:hover': {
                      transform: 'translateY(-2px)',
                      boxShadow: '0 8px 24px rgba(0, 0, 0, 0.1)'
                    }
                  }}
                >
                  <CardContent sx={{ flex: 1, pb: 1 }}>
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                      <Typography
                        variant="h6"
                        component="h2"
                        sx={{
                          fontWeight: 700,
                          lineHeight: 1.3,
                          color: 'primary.dark'
                        }}
                      >
                        {comm.name}
                      </Typography>
                      <Chip
                        icon={comm.isPrivate ? <LockIcon sx={{ fontSize: '0.85rem !important' }} /> : <PublicIcon sx={{ fontSize: '0.85rem !important' }} />}
                        label={comm.isPrivate ? 'Private' : 'Public'}
                        size="small"
                        color={comm.isPrivate ? 'secondary' : 'default'}
                        variant="outlined"
                        sx={{ fontSize: '0.75rem', fontWeight: 600 }}
                      />
                    </Box>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                      sx={{
                        mb: 2,
                        display: '-webkit-box',
                        WebkitLineClamp: 3,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                        minHeight: '4.2em'
                      }}
                    >
                      {comm.description || 'No description provided for this community.'}
                    </Typography>

                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, color: 'text.secondary', fontSize: '0.875rem' }}>
                      <PeopleIcon sx={{ fontSize: '1.1rem' }} />
                      <Typography variant="caption" sx={{ fontWeight: 600 }}>
                        {comm.members?.length || 1} {comm.members?.length === 1 ? 'member' : 'members'}
                      </Typography>
                    </Box>
                  </CardContent>

                  <CardActions sx={{ px: 2, pb: 2, pt: 1, justifyContent: 'space-between', borderTop: '1px solid #f1f5f9' }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      {isCreator ? (
                        <Chip label="Creator" size="small" color="primary" sx={{ height: 24, fontSize: '0.75rem' }} />
                      ) : isMember ? (
                        <Button
                          size="small"
                          variant="outlined"
                          color="error"
                          startIcon={<LogoutIcon fontSize="small" />}
                          onClick={() => handleLeave(comm._id)}
                          disabled={isActionLoading}
                          aria-label={`Leave ${comm.name}`}
                        >
                          Leave
                        </Button>
                      ) : (
                        <Button
                          size="small"
                          variant="contained"
                          color="primary"
                          startIcon={<LoginIcon fontSize="small" />}
                          onClick={() => handleJoin(comm._id)}
                          disabled={isActionLoading}
                          aria-label={`Join ${comm.name}`}
                        >
                          Join
                        </Button>
                      )}
                    </Box>

                    <Button
                      component={Link}
                      to={`/communities/${comm._id}`}
                      size="small"
                      color="inherit"
                      aria-label={`View details for ${comm.name}`}
                      sx={{ fontWeight: 600 }}
                    >
                      View &rarr;
                    </Button>
                  </CardActions>
                </Card>
              </Grid>
            );
          })}
        </Grid>
      ) : (
        <Card sx={{ p: 6, textAlign: 'center' }}>
          <GroupsIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" gutterBottom>
            No communities found
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            {searchTerm
              ? `No communities matched your search term "${searchTerm}".`
              : 'Be the pioneer! Create the very first community on Discussify.'}
          </Typography>
          <Button variant="contained" color="primary" onClick={handleOpenCreate}>
            Create Community
          </Button>
        </Card>
      )}

      {/* Accessible Create Community Dialog */}
      <Dialog
        open={openCreate}
        onClose={handleCloseCreate}
        maxWidth="sm"
        fullWidth
        aria-labelledby="create-community-dialog-title"
      >
        <DialogTitle id="create-community-dialog-title" sx={{ fontWeight: 700 }}>
          Create a New Community
        </DialogTitle>
        <Box component="form" onSubmit={handleCreateSubmit} noValidate>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <AlertBanner
              severity="error"
              message={createServerError}
              onClose={() => setCreateServerError('')}
            />
            <AlertBanner
              severity="success"
              message={createSuccessMessage}
              onClose={() => setCreateSuccessMessage('')}
            />

            <TextField
              id="community-name"
              name="name"
              label="Community Name"
              autoFocus
              fullWidth
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (formErrors.name) setFormErrors({ ...formErrors, name: '' });
                if (createServerError) setCreateServerError('');
              }}
              error={Boolean(formErrors.name)}
              helperText={formErrors.name || 'Must be unique (case-insensitive) between 2 and 80 characters.'}
              FormHelperTextProps={{
                role: formErrors.name ? 'alert' : undefined
              }}
              inputProps={{
                'aria-required': 'true',
                'aria-invalid': Boolean(formErrors.name)
              }}
            />

            <TextField
              id="community-description"
              name="description"
              label="Description"
              multiline
              rows={3}
              fullWidth
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              helperText="Describe what topics, discussions, and resources will be shared."
            />

            <FormControlLabel
              control={
                <Switch
                  id="community-privacy"
                  checked={isPrivate}
                  onChange={(e) => setIsPrivate(e.target.checked)}
                  color="primary"
                  inputProps={{ 'aria-label': 'Make community private' }}
                />
              }
              label={
                <Box>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>
                    {isPrivate ? 'Private Community' : 'Public Community'}
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    {isPrivate
                      ? 'Only invited members can join and participate in discussions.'
                      : 'Anyone on Discussify can discover and join this community.'}
                  </Typography>
                </Box>
              }
            />
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={handleCloseCreate} color="inherit" disabled={isSubmitting}>
              Cancel
            </Button>
            <Button
              id="create-community-submit-btn"
              type="submit"
              variant="contained"
              color="primary"
              disabled={isSubmitting}
              aria-label="Submit new community creation"
            >
              {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Create Community'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
