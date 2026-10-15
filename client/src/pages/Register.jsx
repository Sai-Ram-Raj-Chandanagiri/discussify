import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import PersonAddOutlinedIcon from '@mui/icons-material/PersonAddOutlined';
import Avatar from '@mui/material/Avatar';
import AlertBanner from '../components/AlertBanner';
import { useAuth } from '../context/AuthContext';

export default function Register() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [serverSuccess, setServerSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { register } = useAuth();
  const navigate = useNavigate();

  const validate = () => {
    const newErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!name.trim()) {
      newErrors.name = 'Full name is required.';
    }

    if (!email.trim()) {
      newErrors.email = 'Email address is required.';
    } else if (!emailRegex.test(email.trim())) {
      newErrors.email = 'Please enter a valid email address.';
    }

    if (!password) {
      newErrors.password = 'Password is required.';
    } else if (password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long.';
    } else if (!/[A-Za-z]/.test(password) || !/\d/.test(password)) {
      newErrors.password = 'Password must contain both letters and numbers.';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password.';
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setServerSuccess('');

    if (!validate()) {
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await register(name.trim(), email.trim(), password);
      setServerSuccess(
        response.message ||
          'Account created successfully! A confirmation email has been sent.'
      );
      // Wait briefly so user sees the accessible confirmation message, then redirect to profile
      setTimeout(() => {
        navigate('/profile', { replace: true });
      }, 1200);
    } catch (err) {
      const message =
        err.response?.data?.message ||
        'Unable to complete registration. Please check your network and try again.';
      setServerError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      component="section"
      aria-labelledby="register-heading"
      sx={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        py: { xs: 4, md: 6 }
      }}
    >
      <Card
        sx={{
          width: '100%',
          maxWidth: 480,
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
            <PersonAddOutlinedIcon />
          </Avatar>

          <Typography id="register-heading" component="h1" variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            Create Discussify Account
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Join our community to connect, discuss, and learn together.
          </Typography>

          <Box sx={{ width: '100%' }}>
            <AlertBanner
              severity="error"
              message={serverError}
              onClose={() => setServerError('')}
            />
            <AlertBanner
              severity="success"
              message={serverSuccess}
              onClose={() => setServerSuccess('')}
            />
          </Box>

          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2 }}
          >
            <TextField
              id="name"
              name="name"
              label="Full Name"
              autoComplete="name"
              autoFocus
              fullWidth
              required
              value={name}
              onChange={(e) => {
                setName(e.target.value);
                if (errors.name) setErrors({ ...errors, name: '' });
              }}
              error={Boolean(errors.name)}
              helperText={errors.name}
              FormHelperTextProps={{
                role: errors.name ? 'alert' : undefined
              }}
              inputProps={{
                'aria-required': 'true',
                'aria-invalid': Boolean(errors.name)
              }}
            />

            <TextField
              id="email"
              name="email"
              label="Email Address"
              type="email"
              autoComplete="email"
              fullWidth
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (errors.email) setErrors({ ...errors, email: '' });
              }}
              error={Boolean(errors.email)}
              helperText={errors.email || 'Email address cannot be changed after registration.'}
              FormHelperTextProps={{
                role: errors.email ? 'alert' : undefined
              }}
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
              autoComplete="new-password"
              fullWidth
              required
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                if (errors.password) setErrors({ ...errors, password: '' });
              }}
              error={Boolean(errors.password)}
              helperText={errors.password || 'Must be at least 8 characters with letters & numbers.'}
              FormHelperTextProps={{
                role: errors.password ? 'alert' : undefined
              }}
              inputProps={{
                'aria-required': 'true',
                'aria-invalid': Boolean(errors.password)
              }}
            />

            <TextField
              id="confirmPassword"
              name="confirmPassword"
              label="Confirm Password"
              type="password"
              autoComplete="new-password"
              fullWidth
              required
              value={confirmPassword}
              onChange={(e) => {
                setConfirmPassword(e.target.value);
                if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: '' });
              }}
              error={Boolean(errors.confirmPassword)}
              helperText={errors.confirmPassword}
              FormHelperTextProps={{
                role: errors.confirmPassword ? 'alert' : undefined
              }}
              inputProps={{
                'aria-required': 'true',
                'aria-invalid': Boolean(errors.confirmPassword)
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              disabled={isSubmitting}
              aria-label="Create your new account"
              sx={{ py: 1.25, mt: 1 }}
            >
              {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Register Account'}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Typography variant="body2" color="text.secondary">
                Already have an account?{' '}
                <Link
                  to="/login"
                  style={{
                    color: '#1e40af',
                    fontWeight: 600,
                    textDecoration: 'none'
                  }}
                >
                  Sign in here
                </Link>
              </Typography>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
