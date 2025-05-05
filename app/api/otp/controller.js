"use strict";
import constants from "../../lib/constants/index.js";
import table from "../../db/models.js";
import moment from "moment";
import crypto from "crypto";
import { ErrorHandler } from "../../helpers/handleError.js";
import authToken from "../../helpers/auth.js";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import ejs from "ejs";
import { sendMail } from "../../helpers/mailer.js";
import { sendDltOtp } from "../../helpers/dlt-otp.js";
import { otpGenerator } from "../../helpers/otp-generator.js";

const { NOT_FOUND, BAD_REQUEST } = constants.http.status;

const create = async (req, res) => {
  const user = await table.UserModel.getByMobile(req);
  if (user)
    return ErrorHandler({ code: 400, message: "User exist with this number" });
  // const otp = crypto.randomInt(100000, 999999);
  const otp = otpGenerator(record);
  console.log({ otp });
  req.body.otp = otp;
  const record = await table.OtpModel.getByMobile(req);
  const resp = await sendDltOtp({
    phone: req.body?.mobile_number,
    otp,
  });

  if (resp.state === "SUBMIT_ACCEPTED") {
    if (record) {
      await table.OtpModel.update(req);
    } else {
      await table.OtpModel.create(req);
    }
  }

  res.send({ status: true, message: "Otp sent" });
};

const verify = async (req, res) => {
  console.log(req.body);
  const record = await table.OtpModel.getByMobile(req);

  if (!record) {
    return ErrorHandler({ code: NOT_FOUND, message: "Resend OTP!" });
  }

  const isExpired = moment(record.updated_at)
    .add(5, "minutes")
    .isBefore(moment());

  if (isExpired) {
    await table.OtpModel.deleteByMobile(req);
    return ErrorHandler({ code: BAD_REQUEST, message: "Please resend OTP!" });
  }

  if (record.otp != req.body.otp) {
    return ErrorHandler({ code: BAD_REQUEST, message: "Incorrect otp!" });
  }

  const newUser = await table.UserModel.createCustomer(req);
  if (!newUser) return ErrorHandler({ code: 500, message: "Error sign up!" });
  req.body.user_id = newUser.id;

  if (newUser.role === "tutor") {
    const tutor = await table.TutorModel.create(req);
    req.body.tutor_id = tutor.id;
    req.body.course_id = req.body.sub_categories;
    await table.TutorCourseModel.create(req);
  }

  if (newUser.role === "student") {
    await table.StudentModel.create(req);
  }

  await table.OtpModel.deleteByMobile(req);

  const user = await table.UserModel.getById(0, newUser.id);
  const [jwtToken, expiresIn] = authToken.generateAccessToken(user);
  const refreshToken = authToken.generateRefreshToken(user);

  const welcomeTemplatePath = path.join(
    fileURLToPath(import.meta.url),
    "..",
    "..",
    "..",
    "..",
    "views",
    "welcome.ejs"
  );

  const welcomeTemplate = fs.readFileSync(welcomeTemplatePath, "utf-8");
  const welcomeSend = ejs.render(welcomeTemplate, {
    username: `${req?.body?.fullname ?? ""}`,
  });
  req.body.email &&
    (await sendMail(welcomeSend, req?.body?.email, "Welcome to Tutionwala! "));

  return res.send({
    status: true,
    token: jwtToken,
    expire_time: Date.now() + expiresIn,
    refresh_token: refreshToken,
    user_data: user,
  });
};

export default {
  create: create,
  verify: verify,
};
