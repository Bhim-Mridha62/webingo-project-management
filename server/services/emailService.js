const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: false,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

exports.sendPasswordResetEmail = async (to, resetToken) => {
  const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;
  
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to,
    subject: 'Password Reset - Webingo Project Management',
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #1a1a2e; padding: 32px; border-radius: 12px;">
        <h2 style="color: #6c63ff; margin-bottom: 16px;">Password Reset Request</h2>
        <p style="color: #e8e8f0;">You requested a password reset. Click the button below to reset your password:</p>
        <a href="${resetUrl}" style="display: inline-block; background: #6c63ff; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0; font-weight: 600;">Reset Password</a>
        <p style="color: #a0a0b8; font-size: 12px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};

exports.sendInvitationEmail = async (to, inviterName, projectName, inviteLink) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.SMTP_USER,
    to,
    subject: `You're invited to ${projectName} - Webingo PM`,
    html: `
      <div style="font-family: 'Inter', Arial, sans-serif; max-width: 500px; margin: 0 auto; background: #1a1a2e; padding: 32px; border-radius: 12px;">
        <h2 style="color: #6c63ff; margin-bottom: 16px;">Project Invitation</h2>
        <p style="color: #e8e8f0;">${inviterName} invited you to join <strong>${projectName}</strong>.</p>
        <a href="${inviteLink}" style="display: inline-block; background: #6c63ff; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0; font-weight: 600;">Accept Invitation</a>
        <p style="color: #a0a0b8; font-size: 12px;">This invitation expires in 7 days.</p>
      </div>
    `,
  };

  await transporter.sendMail(mailOptions);
};
