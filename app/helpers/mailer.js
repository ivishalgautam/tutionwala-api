import nodemailer from "nodemailer";
import config from "../config/index.js";

export const sendMail = async (template, mailTo, subject = "Tutionwala") => {
  // Create a transporter object using SMTP transport
  const transporter = nodemailer.createTransport({
    host: config.smtp_host,
    port: config.smtp_port,
    secure: true, // true for 465, false for other ports
    auth: {
      user: config.smtp_from_email, // Your email
      pass: config.smtp_password, // Your password
    },
  });

  // Define email options
  const mailOptions = {
    from: config.smtp_from_email, // Sender address
    to: mailTo, // List of receivers
    subject: subject, // Subject line
    html: template, // Rendered email template
  };

  // Send email
  transporter.sendMail(mailOptions, (error, info) => {
    if (error) {
      console.error("Error sending email:", error);
    } else {
      console.log(`Email sent to '${mailTo}':`, info.response);
    }
  });
};
