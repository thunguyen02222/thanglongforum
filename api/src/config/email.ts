const emailConfig = {
  transport: process.env.MAILER_TRANSPORT || 'smtp',
  from: process.env.MAIL_FROM || 'noreply@example.com',
  smtp: {
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER || '',
      pass: process.env.SMTP_PASS || ''
    }
  },
  sendgrid: {
    apiKey: process.env.SENDGRID_API_KEY || ''
  }
};

export default emailConfig;

export const registerAs = () => ({ email: emailConfig });
