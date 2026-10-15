import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import LockOutlinedIcon from '@mui/icons-material/LockOutlined';
import Avatar from '@mui/material/Avatar';
import AlertBanner from '../components/AlertBanner';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  // Redirect destination after login
  const from = location.state?.from?.pathname || '/profile';

  const validate = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      await login(email.trim(), password);
      // Immediately redirect to /profile
      navigate(from, { replace: true });
    } catch (err) {
      const message =
        err.response?.data?.message ||
        'Unable to log in at this moment. Please check your network and try again.';
      setServerError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      component="section"
      aria-labelledby="login-heading"
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        py: { xs: 4, md: 8 }
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 460,
          p: { xs: 2, sm: 3 },
          boxShadow: '0 4px 16px rgba(0, 0, 0, 0.08)'
        }}
      >
        <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Avatar
            sx={{
              m: 1,
              bgcolor: 'primary.main',
              width: 48,
              height: 48
            }}
            aria-hidden="true"
          >
            <LockOutlinedIcon />
          </Avatar>

          <Typography id="login-heading" component="h1" variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            Sign in to Discussify
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Welcome back! Please enter your details below.
          </Typography>

          <Box sx={{ width: '100%' }}>
            <AlertBanner
              severity="error"
              message={serverError}
              onClose={() => setServerError('')}
            />
          </Box>

          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2.5 }}
          >
            <TextField
              id="email"
              name="email"
              label="Email Address"
              type="email"
              autoComplete="email"
              autoFocus
              fullWidth
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: '' });
              }}
              error={Boolean(errors.email)}
              helperText={errors.email}
              inputProps={{
                'aria-required': 'true',
                'aria-invalid': Boolean(errors.email)
              }}
            />

            <TextField
              id="password"
              name="password"
              label="Password"
              type="password"
              autoComplete="current-password"
              fullWidth
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors({ ...errors, password: '' });
              }}
              error={Boolean(errors.password)}
              helperText={errors.password}
              inputProps={{
                'aria-required': 'true',
                'aria-invalid': Boolean(errors.password)
              }}
            />

            <Box sx={{ display: 'flex', justifyContent: 'flex-end' }}>
              <Link
                to="/forgot-password"
                style={{
                  fontSize: '0.875rem',
                  color: '#1e40af',
                  textDecoration: 'none',
                  fontWeight: 600
                }}
              >
                Forgot password?
              </Link>
            </Box>

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              disabled={isSubmitting}
              aria-label="Sign in to your account"
              sx={{ py: 1.25, mt: 1 }}
            >
              {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Sign In'}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Don't have an account?{' '}
                <Link
                  to="/register"
                  style={{
                    color: '#1e40af',
                    fontWeight: 600,
                    textDecoration: 'none'
                  }}
                >
                  Create an account
                </Link>
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
