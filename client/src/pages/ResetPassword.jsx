import React, { useState, useEffect } from 'react';
import { useSearchParams, Link, useNavigate } from 'react-router-dom';
import Box from '@mui/material/Box';
import Card from '@mui/material/Card';
import CardContent from '@mui/material/CardContent';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Button from '@mui/material/Button';
import CircularProgress from '@mui/material/CircularProgress';
import VpnKeyOutlinedIcon from '@mui/icons-material/VpnKeyOutlined';
import Avatar from '@mui/material/Avatar';
import AlertBanner from '../components/AlertBanner';
import api from '../services/api';

export default function ResetPassword() {
  const [searchParams] = useSearchParams();
  const tokenFromUrl = searchParams.get('token') || '';

  const [token, setToken] = useState(tokenFromUrl);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState('');
  const [serverSuccess, setServerSuccess] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    if (tokenFromUrl) {
      setToken(tokenFromUrl);
    }
  }, [tokenFromUrl]);

  const validate = () => {
    const newErrors = {};

    if (!token.trim()) {
      newErrors.token = 'Reset token is required.';
    }

    if (!newPassword) {
      newErrors.newPassword = 'New password is required.';
    } else if (newPassword.length < 8) {
      newErrors.newPassword = 'Password must be at least 8 characters long.';
    } else if (!/[A-Za-z]/.test(newPassword) || !/\d/.test(newPassword)) {
      newErrors.newPassword = 'Password must contain both letters and numbers.';
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your new password.';
    } else if (newPassword !== confirmPassword) {
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
      const res = await api.post('/auth/reset-password', {
        token: token.trim(),
        newPassword
      });
      setServerSuccess(
        res.data.message ||
          'Password has been reset successfully. You can now log in.'
      );
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 2000);
    } catch (err) {
      setServerError(
        err.response?.data?.message ||
          'Failed to reset password. The reset token may be invalid or expired.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Box
      component="section"
      aria-labelledby="reset-heading"
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
            <VpnKeyOutlinedIcon />
          </Avatar>

          <Typography id="reset-heading" component="h1" variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
            Set New Password
          </Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Create a new secure password for your Discussify account.
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
            sx={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 2.5 }}
          >
            <TextField
              id="token"
              name="token"
              label="Reset Token"
              fullWidth
              required
              value={token}
              onChange={(e) => {
                setToken(e.target.value);
                if (errors.token) setErrors({ ...errors, token: '' });
              }}
              error={Boolean(errors.token)}
              helperText={errors.token}
              FormHelperTextProps={{
                role: errors.token ? 'alert' : undefined
              }}
              inputProps={{
                'aria-required': 'true',
                'aria-invalid': Boolean(errors.token)
              }}
            />

            <TextField
              id="newPassword"
              name="newPassword"
              label="New Password"
              type="password"
              autoComplete="new-password"
              fullWidth
              required
              value={newPassword}
              onChange={(e) => {
                setNewPassword(e.target.value);
                if (errors.newPassword) setErrors({ ...errors, newPassword: '' });
              }}
              error={Boolean(errors.newPassword)}
              helperText={errors.newPassword || 'Must be at least 8 characters with letters & numbers.'}
              FormHelperTextProps={{
                role: errors.newPassword ? 'alert' : undefined
              }}
              inputProps={{
                'aria-required': 'true',
                'aria-invalid': Boolean(errors.newPassword)
              }}
            />

            <TextField
              id="confirmPassword"
              name="confirmPassword"
              label="Confirm New Password"
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
              aria-label="Confirm new password"
              sx={{ py: 1.25, mt: 1 }}
            >
              {isSubmitting ? <CircularProgress size={24} color="inherit" /> : 'Update Password'}
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
