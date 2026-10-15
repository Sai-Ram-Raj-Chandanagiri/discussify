import React from 'react';
import { Routes, Route, Link, Navigate } from 'react-router-dom';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import Button from '@mui/material/Button';
import Grid from '@mui/material/Grid';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import PeopleIcon from '@mui/icons-material/People';
import ForumIcon from '@mui/icons-material/Forum';
import ShareIcon from '@mui/icons-material/Share';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import Profile from './pages/Profile';
import PrivateRoute from './components/PrivateRoute';
import { AuthProvider, useAuth } from './context/AuthContext';

function PublicOnlyRoute({ children }) {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <Navigate to="/profile" replace />;
  }
  return children;
}

function Home() {
  const { isAuthenticated } = useAuth();

  return (
    <Box sx={{ py: { xs: 4, md: 8 } }}>
      {/* Hero Section */}
      <Box sx={{ textAlign: 'center', mb: 8 }}>
        <Typography
          variant="h1"
          component="h1"
          gutterBottom
          sx={{
            fontSize: { xs: '2.25rem', sm: '3rem', md: '3.75rem' },
            fontWeight: 800,
            letterSpacing: '-1px',
            color: 'text.primary'
          }}
        >
          Connect, Discuss, and Share Knowledge
        </Typography>
        <Typography
          variant="h6"
          component="p"
          color="text.secondary"
          sx={{
            maxWidth: 750,
            mx: 'auto',
            mb: 4,
            fontWeight: 400,
            fontSize: { xs: '1rem', md: '1.25rem' }
          }}
        >
          Discussify is a modern social platform designed to connect people with shared passions.
          Create communities, spark insightful debates, and discover valuable resources.
        </Typography>
        <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
          {isAuthenticated ? (
            <Button
              component={Link}
              to="/profile"
              variant="contained"
              color="primary"
              size="large"
              sx={{ px: 4, py: 1.5, fontSize: '1rem' }}
            >
              Go to Your Profile
            </Button>
          ) : (
            <>
              <Button
                component={Link}
                to="/register"
                variant="contained"
                color="primary"
                size="large"
                sx={{ px: 4, py: 1.5, fontSize: '1rem' }}
                aria-label="Get started by registering an account"
              >
                Get Started Free
              </Button>
              <Button
                component={Link}
                to="/login"
                variant="outlined"
                color="primary"
                size="large"
                sx={{ px: 4, py: 1.5, fontSize: '1rem' }}
                aria-label="Sign in to your account"
              >
                Sign In
              </Button>
            </>
          )}
        </Box>
      </Box>

      {/* Feature Pillars */}
      <Grid container spacing={4}>
        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', p: 2 }}>
            <CardContent>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  bgcolor: '#dbeafe',
                  color: '#1e40af',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2
                }}
              >
                <PeopleIcon />
              </Box>
              <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 700 }}>
                Vibrant Communities
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Create public or private communities around your specific topics of interest. Invite
                friends and peers to build collaborative hubs.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', p: 2 }}>
            <CardContent>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  bgcolor: '#ccfbf1',
                  color: '#0f766e',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2
                }}
              >
                <ForumIcon />
              </Box>
              <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 700 }}>
                Interactive Discussions
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Participate in structured forum debates, ask questions, share answers, and get
                notified when peers engage with your posts.
              </Typography>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card sx={{ height: '100%', p: 2 }}>
            <CardContent>
              <Box
                sx={{
                  width: 48,
                  height: 48,
                  borderRadius: 2,
                  bgcolor: '#fef3c7',
                  color: '#b45309',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  mb: 2
                }}
              >
                <ShareIcon />
              </Box>
              <Typography variant="h5" component="h2" gutterBottom sx={{ fontWeight: 700 }}>
                Knowledge Sharing
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Upload and share informative articles, tutorials, video links, and reference documents
                directly with community members.
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Box>
  );
}

function AppContent() {
  return (
    <div className="app-container">
      {/* Skip to Content for WCAG AA compliance */}
      <a href="#main-content" className="sr-only">
        Skip to main content
      </a>

      <Navbar />

      <main id="main-content" className="app-main" role="main">
        <Container maxWidth="lg">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route
              path="/login"
              element={
                <PublicOnlyRoute>
                  <Login />
                </PublicOnlyRoute>
              }
            />
            <Route
              path="/register"
              element={
                <PublicOnlyRoute>
                  <Register />
                </PublicOnlyRoute>
              }
            />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />
            <Route
              path="/profile"
              element={
                <PrivateRoute>
                  <Profile />
                </PrivateRoute>
              }
            />
            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </Container>
      </main>

      <footer className="app-footer" role="contentinfo">
        <Typography variant="body2" color="text.secondary">
          &copy; {new Date().getFullYear()} Discussify. All rights reserved. Built with MERN Stack & Material UI.
        </Typography>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
