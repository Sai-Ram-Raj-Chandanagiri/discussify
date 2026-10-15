import React, { useState, useEffect, useCallback } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import Button from '@mui/material/Button';
import IconButton from '@mui/material/IconButton';
import TextField from '@mui/material/TextField';
import InputAdornment from '@mui/material/InputAdornment';
import Avatar from '@mui/material/Avatar';
import Chip from '@mui/material/Chip';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Paper from '@mui/material/Paper';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import FormControl from '@mui/material/FormControl';
import InputLabel from '@mui/material/InputLabel';
import Select from '@mui/material/Select';
import MenuItem from '@mui/material/MenuItem';
import FormControlLabel from '@mui/material/FormControlLabel';
import Switch from '@mui/material/Switch';
import CircularProgress from '@mui/material/CircularProgress';
import Tooltip from '@mui/material/Tooltip';
import Alert from '@mui/material/Alert';

// Icons
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import PeopleIcon from '@mui/icons-material/People';
import GroupsIcon from '@mui/icons-material/Groups';
import ForumIcon from '@mui/icons-material/Forum';
import SearchIcon from '@mui/icons-material/Search';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import LockIcon from '@mui/icons-material/Lock';
import PublicIcon from '@mui/icons-material/Public';
import RefreshIcon from '@mui/icons-material/Refresh';
import WarningAmberIcon from '@mui/icons-material/WarningAmber';

import AlertBanner from '../components/AlertBanner';
import api from '../services/api';

