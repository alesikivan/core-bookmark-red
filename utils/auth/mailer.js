const nodemailer = require('nodemailer')

const sendEmail = async (options) => {

  /*
    options = {email, subject, message} 
  */

  // Create resuable transporter object
  let transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    secure: false,
    auth: {
      user: process.env.SMTP_EMAIL,
      pass: process.env.SMTP_PASSWORD,
    }
  })

  let message = {
    from: process.env.SMTP_EMAIL,
    to: options.email,
    subject: options.subject,
    text: options.message
  }

  const info = await transporter.sendMail(message)
}

module.exports = sendEmail

