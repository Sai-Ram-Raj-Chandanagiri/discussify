const crypto = require('crypto');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { sendConfirmationEmail, sendPasswordResetEmail } = require('../utils/emailService');

// Helper to generate JWT
const generateToken = (id, role) => {
  return jwt.sign(
    { id, role },
    process.env.JWT_SECRET || 'discussify_jwt_super_secret_key_change_in_production',
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
};

// Validation helpers
const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return typeof email === 'string' && emailRegex.test(email.trim());
};

const isValidPassword = (password) => {
  // At least 8 characters, with at least one letter and at least one number
  return (
    typeof password === 'string' &&
    password.length >= 8 &&
    /[A-Za-z]/.test(password) &&
    /\d/.test(password)
  );
};

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user account
 * @access  Public
 */
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      return res.status(400).json({
        message: 'Name is required.'
      });
    }

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        message: 'Please provide a valid email address.'
      });
    }

    if (!password) {
      return res.status(400).json({
        message: 'Password is required.'
      });
    }

    if (!isValidPassword(password)) {
      return res.status(400).json({
        message: 'Password must be at least 8 characters long and contain both letters and numbers.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();

    // Check if user already exists
    const existingUser = await User.findOne({ email: normalizedEmail });
    if (existingUser) {
      return res.status(409).json({
        message: 'An account with this email address already exists.'
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Create user
    const newUser = new User({
      name: name.trim(),
      email: normalizedEmail,
      passwordHash,
      role: 'user',
      activityLog: [
        {
          action: 'Registered account',
          timestamp: new Date()
        }
      ]
    });

    await newUser.save();

    // Send / log confirmation email
    await sendConfirmationEmail(newUser);

    const token = generateToken(newUser._id, newUser.role);

    return res.status(201).json({
      message: 'Account created successfully. A confirmation email has been sent.',
      token,
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email,
        role: newUser.role,
        bio: newUser.bio,
        profilePictureUrl: newUser.profilePictureUrl,
        notificationSettings: newUser.notificationSettings,
        activityLog: newUser.activityLog
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    // Handle mongoose duplicate key race condition if any
    if (error.code === 11000) {
      return res.status(409).json({
        message: 'An account with this email address already exists.'
      });
    }
    return res.status(500).json({
      message: 'An unexpected error occurred during registration. Please try again.'
    });
  }
};

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate user & get token
 * @access  Public
 */
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(401).json({
        message: 'Invalid email or password.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      return res.status(401).json({
        message: 'Invalid email or password.'
      });
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({
        message: 'Invalid email or password.'
      });
    }

    // Record login in activity log
    user.activityLog.push({
      action: 'Logged in',
      timestamp: new Date()
    });
    await user.save();

    const token = generateToken(user._id, user.role);

    return res.status(200).json({
      message: 'Login successful.',
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
        profilePictureUrl: user.profilePictureUrl,
        notificationSettings: user.notificationSettings,
        activityLog: user.activityLog
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({
      message: 'An unexpected error occurred during login. Please try again.'
    });
  }
};

/**
 * @route   POST /api/auth/forgot-password
 * @desc    Initiate password reset process
 * @access  Public
 */
const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email || !isValidEmail(email)) {
      return res.status(400).json({
        message: 'Please provide a valid email address.'
      });
    }

    const normalizedEmail = email.toLowerCase().trim();
    const user = await User.findOne({ email: normalizedEmail });

    if (!user) {
      // Return clear response without leaking account existence unnecessarily
      return res.status(200).json({
        message: 'If an account exists with this email address, password reset instructions have been sent.'
      });
    }

    // Generate random reset token
    const resetToken = crypto.randomBytes(32).toString('hex');

    // Hash token to store in database
    user.resetPasswordToken = crypto
      .createHash('sha256')
      .update(resetToken)
      .digest('hex');

    // Token expires in 1 hour
    user.resetPasswordExpires = Date.now() + 3600000;

    await user.save();

    const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
    const resetUrl = `${clientUrl}/reset-password?token=${resetToken}`;

    await sendPasswordResetEmail(user, resetToken, resetUrl);

    return res.status(200).json({
      message: 'If an account exists with this email address, password reset instructions have been sent.',
      resetToken // included in response to aid development/testing environments
    });
  } catch (error) {
    console.error('Forgot password error:', error);
    return res.status(500).json({
      message: 'An error occurred while processing your request. Please try again.'
    });
  }
};

/**
 * @route   POST /api/auth/reset-password
 * @desc    Reset user password using token
 * @access  Public
 */
const resetPassword = async (req, res) => {
  try {
    const { token, newPassword } = req.body;

    if (!token) {
      return res.status(400).json({
        message: 'Password reset token is required.'
      });
    }

    if (!newPassword || !isValidPassword(newPassword)) {
      return res.status(400).json({
        message: 'New password must be at least 8 characters long and contain both letters and numbers.'
      });
    }

    // Hash incoming token to match database
    const hashedToken = crypto
      .createHash('sha256')
      .update(token)
      .digest('hex');

    const user = await User.findOne({
      resetPasswordToken: hashedToken,
      resetPasswordExpires: { $gt: Date.now() }
    });

    if (!user) {
      return res.status(400).json({
        message: 'Password reset token is invalid or has expired.'
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    user.passwordHash = await bcrypt.hash(newPassword, salt);
    user.resetPasswordToken = null;
    user.resetPasswordExpires = null;

    user.activityLog.push({
      action: 'Reset password',
      timestamp: new Date()
    });

    await user.save();

    return res.status(200).json({
      message: 'Password has been reset successfully. You can now log in with your new password.'
    });
  } catch (error) {
    console.error('Reset password error:', error);
    return res.status(500).json({
      message: 'An unexpected error occurred while resetting your password. Please try again.'
    });
  }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get currently logged in user profile
 * @access  Private
 */
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-passwordHash');
    if (!user) {
      return res.status(404).json({
        message: 'User profile not found.'
      });
    }

    return res.status(200).json({
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        bio: user.bio,
        profilePictureUrl: user.profilePictureUrl,
        notificationSettings: user.notificationSettings,
        activityLog: user.activityLog
      }
    });
  } catch (error) {
    console.error('Get profile error:', error);
    return res.status(500).json({
      message: 'Failed to retrieve user profile.'
    });
  }
};

module.exports = {
  register,
  login,
  forgotPassword,
  resetPassword,
  getMe
};