export default function AdminDashboard() {
  const [activeTab, setActiveTab] = useState(0);

  // Data state
  const [users, setUsers] = useState([]);
  const [communities, setCommunities] = useState([]);
  const [loading, setLoading] = useState(true);

  // Search filter state
  const [searchUser, setSearchUser] = useState('');
  const [searchCommunity, setSearchCommunity] = useState('');

  // Global alerts
  const [globalError, setGlobalError] = useState('');
  const [globalSuccess, setGlobalSuccess] = useState('');

  // Edit User Dialog state
  const [editUserOpen, setEditUserOpen] = useState(false);
  const [editingUser, setEditingUser] = useState({ id: '', name: '', email: '', bio: '', role: 'user' });
  const [savingUser, setSavingUser] = useState(false);
  const [editUserError, setEditUserError] = useState('');

  // Delete User Dialog state
  const [deleteUserOpen, setDeleteUserOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);
  const [deletingUser, setDeletingUser] = useState(false);

  // Edit Community Dialog state
  const [editCommOpen, setEditCommOpen] = useState(false);
  const [editingComm, setEditingComm] = useState({ id: '', name: '', description: '', isPrivate: false });
  const [savingComm, setSavingComm] = useState(false);
  const [editCommError, setEditCommError] = useState('');

  // Delete Community Dialog state
  const [deleteCommOpen, setDeleteCommOpen] = useState(false);
  const [commToDelete, setCommToDelete] = useState(null);
  const [deletingComm, setDeletingComm] = useState(false);

  // Fetch all users and communities
  const fetchData = useCallback(async () => {
    try {
      setLoading(true);
      setGlobalError('');

      const [usersRes, commsRes] = await Promise.all([
        api.get('/admin/users'),
        api.get('/admin/communities')
      ]);

      setUsers(usersRes.data.users || []);
      setCommunities(commsRes.data.communities || []);
    } catch (err) {
      console.error('Admin data fetch error:', err);
      setGlobalError(err?.response?.data?.message || 'Failed to load administrator data.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Tab change handler
  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
    setGlobalError('');
    setGlobalSuccess('');
  };

  // --- USER ACTIONS ---
  const handleOpenEditUser = (user) => {
    setEditingUser({
      id: user._id || user.id,
      name: user.name || '',
      email: user.email || '',
      bio: user.bio || '',
      role: user.role || 'user'
    });
    setEditUserError('');
    setEditUserOpen(true);
  };

  const handleCloseEditUser = () => {
    setEditUserOpen(false);
    setEditUserError('');
  };

  const handleSaveUser = async (e) => {
    e.preventDefault();
    setEditUserError('');

    if (!editingUser.name.trim()) {
      setEditUserError('User full name is required.');
      return;
    }

    try {
      setSavingUser(true);
      const res = await api.put(`/admin/users/${editingUser.id}`, {
        name: editingUser.name.trim(),
        bio: editingUser.bio.trim(),
        role: editingUser.role
      });

      setGlobalSuccess(res.data.message || 'User updated successfully.');
      handleCloseEditUser();
      fetchData();
    } catch (err) {
      console.error('Failed to update user:', err);
      const msg = err?.response?.data?.message || 'Failed to update user.';
      setEditUserError(msg);
      setGlobalError(msg);
    } finally {
      setSavingUser(false);
    }
  };

  const handleOpenDeleteUser = (user) => {
    setUserToDelete(user);
    setDeleteUserOpen(true);
  };

  const handleCloseDeleteUser = () => {
    setDeleteUserOpen(false);
    setUserToDelete(null);
  };

  const handleConfirmDeleteUser = async () => {
    if (!userToDelete) return;
    try {
      setDeletingUser(true);
      const res = await api.delete(`/admin/users/${userToDelete._id || userToDelete.id}`);
      setGlobalSuccess(res.data.message || 'User deleted successfully.');
      handleCloseDeleteUser();
      fetchData();
    } catch (err) {
      console.error('Failed to delete user:', err);
      setGlobalError(err?.response?.data?.message || 'Failed to delete user.');
    } finally {
      setDeletingUser(false);
    }
  };

  // --- COMMUNITY ACTIONS ---
  const handleOpenEditComm = (comm) => {
    setEditingComm({
      id: comm._id || comm.id,
      name: comm.name || '',
      description: comm.description || '',
      isPrivate: Boolean(comm.isPrivate)
    });
    setEditCommError('');
    setEditCommOpen(true);
  };

  const handleCloseEditComm = () => {
    setEditCommOpen(false);
    setEditCommError('');
  };

  const handleSaveComm = async (e) => {
    e.preventDefault();
    setEditCommError('');

    if (!editingComm.name.trim()) {
      setEditCommError('Community name is required.');
      return;
    }

    try {
      setSavingComm(true);
      const res = await api.put(`/admin/communities/${editingComm.id}`, {
        name: editingComm.name.trim(),
        description: editingComm.description.trim(),
        isPrivate: editingComm.isPrivate
      });

      setGlobalSuccess(res.data.message || 'Community updated successfully.');
      handleCloseEditComm();
      fetchData();
    } catch (err) {
      console.error('Failed to update community:', err);
      const msg = err?.response?.data?.message || 'Failed to update community.';
      setEditCommError(msg);
      setGlobalError(msg);
    } finally {
      setSavingComm(false);
    }
  };

  const handleOpenDeleteComm = (comm) => {
    setCommToDelete(comm);
    setDeleteCommOpen(true);
  };

  const handleCloseDeleteComm = () => {
    setDeleteCommOpen(false);
    setCommToDelete(null);
  };

  const handleConfirmDeleteComm = async () => {
    if (!commToDelete) return;
    try {
      setDeletingComm(true);
      const res = await api.delete(`/admin/communities/${commToDelete._id || commToDelete.id}`);
      setGlobalSuccess(res.data.message || 'Community deleted successfully.');
      handleCloseDeleteComm();
      fetchData();
    } catch (err) {
      console.error('Failed to delete community:', err);
      const msg = err?.response?.data?.message || 'Failed to delete community.';
      setGlobalError(msg);
      handleCloseDeleteComm();
    } finally {
      setDeletingComm(false);
    }
  };

  // Filtered lists
  const filteredUsers = users.filter((u) => {
    const q = searchUser.toLowerCase().trim();
    if (!q) return true;
    return (
      u.name?.toLowerCase().includes(q) ||
      u.email?.toLowerCase().includes(q) ||
      u.role?.toLowerCase().includes(q)
    );
  });

  const filteredCommunities = communities.filter((c) => {
    const q = searchCommunity.toLowerCase().trim();
    if (!q) return true;
    return (
      c.name?.toLowerCase().includes(q) ||
      c.description?.toLowerCase().includes(q) ||
      c.creator?.name?.toLowerCase().includes(q)
    );
  });

  const totalAdmins = users.filter((u) => u.role === 'admin').length;
  const totalActiveDiscussions = communities.reduce(
    (acc, c) => acc + (c.activeDiscussionsCount || 0),
    0
  );

  return (
    <Box component="main" sx={{ py: 4 }} aria-label="Administrator Management Dashboard">
      {/* Dashboard Header */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3, flexWrap: 'wrap', gap: 2 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <AdminPanelSettingsIcon color="primary" sx={{ fontSize: 38 }} />
          <Box>
            <Typography variant="h4" component="h1" sx={{ fontWeight: 800 }}>
              Admin Dashboard
            </Typography>
            <Typography variant="body2" color="text.secondary">
              Manage platform users, roles, community configurations, and content.
            </Typography>
          </Box>
        </Box>
        <Button
          variant="outlined"
          color="primary"
          startIcon={<RefreshIcon />}
          onClick={fetchData}
          disabled={loading}
          aria-label="Refresh dashboard data"
        >
          Refresh Data
        </Button>
      </Box>

      {/* Global Alerts */}
      <AlertBanner
        severity="error"
        message={globalError}
        onClose={() => setGlobalError('')}
      />
      <AlertBanner
        severity="success"
        message={globalSuccess}
        onClose={() => setGlobalSuccess('')}
      />

      {/* Stats Cards */}
      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'primary.light', color: 'primary.dark', width: 48, height: 48 }}>
                <PeopleIcon />
              </Avatar>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {users.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Users ({totalAdmins} Admin{totalAdmins !== 1 ? 's' : ''})
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'secondary.light', color: 'secondary.dark', width: 48, height: 48 }}>
                <GroupsIcon />
              </Avatar>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {communities.length}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Total Communities
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'info.light', color: 'info.dark', width: 48, height: 48 }}>
                <ForumIcon />
              </Avatar>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  {totalActiveDiscussions}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  Active Discussions
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} sm={6} md={3}>
          <Card>
            <CardContent sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
              <Avatar sx={{ bgcolor: 'success.light', color: 'success.dark', width: 48, height: 48 }}>
                <AdminPanelSettingsIcon />
              </Avatar>
              <Box>
                <Typography variant="h5" sx={{ fontWeight: 700 }}>
                  Active
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  System Health & Role Security
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      {/* Navigation Tabs */}
      <Paper sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          indicatorColor="primary"
          textColor="primary"
          aria-label="Admin Dashboard Management Tabs"
          sx={{ borderBottom: '1px solid #e2e8f0' }}
        >
          <Tab
            id="admin-tab-users"
            icon={<PeopleIcon />}
            iconPosition="start"
            label={`Manage Users (${users.length})`}
            aria-controls="admin-tabpanel-users"
            sx={{ fontWeight: 600, minHeight: 56 }}
          />
          <Tab
            id="admin-tab-communities"
            icon={<GroupsIcon />}
            iconPosition="start"
            label={`Manage Communities (${communities.length})`}
            aria-controls="admin-tabpanel-communities"
            sx={{ fontWeight: 600, minHeight: 56 }}
          />
        </Tabs>
      </Paper>

      {/* Loading Indicator */}
      {loading ? (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 6 }}>
          <CircularProgress size={48} />
        </Box>
      ) : (
        <>
          {/* TAB 0: MANAGE USERS */}
          {activeTab === 0 && (
            <Box id="admin-tabpanel-users" role="tabpanel" aria-labelledby="admin-tab-users">
              {/* Search Bar */}
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  id="admin-search-users"
                  label="Search Users"
                  placeholder="Search users by name, email, or role..."
                  value={searchUser}
                  onChange={(e) => setSearchUser(e.target.value)}
                  size="small"
                  sx={{ width: { xs: '100%', sm: 360 } }}
                  inputProps={{
                    'aria-label': 'Search users by name, email, or role'
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    )
                  }}
                />
                <Typography variant="body2" color="text.secondary">
                  Showing {filteredUsers.length} of {users.length} users
                </Typography>
              </Box>

              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table aria-label="Users management table">
                  <TableHead sx={{ bgcolor: 'background.default' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>User</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Email Address</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Role</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Joined Date</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredUsers.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={5} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                          No users found matching your search.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredUsers.map((u) => (
                        <TableRow key={u._id} hover>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                              <Avatar
                                src={u.profilePictureUrl}
                                alt={`${u.name}'s profile avatar`}
                                sx={{ width: 36, height: 36 }}
                              />
                              <Box>
                                <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                  {u.name}
                                </Typography>
                                {u.bio && (
                                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                    {u.bio}
                                  </Typography>
                                )}
                              </Box>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                              <Typography variant="body2">{u.email}</Typography>
                              <Tooltip title="Email is locked & immutable">
                                <LockIcon sx={{ fontSize: 14, color: 'text.secondary' }} />
                              </Tooltip>
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={u.role?.toUpperCase() || 'USER'}
                              size="small"
                              color={u.role === 'admin' ? 'secondary' : 'default'}
                              variant={u.role === 'admin' ? 'filled' : 'outlined'}
                              sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                              <Tooltip title={`Edit ${u.name}`}>
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleOpenEditUser(u)}
                                  aria-label={`Edit user ${u.name}`}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title={`Delete ${u.name}`}>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleOpenDeleteUser(u)}
                                  aria-label={`Delete user ${u.name}`}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}

          {/* TAB 1: MANAGE COMMUNITIES */}
          {activeTab === 1 && (
            <Box id="admin-tabpanel-communities" role="tabpanel" aria-labelledby="admin-tab-communities">
              {/* Search Bar */}
              <Box sx={{ mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 2, flexWrap: 'wrap' }}>
                <TextField
                  id="admin-search-communities"
                  label="Search Communities"
                  placeholder="Search communities by name or description..."
                  value={searchCommunity}
                  onChange={(e) => setSearchCommunity(e.target.value)}
                  size="small"
                  sx={{ width: { xs: '100%', sm: 360 } }}
                  inputProps={{
                    'aria-label': 'Search communities by name or description'
                  }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <SearchIcon color="action" />
                      </InputAdornment>
                    )
                  }}
                />
                <Typography variant="body2" color="text.secondary">
                  Showing {filteredCommunities.length} of {communities.length} communities
                </Typography>
              </Box>

              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table aria-label="Communities management table">
                  <TableHead sx={{ bgcolor: 'background.default' }}>
                    <TableRow>
                      <TableCell sx={{ fontWeight: 700 }}>Community Name</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Privacy</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Creator</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Members</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Active Discussions</TableCell>
                      <TableCell sx={{ fontWeight: 700 }}>Created Date</TableCell>
                      <TableCell align="right" sx={{ fontWeight: 700 }}>Actions</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {filteredCommunities.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} align="center" sx={{ py: 4, color: 'text.secondary' }}>
                          No communities found matching your search.
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredCommunities.map((c) => (
                        <TableRow key={c._id} hover>
                          <TableCell>
                            <Box>
                              <Typography variant="body2" sx={{ fontWeight: 600 }}>
                                {c.name}
                              </Typography>
                              {c.description && (
                                <Typography variant="caption" color="text.secondary" sx={{ display: 'block', maxWidth: 260, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                  {c.description}
                                </Typography>
                              )}
                            </Box>
                          </TableCell>
                          <TableCell>
                            <Chip
                              icon={c.isPrivate ? <LockIcon sx={{ fontSize: '0.85rem !important' }} /> : <PublicIcon sx={{ fontSize: '0.85rem !important' }} />}
                              label={c.isPrivate ? 'Private' : 'Public'}
                              size="small"
                              color={c.isPrivate ? 'warning' : 'success'}
                              variant="outlined"
                              sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {c.creator?.name || 'Unknown'}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2">
                              {c.members?.length || 0}
                            </Typography>
                          </TableCell>
                          <TableCell>
                            <Chip
                              label={`${c.activeDiscussionsCount || 0} active`}
                              size="small"
                              color={c.activeDiscussionsCount > 0 ? 'error' : 'default'}
                              variant={c.activeDiscussionsCount > 0 ? 'filled' : 'outlined'}
                              sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                            />
                          </TableCell>
                          <TableCell>
                            <Typography variant="body2" color="text.secondary">
                              {c.createdAt ? new Date(c.createdAt).toLocaleDateString() : 'N/A'}
                            </Typography>
                          </TableCell>
                          <TableCell align="right">
                            <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 1 }}>
                              <Tooltip title={`Edit ${c.name}`}>
                                <IconButton
                                  size="small"
                                  color="primary"
                                  onClick={() => handleOpenEditComm(c)}
                                  aria-label={`Edit community ${c.name}`}
                                >
                                  <EditIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                              <Tooltip title={`Delete ${c.name}`}>
                                <IconButton
                                  size="small"
                                  color="error"
                                  onClick={() => handleOpenDeleteComm(c)}
                                  aria-label={`Delete community ${c.name}`}
                                >
                                  <DeleteIcon fontSize="small" />
                                </IconButton>
                              </Tooltip>
                            </Box>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </>
      )}

      {/* --- EDIT USER MODAL --- */}
      <Dialog
        open={editUserOpen}
        onClose={handleCloseEditUser}
        maxWidth="sm"
        fullWidth
        aria-labelledby="edit-user-dialog-title"
      >
        <DialogTitle id="edit-user-dialog-title" sx={{ fontWeight: 700 }}>
          Edit User Profile & Role
        </DialogTitle>
        <Box component="form" onSubmit={handleSaveUser} noValidate>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            {editUserError && (
              <Alert severity="error" role="alert" onClose={() => setEditUserError('')}>
                {editUserError}
              </Alert>
            )}

            {/* Email Field - STRICTLY DISABLED & LOCKED */}
            <TextField
              id="admin-edit-user-email"
              label="Email Address (Locked)"
              type="email"
              fullWidth
              disabled
              value={editingUser.email}
              InputProps={{
                readOnly: true,
                endAdornment: (
                  <InputAdornment position="end">
                    <LockIcon color="action" />
                  </InputAdornment>
                )
              }}
              helperText="Admins are not permitted to edit a user's email address."
              aria-label="User email address (locked/disabled)"
            />

            {/* Full Name */}
            <TextField
              id="admin-edit-user-name"
              label="Full Name"
              required
              fullWidth
              value={editingUser.name}
              onChange={(e) => setEditingUser({ ...editingUser, name: e.target.value })}
              aria-label="User full name"
            />

            {/* Bio */}
            <TextField
              id="admin-edit-user-bio"
              label="Bio"
              multiline
              rows={3}
              fullWidth
              value={editingUser.bio}
              onChange={(e) => setEditingUser({ ...editingUser, bio: e.target.value })}
              helperText={`${editingUser.bio.length}/500 characters`}
              inputProps={{ maxLength: 500 }}
              aria-label="User bio"
            />

            {/* Role Select */}
            <FormControl fullWidth size="small">
              <InputLabel id="admin-edit-user-role-label">System Role</InputLabel>
              <Select
                labelId="admin-edit-user-role-label"
                id="admin-edit-user-role"
                value={editingUser.role}
                label="System Role"
                onChange={(e) => setEditingUser({ ...editingUser, role: e.target.value })}
              >
                <MenuItem value="user">User (Standard Member)</MenuItem>
                <MenuItem value="admin">Admin (Full Administrative Privileges)</MenuItem>
              </Select>
            </FormControl>
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={handleCloseEditUser} color="inherit" disabled={savingUser}>
              Cancel
            </Button>
            <Button
              id="admin-save-user-btn"
              type="submit"
              variant="contained"
              color="primary"
              disabled={savingUser}
            >
              {savingUser ? <CircularProgress size={22} color="inherit" /> : 'Save Changes'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* --- DELETE USER CONFIRMATION MODAL --- */}
      <Dialog
        open={deleteUserOpen}
        onClose={handleCloseDeleteUser}
        maxWidth="xs"
        fullWidth
        aria-labelledby="delete-user-dialog-title"
      >
        <DialogTitle id="delete-user-dialog-title" sx={{ fontWeight: 700 }}>
          Delete User Account
        </DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to permanently delete <strong>{userToDelete?.name}</strong> ({userToDelete?.email})?
            This will revoke their access, delete their account, and remove them from all community memberships.
          </DialogContentText>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseDeleteUser} color="inherit" disabled={deletingUser}>
            Cancel
          </Button>
          <Button
            id="admin-confirm-delete-user-btn"
            variant="contained"
            color="error"
            onClick={handleConfirmDeleteUser}
            disabled={deletingUser}
          >
            {deletingUser ? <CircularProgress size={22} color="inherit" /> : 'Delete User'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* --- EDIT COMMUNITY MODAL --- */}
      <Dialog
        open={editCommOpen}
        onClose={handleCloseEditComm}
        maxWidth="sm"
        fullWidth
        aria-labelledby="edit-comm-dialog-title"
      >
        <DialogTitle id="edit-comm-dialog-title" sx={{ fontWeight: 700 }}>
          Edit Community Details
        </DialogTitle>
        <Box component="form" onSubmit={handleSaveComm} noValidate>
          <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2.5, pt: 1 }}>
            {editCommError && (
              <Alert severity="error" role="alert" onClose={() => setEditCommError('')}>
                {editCommError}
              </Alert>
            )}

            <TextField
              id="admin-edit-comm-name"
              label="Community Name"
              required
              fullWidth
              value={editingComm.name}
              onChange={(e) => setEditingComm({ ...editingComm, name: e.target.value })}
              inputProps={{ minLength: 2, maxLength: 80 }}
              helperText="Between 2 and 80 characters"
              aria-label="Community name"
            />

            <TextField
              id="admin-edit-comm-desc"
              label="Description"
              multiline
              rows={3}
              fullWidth
              value={editingComm.description}
              onChange={(e) => setEditingComm({ ...editingComm, description: e.target.value })}
              inputProps={{ maxLength: 1000 }}
              helperText={`${editingComm.description.length}/1000 characters`}
              aria-label="Community description"
            />

            <FormControlLabel
              control={
                <Switch
                  id="admin-edit-comm-privacy"
                  checked={editingComm.isPrivate}
                  onChange={(e) => setEditingComm({ ...editingComm, isPrivate: e.target.checked })}
                  color="primary"
                  inputProps={{ 'aria-label': 'Toggle community privacy' }}
                />
              }
              label={editingComm.isPrivate ? 'Private Community (Invite-only)' : 'Public Community (Anyone can join)'}
            />
          </DialogContent>

          <DialogActions sx={{ px: 3, pb: 3 }}>
            <Button onClick={handleCloseEditComm} color="inherit" disabled={savingComm}>
              Cancel
            </Button>
            <Button
              id="admin-save-comm-btn"
              type="submit"
              variant="contained"
              color="primary"
              disabled={savingComm}
            >
              {savingComm ? <CircularProgress size={22} color="inherit" /> : 'Save Community'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* --- DELETE COMMUNITY CONFIRMATION MODAL --- */}
      <Dialog
        open={deleteCommOpen}
        onClose={handleCloseDeleteComm}
        maxWidth="sm"
        fullWidth
        aria-labelledby="delete-comm-dialog-title"
      >
        <DialogTitle id="delete-comm-dialog-title" sx={{ fontWeight: 700 }}>
          Delete Community
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 2 }}>
            Are you sure you want to permanently delete community <strong>{commToDelete?.name}</strong>?
          </DialogContentText>

          {commToDelete?.activeDiscussionsCount > 0 && (
            <Alert
              severity="warning"
              icon={<WarningAmberIcon />}
              sx={{ mb: 2, fontWeight: 500 }}
              role="alert"
            >
              This community currently has <strong>{commToDelete.activeDiscussionsCount} active discussion(s)</strong>.
              Communities with active discussions cannot be deleted.
            </Alert>
          )}

          <Typography variant="caption" color="text.secondary">
            Note: Deleting a community removes all associated resources and discussions.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button onClick={handleCloseDeleteComm} color="inherit" disabled={deletingComm}>
            Cancel
          </Button>
          <Button
            id="admin-confirm-delete-comm-btn"
            variant="contained"
            color="error"
            onClick={handleConfirmDeleteComm}
            disabled={deletingComm}
          >
            {deletingComm ? <CircularProgress size={22} color="inherit" /> : 'Delete Community'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
