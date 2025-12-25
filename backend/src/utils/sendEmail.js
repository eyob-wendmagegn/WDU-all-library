import nodemailer from 'nodemailer';

const sendEmail = async (options) => {
  // Check if credentials exist
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.error('FATAL ERROR: EMAIL_USER or EMAIL_PASS is missing in .env file.');
    throw new Error('Email credentials are not configured.');
  }

  // Use environment variables for credentials
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS, 
    },
  });

  const mailOptions = {
    from: `"Woldia Library" <${process.env.EMAIL_USER}>`,
    to: options.email,
    subject: options.subject,
    html: options.message,
  };

  try {
    await transporter.sendMail(mailOptions);
    console.log(`Email sent to ${options.email}`);
  } catch (error) {
    console.error('Nodemailer Error:', error);
    throw error;
  }
};

export default sendEmail;