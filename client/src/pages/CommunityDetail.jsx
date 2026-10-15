import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import CardActions from '@mui/material/CardActions';
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
import Accordion from '@mui/material/Accordion';
import AccordionSummary from '@mui/material/AccordionSummary';
import AccordionDetails from '@mui/material/AccordionDetails';
import Tabs from '@mui/material/Tabs';
import Tab from '@mui/material/Tab';
import RadioGroup from '@mui/material/RadioGroup';
import Radio from '@mui/material/Radio';
import FormControl from '@mui/material/FormControl';
import FormLabel from '@mui/material/FormLabel';
import LockIcon from '@mui/icons-material/Lock';
import PublicIcon from '@mui/icons-material/Public';
import EditIcon from '@mui/icons-material/Edit';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import GroupsIcon from '@mui/icons-material/Groups';
import EmailIcon from '@mui/icons-material/Email';
import StarIcon from '@mui/icons-material/Star';
import ForumIcon from '@mui/icons-material/Forum';
import AddCommentIcon from '@mui/icons-material/AddComment';
import SendIcon from '@mui/icons-material/Send';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import LoginIcon from '@mui/icons-material/Login';
import LogoutIcon from '@mui/icons-material/Logout';
import ShareIcon from '@mui/icons-material/Share';
import ArticleIcon from '@mui/icons-material/Article';
import VideoLibraryIcon from '@mui/icons-material/VideoLibrary';
import AttachFileIcon from '@mui/icons-material/AttachFile';
import OpenInNewIcon from '@mui/icons-material/OpenInNew';
import UploadFileIcon from '@mui/icons-material/UploadFile';
import AlertBanner from '../components/AlertBanner';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';

const MAX_RESOURCE_SIZE = 5 * 1024 * 1024; // 5MB

