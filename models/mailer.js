const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

const DOMAIN = process.env.DOMAIN;
const FROM = process.env.FROM_EMAIL_ADDRESS;

const getVerificationLink = token => {
  return `${DOMAIN}/verify-email/verify?token=${token}`;
}

const getResetPasswordLink = token => {
  return `${DOMAIN}/reset-password/verify?token=${token}`;
};

const sendEmail = async (to, from, subject, html = null) => {
  const msg = { to, from, subject, html };
  let error;

  try {
    await sgMail.send(msg);

  } catch (e) {
    error = e;
  }
  return { error };
}

const sendVerificationEmail = async (to, token) => {
  const link = getVerificationLink(token);
  const { error } = await sendEmail(
    to, FROM, 'ProductGem: Verify Email',
    `<!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: 'Arial', sans-serif;
              margin: 0;
              padding: 0;
              background-color: #ffffff; /* white background */
              color: #333333; /* dark text color */
            }
        
            #email-container {
              max-width: 600px;
              margin: 20px auto;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
        
            #header {
              text-align: center;
              margin-bottom: 20px;
            }
        
            #header img {
              max-width: 100px;
            }
        
            #message {
              text-align: justify;
            }
        
            #cta-button {
              display: block;
              margin-top: 20px;
              padding: 10px 20px;
              text-align: center;
              text-decoration: none;
              color: #ffffff; /* white text color */
              background-color: #27ae60; /* darker green button color */
              border-radius: 5px;
            }
          </style>
        </head>
        <body>
        
          <div id="email-container">
            <p id="message">
              Thank you for signing up! To ensure the security of your account, we kindly ask you to verify your email address by clicking the button below.
            </p>
        
            <a href="${link}" id="cta-button">Verify Email</a>
        
            <p id="message">
              If the button above doesn't work, you can also copy and paste the following link into your browser:
              <br>
              ${link}
            </p>
        
            <p id="message">
              Thank you for choosing ProductGem!
            </p>
        
            <p id="message">
              Best regards,
              <br>
              ProductGem Team
            </p>
          </div>
        
        </body>
        </html>`
  );
  return { error };
};

const sendResetPasswordEmail = async (to, token) => {
  const link = getResetPasswordLink(token);
  const { error } = await sendEmail(
    to, FROM, 'ProductGem: Reset Password',
    `<!DOCTYPE html>
        <html lang="en">
        <head>
          <meta charset="UTF-8">
          <meta http-equiv="X-UA-Compatible" content="IE=edge">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <style>
            body {
              font-family: 'Arial', sans-serif;
              margin: 0;
              padding: 0;
              background-color: #ffffff; /* white background */
              color: #333333; /* dark text color */
            }
        
            #email-container {
              max-width: 600px;
              margin: 20px auto;
              padding: 20px;
              border-radius: 8px;
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
            }
        
            #header {
              text-align: center;
              margin-bottom: 20px;
            }
        
            #header img {
              max-width: 100px;
            }
        
            #message {
              text-align: justify;
            }
        
            #cta-button {
              display: block;
              margin-top: 20px;
              padding: 10px 20px;
              text-align: center;
              text-decoration: none;
              color: #ffffff; /* white text color */
              background-color: #27ae60; /* darker green button color */
              border-radius: 5px;
            }
          </style>
        </head>
        <body>
          <div id="email-container">
            <p id="message">
              Thanks for using ProductGem! To reset your password, click the button below.
            </p>
        
            <a href="${link}" id="cta-button">Reset Password</a>
        
            <p id="message">
              If the button above doesn't work, you can also copy and paste the following link into your browser:
              <br>
              ${link}
            </p>
        
            <p id="message">
              Thank you for choosing ProductGem!
            </p>
        
            <p id="message">
              Best regards,
              <br>
              ProductGem Team
            </p>
          </div>
        
        </body>
        </html>`,
  );
  return { error };
}

module.exports = { sendVerificationEmail, sendResetPasswordEmail };
