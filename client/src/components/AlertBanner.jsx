import React from 'react';
import Alert from '@mui/material/Alert';
import Box from '@mui/material/Box';

export default function AlertBanner({ severity = 'error', message, onClose }) {
  if (!message) return null;

  return (
    <Box sx={{ mb: 3 }}>
      <Alert
        severity={severity}
        role="alert"
        aria-live="assertive"
        onClose={onClose}
        sx={{
          borderRadius: 2,
          fontWeight: 500,
          '& .MuiAlert-message': { width: '100%' }
        }}
      >
        {message}
      </Alert>
    </Box>
  );
}
