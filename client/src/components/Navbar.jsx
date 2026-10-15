import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import Avatar from '@mui/material/Avatar';
import ForumIcon from '@mui/icons-material/Forum';
import PersonIcon from '@mui/icons-material/Person';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
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

            {/* Navigation Links */}
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
