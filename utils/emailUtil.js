const nodemailer = require('nodemailer');

/**
 * Function to send an email
 * @param {string} to - The recipient email
 * @param {string} subject - The subject of the email
 * @param {string} text - The content of the email
 */
const sendEmail = (to, subject, text) => {
  const transporter = nodemailer.createTransport({
    service: 'gmail', // You can replace this with any email service
    auth: {
      user: process.env.EMAIL_USER, // Your email address
      pass: process.env.EMAIL_PASS  // Your email password or app-specific password
    }
  });

  const mailOptions = {
    from: process.env.EMAIL_USER,
    to,
    subject,
    text
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.log('Error sending email:', error);
    } else {
      console.log('Email sent:', info.response);
    }
  });
};

module.exports = { sendEmail };
