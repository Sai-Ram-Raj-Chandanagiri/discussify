import React from 'react';
import { Routes, Route, Link } from 'react-router-dom';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import Typography from '@mui/material/Typography';
import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Container from '@mui/material/Container';
import ForumIcon from '@mui/icons-material/Forum';
import PeopleIcon from '@mui/icons-material/People';

function Home() {
  return (
    <Box sx={{ py: 6, textAlign: 'center' }}>
      <Typography variant="h1" component="h1" gutterBottom sx={{ fontSize: { xs: '2rem', md: '3rem' } }}>
        Welcome to Discussify
      </Typography>
      <Typography variant="h6" component="p" color="text.secondary" sx={{ maxWidth: 700, mx: 'auto', mb: 4 }}>
        Connect with like-minded individuals, create communities, engage in meaningful discussions, and share knowledge.
      </Typography>
      <Box sx={{ display: 'flex', gap: 2, justifyContent: 'center', flexWrap: 'wrap' }}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          aria-label="Explore communities"
          startIcon={<PeopleIcon />}
        >
          Explore Communities
        </Button>
        <Button
          variant="outlined"
          color="primary"
          size="large"
          aria-label="View recent discussions"
          startIcon={<ForumIcon />}
        >
          View Discussions
        </Button>
      </Box>
    </Box>
  );
}

function App() {
  return (
    <div className="app-container">
      <header className="app-header" role="banner">
        <AppBar position="static" color="inherit" elevation={0} sx={{ borderBottom: '1px solid #e2e8f0' }}>
          <Container maxWidth="lg">
            <Toolbar disableGutters sx={{ justifyContent: 'space-between' }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ForumIcon color="primary" sx={{ fontSize: 32 }} aria-hidden="true" />
                <Typography
                  variant="h6"
                  component={Link}
                  to="/"
                  sx={{
                    fontWeight: 700,
                    color: 'primary.main',
                    textDecoration: 'none',
                    letterSpacing: '-0.5px'
                  }}
                >
                  Discussify
                </Typography>
              </Box>

              <nav aria-label="Main Navigation">
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Button component={Link} to="/" color="inherit" aria-label="Home page">
                    Home
                  </Button>
                  <Button color="primary" variant="contained" aria-label="Sign in">
                    Sign In
                  </Button>
                </Box>
              </nav>
            </Toolbar>
          </Container>
        </AppBar>
      </header>

      <main id="main-content" className="app-main" role="main">
        <Container maxWidth="lg">
          <Routes>
            <Route path="/" element={<Home />} />
          </Routes>
        </Container>
      </main>

      <footer className="app-footer" role="contentinfo">
        <Typography variant="body2" color="text.secondary">
          &copy; {new Date().getFullYear()} Discussify. All rights reserved.
        </Typography>
      </footer>
    </div>
  );
}

export default App;
