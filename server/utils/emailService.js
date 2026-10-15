/**
 * Email service utility for Discussify
 * Sends transactional notifications and confirmation emails.
 */

const sendConfirmationEmail = async (user) => {
  const confirmationMessage = `
======================================================
📧 [DISCUSSIFY EMAIL CONFIRMATION]
To: ${user.email}
Subject: Welcome to Discussify, ${user.name}!

Hi ${user.name},

Thank you for joining Discussify! Your account has been created successfully.
You can now create communities, participate in discussions, and share resources.

Best regards,
The Discussify Team
======================================================
`;
  console.log(confirmationMessage);
  return { success: true, message: 'Confirmation email sent.' };
};

const sendPasswordResetEmail = async (user, resetToken, resetUrl) => {
  const resetMessage = `
======================================================
📧 [DISCUSSIFY PASSWORD RESET REQUEST]
To: ${user.email}
Subject: Discussify Password Reset Request

Hi ${user.name},

You requested a password reset for your Discussify account.
Please use the following reset token or link within 1 hour:

Reset Token: ${resetToken}
Reset URL: ${resetUrl}

If you did not request this, please ignore this email.

Best regards,
The Discussify Team
======================================================
`;
  console.log(resetMessage);
  return { success: true, message: 'Password reset email sent.' };
};

module.exports = {
  sendConfirmationEmail,
  sendPasswordResetEmail
};
