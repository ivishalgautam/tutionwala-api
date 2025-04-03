"use strict";
import table from "../../db/models.js";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import ejs from "ejs";
import { sendMail } from "../../helpers/mailer.js";
import config from "../../config/index.js";

const create = async (req, res) => {
  const feedbackTemplatePath = path.join(
    fileURLToPath(import.meta.url),
    "..",
    "..",
    "..",
    "..",
    "views",
    "feedback.ejs"
  );

  const feedbackTemplate = fs.readFileSync(feedbackTemplatePath, "utf-8");
  const feedbackSend = ejs.render(feedbackTemplate, {
    name: req.body.name,
    email: req.body.email,
    address: req.body.address,
    phone: req.body.phone,
    subject: req.body.subject,
    message: req.body.message,
  });
  await sendMail(feedbackSend, config.smtp_from_email, "Feedback | Tutionwala");

  res.send({ status: true, message: "Thank you for your feedback." });
};

export default {
  create: create,
};
