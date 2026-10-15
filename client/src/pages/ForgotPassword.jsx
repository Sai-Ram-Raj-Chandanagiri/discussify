import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import LockResetIcon from '@mui/icons-material/LockReset';
import Avatar from '@mui/material/Avatar';
import AlertBanner from '../components/AlertBanner';
import api from '../services/api';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [serverError, setServerError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [devResetToken, setDevResetToken] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setServerError('');
    setSuccessMessage('');
    setDevResetToken('');

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!email.trim()) {
      setError('Email address is required.');
      return;
    }
    if (!emailRegex.test(email.trim())) {
      setError('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.post('/auth/forgot-password', { email: email.trim() });
      setSuccessMessage(
        res.data.message ||
          'If an account exists with this email address, password reset instructions have been sent.'
      );
      if (res.data.resetToken) {
        setDevResetToken(res.data.resetToken);
      }
    } catch (err) {
      setServerError(
        err.response?.data?.message ||
          'Failed to submit password reset request. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      component="section"
      aria-labelledby="forgot-heading"
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
            <LockResetIcon />
          </Avatar>

          <Typography id="forgot-heading" component="h1" variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            Reset Your Password
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3, textAlign: 'center' }}>
            Enter your registered email address and we will send you password reset instructions.
          </Typography>

          <Box sx={{ width: '100%' }}>
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
          </Box>

          {devResetToken && (
            <Box
              sx={{
                width: '100%',
                p: 2,
                mb: 2,
                bgcolor: '#eff6ff',
                border: '1px solid #bfdbfe',
                borderRadius: 2
              }}
            >
              <Typography variant="body2" sx={{ fontWeight: 600, color: '#1e40af', mb: 1 }}>
                Development Reset Link:
              </Typography>
              <Link
                to={`/reset-password?token=${devResetToken}`}
                style={{
                  color: '#2563eb',
                  wordBreak: 'break-all',
                  fontWeight: 500,
                  fontSize: '0.875rem'
                }}
              >
                Click here to reset password directly
              </Link>
            </Box>
          )}

          <Box
            component="form"
            onSubmit={handleSubmit}
            noValidate
            sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2.5 }}
          >
            <TextField
              id="reset-email"
              name="email"
              label="Registered Email Address"
              type="email"
              autoComplete="email"
              autoFocus
              fullWidth
              required
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                if (error) setError('');
              }}
              error={Boolean(error)}
              helperText={error}
              inputProps={{
                'aria-required': 'true',
                'aria-invalid': Boolean(error)
              }}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              size="large"
              disabled={isSubmitting}
              aria-label="Send password reset link"
              sx={{ py: 1.25 }}
            >
              {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Send Reset Link'}
            </Button>

            <Box sx={{ textAlign: 'center', mt: 1 }}>
              <Link
                to="/login"
                style={{
                  color: '#1e40af',
                  fontWeight: 600,
                  textDecoration: 'none',
                  fontSize: '0.875rem'
                }}
              >
                &larr; Back to Sign In
              </Link>
            </Box>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}