export default function CommunityDetail() {
  const { id } = useParams();
  const { user, isAuthenticated } = useAuth();
  const resourceFileInputRef = useRef(null);

  const [community, setCommunity] = useState(null);
  const [discussions, setDiscussions] = useState([]);
  const [resources, setResources] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pageError, setPageError] = useState('');
  const [pageSuccess, setPageSuccess] = useState('');

  // Active Tab: 0 = Discussions, 1 = Resources
  const [currentTab, setCurrentTab] = useState(0);

  // Action loading states
  const [isJoining, setIsJoining] = useState(false);
  const [isLeaving, setIsLeaving] = useState(false);

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

  // New Discussion Dialog state
  const [openDiscussion, setOpenDiscussion] = useState(false);
  const [discussionTitle, setDiscussionTitle] = useState('');
  const [discussionContent, setDiscussionContent] = useState('');
  const [discussionErrors, setDiscussionErrors] = useState({});
  const [discussionServerError, setDiscussionServerError] = useState('');
  const [discussionSuccessMessage, setDiscussionSuccessMessage] = useState('');
  const [isCreatingDiscussion, setIsCreatingDiscussion] = useState(false);

  // Discussion reply state
  const [replyInputs, setReplyInputs] = useState({});
  const [replyLoadingId, setReplyLoadingId] = useState(null);

  // Share Resource Dialog state
  const [openShareResource, setOpenShareResource] = useState(false);
  const [resourceTitle, setResourceTitle] = useState('');
  const [resourceType, setResourceType] = useState('article');
  const [resourceShareMode, setResourceShareMode] = useState('url'); // 'url' | 'file'
  const [resourceUrl, setResourceUrl] = useState('');
  const [resourceFile, setResourceFile] = useState(null);
  const [resourceErrors, setResourceErrors] = useState({});
  const [resourceServerError, setResourceServerError] = useState('');
  const [resourceSuccessMessage, setResourceSuccessMessage] = useState('');
  const [isSharingResource, setIsSharingResource] = useState(false);

  const fetchCommunityData = async () => {
    try {
      setLoading(true);
      const [commRes, discRes, resRes] = await Promise.all([
        api.get(`/communities/${id}`),
        api.get(`/communities/${id}/discussions`),
        api.get(`/communities/${id}/resources`)
      ]);
      setCommunity(commRes.data.community);
      setDiscussions(discRes.data.discussions || []);
      setResources(resRes.data.resources || []);
      setPageError('');
    } catch (err) {
      console.error('Fetch community detail error:', err);
      setPageError(
        err.response?.data?.message || 'Failed to load community details. It may not exist.'
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCommunityData();
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

  // Join Community Handler
  const handleJoin = async () => {
    if (!isAuthenticated) return;
    setPageError('');
    setPageSuccess('');
    setIsJoining(true);
    try {
      const res = await api.post(`/communities/${id}/join`);
      setPageSuccess(res.data.message || 'Successfully joined community!');
      setCommunity(res.data.community);
    } catch (err) {
      const message =
        err.response?.data?.message || 'Failed to join community.';
      setPageError(message);
    } finally {
      setIsJoining(false);
    }
  };

  // Leave Community Handler
  const handleLeave = async () => {
    if (!isAuthenticated) return;
    setPageError('');
    setPageSuccess('');
    setIsLeaving(true);
    try {
      const res = await api.post(`/communities/${id}/leave`);
      setPageSuccess(res.data.message || 'Successfully left community.');
      setCommunity(res.data.community);
    } catch (err) {
      const message =
        err.response?.data?.message || 'Failed to leave community.';
      setPageError(message);
    } finally {
      setIsLeaving(false);
    }
  };

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
    if (!isEditing) setOpenEdit(false);
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
      setTimeout(() => setOpenEdit(false), 1000);
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
    if (!isInviting) setOpenInvite(false);
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
      if (res.data.community) setCommunity(res.data.community);
      setTimeout(() => setOpenInvite(false), 1200);
    } catch (err) {
      const message =
        err.response?.data?.message || 'Failed to send invitation.';
      setInviteServerError(message);
    } finally {
      setIsInviting(false);
    }
  };

  // Discussion Handlers
  const handleOpenDiscussion = () => {
    setDiscussionTitle('');
    setDiscussionContent('');
    setDiscussionErrors({});
    setDiscussionServerError('');
    setDiscussionSuccessMessage('');
    setOpenDiscussion(true);
  };

  const handleCloseDiscussion = () => {
    if (!isCreatingDiscussion) setOpenDiscussion(false);
  };

  const handleDiscussionSubmit = async (e) => {
    e.preventDefault();
    setDiscussionServerError('');
    setDiscussionSuccessMessage('');

    const errors = {};
    if (!discussionTitle.trim()) {
      errors.title = 'Discussion title is required.';
    }
    if (!discussionContent.trim()) {
      errors.content = 'Discussion content is required.';
    }
    if (Object.keys(errors).length > 0) {
      setDiscussionErrors(errors);
      return;
    }

    setIsCreatingDiscussion(true);
    try {
      const res = await api.post(`/communities/${id}/discussions`, {
        title: discussionTitle.trim(),
        content: discussionContent.trim()
      });

      setDiscussionSuccessMessage(res.data.message || 'Discussion created successfully!');
      if (res.data.discussion) {
        setDiscussions([res.data.discussion, ...discussions]);
      }
      setTimeout(() => setOpenDiscussion(false), 1000);
    } catch (err) {
      const message =
        err.response?.data?.message || 'Failed to create discussion.';
      setDiscussionServerError(message);
    } finally {
      setIsCreatingDiscussion(false);
    }
  };

  // Reply Handler
  const handleReplySubmit = async (discussionId) => {
    const content = replyInputs[discussionId]?.trim();
    if (!content) return;

    setReplyLoadingId(discussionId);
    setPageError('');
    try {
      const res = await api.post(`/discussions/${discussionId}/replies`, {
        content
      });

      setDiscussions((prev) =>
        prev.map((d) => (d._id === discussionId ? res.data.discussion : d))
      );
      setReplyInputs({ ...replyInputs, [discussionId]: '' });
      setPageSuccess('Reply posted successfully!');
    } catch (err) {
      const message =
        err.response?.data?.message || 'Failed to post reply.';
      setPageError(message);
    } finally {
      setReplyLoadingId(null);
    }
  };

  // Resource Sharing Handlers
  const handleOpenShareResource = () => {
    setResourceTitle('');
    setResourceType('article');
    setResourceShareMode('url');
    setResourceUrl('');
    setResourceFile(null);
    setResourceErrors({});
    setResourceServerError('');
    setResourceSuccessMessage('');
    setOpenShareResource(true);
  };

  const handleCloseShareResource = () => {
    if (!isSharingResource) setOpenShareResource(false);
  };

  const handleResourceFileChange = (e) => {
    setResourceServerError('');
    const file = e.target.files?.[0];
    if (!file) return;

    // Strict Client-Side File Size Validation (5MB limit)
    if (file.size > MAX_RESOURCE_SIZE) {
      setResourceServerError('The resource exceeds the maximum allowed size limit.');
      e.target.value = '';
      setResourceFile(null);
      return;
    }

    setResourceFile(file);
    if (!resourceTitle) {
      setResourceTitle(file.name.replace(/\.[^/.]+$/, ''));
    }
  };

  const handleResourceSubmit = async (e) => {
    e.preventDefault();
    setResourceServerError('');
    setResourceSuccessMessage('');

    const errors = {};
    if (!resourceTitle.trim()) {
      errors.title = 'Resource title is required.';
    }

    if (resourceShareMode === 'url' && !resourceUrl.trim()) {
      errors.url = 'Resource URL is required.';
    }

    if (resourceShareMode === 'file' && !resourceFile) {
      errors.file = 'Please select a file to upload.';
    }

    if (Object.keys(errors).length > 0) {
      setResourceErrors(errors);
      return;
    }

    setIsSharingResource(true);
    try {
      let res;
      if (resourceShareMode === 'file') {
        const formData = new FormData();
        formData.append('title', resourceTitle.trim());
        formData.append('type', resourceType);
        formData.append('file', resourceFile);

        res = await api.post(`/communities/${id}/resources`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        });
      } else {
        res = await api.post(`/communities/${id}/resources`, {
          title: resourceTitle.trim(),
          type: resourceType,
          urlOrFilePath: resourceUrl.trim()
        });
      }

      setResourceSuccessMessage(res.data.message || 'Resource shared successfully!');
      if (res.data.resource) {
        setResources([res.data.resource, ...resources]);
      }
      setTimeout(() => setOpenShareResource(false), 1000);
    } catch (err) {
      const message =
        err.response?.data?.message || 'Failed to share resource.';
      setResourceServerError(message);
    } finally {
      setIsSharingResource(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 12 }}>
        <CircularProgress color="primary" />
      </Box>
    );
  }

  if (!community) {
    return (
      <Box sx={{ py: 6 }}>
        <AlertBanner severity="error" message={pageError || 'Community not found.'} />
        <Button component={Link} to="/communities" startIcon={<ArrowBackIcon />} sx={{ mt: 2 }}>
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
          aria-label="Return to communities directory"
          sx={{ fontWeight: 500 }}
        >
          All Communities
        </Button>
      </Box>

      {/* Global Alerts */}
      <AlertBanner severity="error" message={pageError} onClose={() => setPageError('')} />
      <AlertBanner severity="success" message={pageSuccess} onClose={() => setPageSuccess('')} />

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
                icon={community.isPrivate ? <LockIcon sx={{ fontSize: '0.9rem !important' }} /> : <PublicIcon sx={{ fontSize: '0.9rem !important' }} />}
                label={community.isPrivate ? 'Private Community' : 'Public Community'}
                color={community.isPrivate ? 'secondary' : 'default'}
                variant="outlined"
                sx={{ fontWeight: 600 }}
              />
            </Box>

            {/* Action Buttons: Join, Leave, Edit, Invite */}
            <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap' }}>
              {isCreator ? (
                <>
                  <Chip label="Creator" color="primary" sx={{ height: 36, px: 1, fontWeight: 600 }} />
                  <Button
                    id="edit-community-btn"
                    variant="outlined"
                    color="primary"
                    startIcon={<EditIcon />}
                    onClick={handleOpenEdit}
                    aria-label="Edit community details"
                  >
                    Edit
                  </Button>
                  <Button
                    id="invite-member-btn"
                    variant="contained"
                    color="primary"
                    startIcon={<PersonAddIcon />}
                    onClick={handleOpenInvite}
                    aria-label="Invite a member"
                  >
                    Invite
                  </Button>
                </>
              ) : isMember ? (
                <>
                  <Button
                    id="leave-community-btn"
                    variant="outlined"
                    color="error"
                    startIcon={<LogoutIcon />}
                    onClick={handleLeave}
                    disabled={isLeaving}
                    aria-label="Leave this community"
                  >
                    {isLeaving ? 'Leaving...' : 'Leave Community'}
                  </Button>
                  <Button
                    id="invite-member-btn"
                    variant="contained"
                    color="primary"
                    startIcon={<PersonAddIcon />}
                    onClick={handleOpenInvite}
                    aria-label="Invite a member"
                  >
                    Invite
                  </Button>
                </>
              ) : (
                <Button
                  id="join-community-btn"
                  variant="contained"
                  color="primary"
                  size="large"
                  startIcon={<LoginIcon />}
                  onClick={handleJoin}
                  disabled={isJoining}
                  aria-label="Join this community"
                >
                  {isJoining ? 'Joining...' : 'Join Community'}
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

      {/* Tabs Navigation: Discussions vs Resources */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs
          value={currentTab}
          onChange={(e, val) => setCurrentTab(val)}
          aria-label="Community sections"
          textColor="primary"
          indicatorColor="primary"
        >
          <Tab
            id="tab-discussions"
            icon={<ForumIcon fontSize="small" />}
            iconPosition="start"
            label={`Discussions (${discussions.length})`}
            aria-controls="tabpanel-discussions"
          />
          <Tab
            id="tab-resources"
            icon={<ShareIcon fontSize="small" />}
            iconPosition="start"
            label={`Resources (${resources.length})`}
            aria-controls="tabpanel-resources"
          />
        </Tabs>
      </Box>

      {/* Main Grid: Content Area & Community Sidebar */}
      <Grid container spacing={4}>
        {/* Left Column: Tab Panels */}
        <Grid item xs={12} md={8}>
          {/* TAB 0: DISCUSSIONS */}
          {currentTab === 0 && (
            <Box id="tabpanel-discussions" role="tabpanel" aria-labelledby="tab-discussions">
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>
                  Community Discussions
                </Typography>

                {isMember ? (
                  <Button
                    id="new-discussion-btn"
                    variant="contained"
                    color="primary"
                    startIcon={<AddCommentIcon />}
                    onClick={handleOpenDiscussion}
                    aria-label="Start a new discussion thread"
                  >
                    Start Discussion
                  </Button>
                ) : (
                  <Button
                    id="new-discussion-disabled-btn"
                    variant="contained"
                    disabled
                    startIcon={<LockIcon />}
                    aria-label="Discussions require membership"
                    title="You must be a member of this community to participate in discussions."
                  >
                    Start Discussion
                  </Button>
                )}
              </Box>

              {!isMember && (
                <Box sx={{ mb: 3, p: 2, bgcolor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ color: '#1e40af', fontWeight: 500 }}>
                    You must be a member of this community to participate in discussions.
                    {community.isPrivate
                      ? ' This is a private community. An invitation is required to join.'
                      : ' Click "Join Community" above to start participating!'}
                  </Typography>
                </Box>
              )}

              {discussions.length > 0 ? (
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {discussions.map((disc) => (
                    <Accordion
                      key={disc._id}
                      sx={{
                        borderRadius: '10px !important',
                        boxShadow: '0 1px 3px rgba(0,0,0,0.08)',
                        '&:before': { display: 'none' }
                      }}
                    >
                      <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                        <Box sx={{ width: '100%', pr: 2 }}>
                          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 0.5 }}>
                            <Typography variant="subtitle1" sx={{ fontWeight: 700, color: 'text.primary' }}>
                              {disc.title}
                            </Typography>
                            <Chip
                              label={disc.status === 'closed' ? 'Closed' : 'Active'}
                              size="small"
                              color={disc.status === 'closed' ? 'default' : 'success'}
                              sx={{ height: 20, fontSize: '0.7rem', fontWeight: 600 }}
                            />
                          </Box>
                          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                            <Avatar
                              src={disc.author?.profilePictureUrl}
                              sx={{ width: 20, height: 20, fontSize: '0.7rem' }}
                            >
                              {disc.author?.name?.charAt(0) || 'U'}
                            </Avatar>
                            <Typography variant="caption" color="text.secondary">
                              {disc.author?.name || 'Member'} &bull; {new Date(disc.createdAt).toLocaleDateString()} &bull;{' '}
                              {disc.replies?.length || 0} replies
                            </Typography>
                          </Box>
                        </Box>
                      </AccordionSummary>

                      <AccordionDetails sx={{ pt: 0, pb: 3, px: 3 }}>
                        <Divider sx={{ mb: 2 }} />
                        <Typography variant="body2" sx={{ mb: 3, whiteSpace: 'pre-wrap', color: 'text.primary' }}>
                          {disc.content}
                        </Typography>

                        <Typography variant="subtitle2" sx={{ fontWeight: 700, mb: 1.5 }}>
                          Replies ({disc.replies?.length || 0})
                        </Typography>

                        {disc.replies && disc.replies.length > 0 ? (
                          <List disablePadding sx={{ mb: 3 }}>
                            {disc.replies.map((reply, rIdx) => (
                              <ListItem
                                key={rIdx}
                                sx={{
                                  p: 1.5,
                                  mb: 1,
                                  borderRadius: 2,
                                  bgcolor: 'background.default'
                                }}
                              >
                                <ListItemAvatar>
                                  <Avatar
                                    src={reply.author?.profilePictureUrl}
                                    sx={{ width: 28, height: 28, fontSize: '0.75rem' }}
                                  >
                                    {reply.author?.name?.charAt(0) || 'U'}
                                  </Avatar>
                                </ListItemAvatar>
                                <ListItemText
                                  primary={
                                    <Typography variant="caption" sx={{ fontWeight: 600, color: 'primary.main' }}>
                                      {reply.author?.name || 'Member'} &bull;{' '}
                                      {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </Typography>
                                  }
                                  secondary={
                                    <Typography variant="body2" color="text.primary" sx={{ mt: 0.5 }}>
                                      {reply.content}
                                    </Typography>
                                  }
                                />
                              </ListItem>
                            ))}
                          </List>
                        ) : (
                          <Typography variant="caption" color="text.secondary" display="block" sx={{ mb: 2 }}>
                            No replies yet. Be the first to reply!
                          </Typography>
                        )}

                        {isMember ? (
                          <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-start' }}>
                            <TextField
                              id={`reply-input-${disc._id}`}
                              label="Write a reply"
                              placeholder="Write a reply..."
                              size="small"
                              fullWidth
                              value={replyInputs[disc._id] || ''}
                              onChange={(e) =>
                                setReplyInputs({ ...replyInputs, [disc._id]: e.target.value })
                              }
                              disabled={disc.status === 'closed' || replyLoadingId === disc._id}
                              inputProps={{
                                'aria-label': `Write a reply to discussion: ${disc.title}`
                              }}
                            />
                            <Button
                              variant="contained"
                              color="primary"
                              size="small"
                              endIcon={<SendIcon />}
                              onClick={() => handleReplySubmit(disc._id)}
                              disabled={
                                !replyInputs[disc._id]?.trim() ||
                                disc.status === 'closed' ||
                                replyLoadingId === disc._id
                              }
                            >
                              Reply
                            </Button>
                          </Box>
                        ) : (
                          <Typography variant="caption" color="text.secondary" sx={{ fontStyle: 'italic' }}>
                            You must be a member of this community to participate in discussions.
                          </Typography>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              ) : (
                <Card sx={{ p: 6, textAlign: 'center' }}>
                  <ForumIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1.5 }} />
                  <Typography variant="h6" gutterBottom>
                    No discussions started yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Start the conversation! Post the first question, idea, or debate topic for this community.
                  </Typography>
                  {isMember ? (
                    <Button variant="contained" color="primary" onClick={handleOpenDiscussion}>
                      Start First Discussion
                    </Button>
                  ) : (
                    <Button variant="contained" color="primary" onClick={handleJoin}>
                      Join to Start Discussion
                    </Button>
                  )}
                </Card>
              )}
            </Box>
          )}

          {/* TAB 1: RESOURCES */}
          {currentTab === 1 && (
            <Box id="tabpanel-resources" role="tabpanel" aria-labelledby="tab-resources">
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
                <Typography variant="h5" component="h2" sx={{ fontWeight: 700 }}>
                  Community Resources ({resources.length})
                </Typography>

                {isMember ? (
                  <Button
                    id="share-resource-btn"
                    variant="contained"
                    color="primary"
                    startIcon={<ShareIcon />}
                    onClick={handleOpenShareResource}
                    aria-label="Share a new resource"
                  >
                    Share Resource
                  </Button>
                ) : (
                  <Button
                    id="share-resource-disabled-btn"
                    variant="contained"
                    disabled
                    startIcon={<LockIcon />}
                    aria-label="Sharing resources requires membership"
                    title="You must be a member of this community to share resources."
                  >
                    Share Resource
                  </Button>
                )}
              </Box>

              {!isMember && (
                <Box sx={{ mb: 3, p: 2, bgcolor: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 2 }}>
                  <Typography variant="body2" sx={{ color: '#1e40af', fontWeight: 500 }}>
                    You must be a member of this community to share resources.
                    {community.isPrivate
                      ? ' This is a private community. An invitation is required to join.'
                      : ' Click "Join Community" above to share articles, tutorials, and documents!'}
                  </Typography>
                </Box>
              )}

              {resources.length > 0 ? (
                <Grid container spacing={3}>
                  {resources.map((resItem) => {
                    const isVideo = resItem.type === 'video';
                    const isArticle = resItem.type === 'article';
                    const formattedSize =
                      resItem.fileSize > 0
                        ? `${(resItem.fileSize / (1024 * 1024)).toFixed(2)} MB`
                        : null;

                    return (
                      <Grid item xs={12} sm={6} key={resItem._id}>
                        <Card
                          sx={{
                            height: '100%',
                            display: 'flex',
                            flexDirection: 'column',
                            borderRadius: 2,
                            boxShadow: '0 2px 8px rgba(0,0,0,0.06)'
                          }}
                        >
                          <CardContent sx={{ flex: 1 }}>
                            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1.5 }}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                {isVideo ? (
                                  <VideoLibraryIcon color="secondary" />
                                ) : isArticle ? (
                                  <ArticleIcon color="primary" />
                                ) : (
                                  <AttachFileIcon color="action" />
                                )}
                                <Chip
                                  label={resItem.type.toUpperCase()}
                                  size="small"
                                  color={isVideo ? 'secondary' : isArticle ? 'primary' : 'default'}
                                  variant="outlined"
                                  sx={{ fontWeight: 600, fontSize: '0.7rem' }}
                                />
                              </Box>

                              {formattedSize && (
                                <Chip
                                  label={formattedSize}
                                  size="small"
                                  sx={{ fontSize: '0.7rem' }}
                                />
                              )}
                            </Box>

                            <Typography variant="h6" component="h3" sx={{ fontWeight: 700, mb: 1, lineHeight: 1.3 }}>
                              {resItem.title}
                            </Typography>

                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 2 }}>
                              <Avatar
                                src={resItem.author?.profilePictureUrl}
                                sx={{ width: 24, height: 24, fontSize: '0.75rem' }}
                              >
                                {resItem.author?.name?.charAt(0) || 'U'}
                              </Avatar>
                              <Typography variant="caption" color="text.secondary">
                                Shared by {resItem.author?.name || 'Member'} &bull;{' '}
                                {new Date(resItem.createdAt).toLocaleDateString()}
                              </Typography>
                            </Box>
                          </CardContent>

                          <CardActions sx={{ px: 2, pb: 2, pt: 0 }}>
                            <Button
                              href={resItem.urlOrFilePath}
                              target="_blank"
                              rel="noopener noreferrer"
                              fullWidth
                              variant="outlined"
                              color="primary"
                              size="small"
                              endIcon={<OpenInNewIcon />}
                              aria-label={`Open ${resItem.title}`}
                            >
                              {isVideo ? 'Watch Video' : isArticle ? 'Read Article' : 'Open Resource'}
                            </Button>
                          </CardActions>
                        </Card>
                      </Grid>
                    );
                  })}
                </Grid>
              ) : (
                <Card sx={{ p: 6, textAlign: 'center' }}>
                  <ShareIcon sx={{ fontSize: 48, color: 'text.secondary', mb: 1.5 }} />
                  <Typography variant="h6" gutterBottom>
                    No resources shared yet
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Share informative articles, reference videos, tutorials, or study files with your community!
                  </Typography>
                  {isMember ? (
                    <Button variant="contained" color="primary" onClick={handleOpenShareResource}>
                      Share First Resource
                    </Button>
                  ) : (
                    <Button variant="contained" color="primary" onClick={handleJoin}>
                      Join to Share Resources
                    </Button>
                  )}
                </Card>
              )}
            </Box>
          )}
        </Grid>

        {/* Right Column: Members and Invitations Sidebar */}
        <Grid item xs={12} md={4}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            {/* Members List */}
            <Card sx={{ p: 2 }}>
              <CardContent>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 2 }}>
                  <GroupsIcon color="primary" />
                  <Typography variant="h6" component="h2" sx={{ fontWeight: 700 }}>
                    Members ({community.members?.length || 0})
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
                            sx={{ bgcolor: 'primary.light', width: 32, height: 32, fontSize: '0.8rem' }}
                          >
                            {member.name ? member.name.charAt(0).toUpperCase() : 'U'}
                          </Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
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

            {/* Pending Invitations (if creator) */}
            {isCreator && (
              <Card sx={{ p: 2 }}>
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
                          <ListItemText
                            primary={inv.name || 'Invited User'}
                            secondary={inv.email || 'Invitation sent'}
                          />
                          <Chip label="Invited" size="small" variant="outlined" color="secondary" />
                        </ListItem>
                      ))}
                    </List>
                  ) : (
                    <Typography variant="caption" color="text.secondary">
                      No pending invitations.
                    </Typography>
                  )}
                </CardContent>
              </Card>
            )}
          </Box>
        </Grid>
      </Grid>

      {/* Share Resource Dialog */}
      <Dialog
        open={openShareResource}
        onClose={handleCloseShareResource}
        maxWidth="sm"
        fullWidth
        aria-labelledby="share-resource-dialog-title"
      >
        <DialogTitle id="share-resource-dialog-title" sx={{ fontWeight: 700 }}>
          Share a Resource in {community.name}
        </DialogTitle>
        <Box component="form" onSubmit={handleResourceSubmit} noValidate>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <AlertBanner
              severity="error"
              message={resourceServerError}
              onClose={() => setResourceServerError('')}
            />
            <AlertBanner
              severity="success"
              message={resourceSuccessMessage}
              onClose={() => setResourceSuccessMessage('')}
            />

            <TextField
              id="resource-title"
              name="title"
              label="Resource Title"
              autoFocus
              fullWidth
              required
              value={resourceTitle}
              onChange={(e) => {
                setResourceTitle(e.target.value);
                if (resourceErrors.title) setResourceErrors({ ...resourceErrors, title: '' });
                if (resourceServerError) setResourceServerError('');
              }}
              error={Boolean(resourceErrors.title)}
              helperText={resourceErrors.title || 'Give your resource a descriptive name.'}
              FormHelperTextProps={{
                role: resourceErrors.title ? 'alert' : undefined
              }}
              inputProps={{ 'aria-required': 'true' }}
            />

            <FormControl component="fieldset">
              <FormLabel component="legend" sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
                Resource Type
              </FormLabel>
              <RadioGroup
                row
                value={resourceType}
                onChange={(e) => setResourceType(e.target.value)}
              >
                <FormControlLabel value="article" control={<Radio size="small" />} label="Article" />
                <FormControlLabel value="video" control={<Radio size="small" />} label="Video" />
                <FormControlLabel value="other" control={<Radio size="small" />} label="Document / File" />
              </RadioGroup>
            </FormControl>

            <FormControl component="fieldset">
              <FormLabel component="legend" sx={{ fontSize: '0.875rem', fontWeight: 600 }}>
                Source Option
              </FormLabel>
              <RadioGroup
                row
                value={resourceShareMode}
                onChange={(e) => {
                  setResourceShareMode(e.target.value);
                  setResourceServerError('');
                }}
              >
                <FormControlLabel value="url" control={<Radio size="small" />} label="Web URL / Link" />
                <FormControlLabel value="file" control={<Radio size="small" />} label="Upload File (Max 5MB)" />
              </RadioGroup>
            </FormControl>

            {resourceShareMode === 'url' ? (
              <TextField
                id="resource-url"
                name="url"
                label="Web Link (URL)"
                type="url"
                placeholder="https://example.com/article"
                fullWidth
                required
                value={resourceUrl}
                onChange={(e) => {
                  setResourceUrl(e.target.value);
                  if (resourceErrors.url) setResourceErrors({ ...resourceErrors, url: '' });
                  if (resourceServerError) setResourceServerError('');
                }}
                error={Boolean(resourceErrors.url)}
                helperText={resourceErrors.url || 'Link to an informative article, tutorial, or educational video.'}
                FormHelperTextProps={{
                  role: resourceErrors.url ? 'alert' : undefined
                }}
              />
            ) : (
              <Box>
                <input
                  type="file"
                  id="resource-file-input"
                  ref={resourceFileInputRef}
                  onChange={handleResourceFileChange}
                  style={{ display: 'none' }}
                  aria-label="Select resource file to upload"
                />
                <Button
                  variant="outlined"
                  color="primary"
                  fullWidth
                  startIcon={<UploadFileIcon />}
                  onClick={() => resourceFileInputRef.current?.click()}
                  sx={{ py: 1.5 }}
                >
                  {resourceFile ? resourceFile.name : 'Choose File to Upload (Max 5MB)'}
                </Button>
                {resourceErrors.file && (
                  <Typography variant="caption" color="error" display="block" sx={{ mt: 1 }} role="alert">
                    {resourceErrors.file}
                  </Typography>
                )}
                <Typography variant="caption" color="text.secondary" display="block" sx={{ mt: 1 }}>
                  Supported files: PDF, DOC, images, video, ZIP (up to 5MB). Executable and suspicious files are prohibited.
                </Typography>
              </Box>
            )}
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={handleCloseShareResource} color="inherit" disabled={isSharingResource}>
              Cancel
            </Button>
            <Button
              id="submit-resource-btn"
              type="submit"
              variant="contained"
              color="primary"
              disabled={isSharingResource}
              aria-label="Submit resource to community"
            >
              {isSharingResource ? <CircularProgress size={24} color="inherit" /> : 'Share Resource'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

      {/* New Discussion Dialog */}
      <Dialog
        open={openDiscussion}
        onClose={handleCloseDiscussion}
        maxWidth="md"
        fullWidth
        aria-labelledby="new-discussion-dialog-title"
      >
        <DialogTitle id="new-discussion-dialog-title" sx={{ fontWeight: 700 }}>
          Start a Discussion in {community.name}
        </DialogTitle>
        <Box component="form" onSubmit={handleDiscussionSubmit} noValidate>
          <DialogContent dividers sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            <AlertBanner
              severity="error"
              message={discussionServerError}
              onClose={() => setDiscussionServerError('')}
            />
            <AlertBanner
              severity="success"
              message={discussionSuccessMessage}
              onClose={() => setDiscussionSuccessMessage('')}
            />

            <TextField
              id="discussion-title"
              name="title"
              label="Discussion Title"
              autoFocus
              fullWidth
              required
              value={discussionTitle}
              onChange={(e) => {
                setDiscussionTitle(e.target.value);
                if (discussionErrors.title) setDiscussionErrors({ ...discussionErrors, title: '' });
              }}
              error={Boolean(discussionErrors.title)}
              helperText={discussionErrors.title}
              FormHelperTextProps={{
                role: discussionErrors.title ? 'alert' : undefined
              }}
              inputProps={{ 'aria-required': 'true' }}
            />

            <TextField
              id="discussion-content"
              name="content"
              label="Content / Question"
              multiline
              rows={5}
              fullWidth
              required
              value={discussionContent}
              onChange={(e) => {
                setDiscussionContent(e.target.value);
                if (discussionErrors.content) setDiscussionErrors({ ...discussionErrors, content: '' });
              }}
              error={Boolean(discussionErrors.content)}
              helperText={discussionErrors.content}
              FormHelperTextProps={{
                role: discussionErrors.content ? 'alert' : undefined
              }}
              inputProps={{ 'aria-required': 'true' }}
            />
          </DialogContent>

          <DialogActions sx={{ px: 3, py: 2 }}>
            <Button onClick={handleCloseDiscussion} color="inherit" disabled={isCreatingDiscussion}>
              Cancel
            </Button>
            <Button
              id="submit-discussion-btn"
              type="submit"
              variant="contained"
              color="primary"
              disabled={isCreatingDiscussion}
            >
              {isCreatingDiscussion ? <CircularProgress size={24} color="inherit" /> : 'Publish Discussion'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>

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
              }}
              error={Boolean(editErrors.name)}
              helperText={editErrors.name}
              FormHelperTextProps={{
                role: editErrors.name ? 'alert' : undefined
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
                  inputProps={{ 'aria-label': 'Toggle community privacy' }}
                />
              }
              label={editIsPrivate ? 'Private Community' : 'Public Community'}
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
              }}
              error={Boolean(inviteError)}
              helperText={inviteError}
              FormHelperTextProps={{
                role: inviteError ? 'alert' : undefined
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
            >
              {isInviting ? <CircularProgress size={24} color="inherit" /> : 'Send Invite'}
            </Button>
          </DialogActions>
        </Box>
      </Dialog>
    </Box>
  );
}
