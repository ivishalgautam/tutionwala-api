import nodemailer from "nodemailer";
import config from "../config/index.js";

export const sendMail = async (template, mailTo, subject = "Tutionwala") => {
  // Create a transporter object using SMTP transport
  const transporter = nodemailer.createTransport({
    host: config.smtp_host,
    port: config.smtp_port,
    secure: true, // true for 465, false for other ports
    auth: {
      user: config.smtp_from_email,
      pass: config.smtp_password,
    },
  });

  const mailOptions = {
    from: `"Tutionwala" <${config.smtp_from_email}>`,
    to: mailTo,
    subject: subject,
    html: template,
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
