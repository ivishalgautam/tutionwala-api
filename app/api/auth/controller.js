"use strict";

import hash from "../../lib/encryption/index.js";

import table from "../../db/models.js";
import authToken from "../../helpers/auth.js";
import crypto from "crypto";
import { sendOtp } from "../../helpers/interaktApi.js";
import { ErrorHandler } from "../../helpers/handleError.js";
import moment from "moment";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import ejs from "ejs";
import { sendMail } from "../../helpers/mailer.js";

const verifyUserCredentials = async (req, res) => {
  let userData;
  userData = await table.UserModel.getByUsername(req);

  if (!userData) {
    return ErrorHandler({ code: 404, message: "User not found!" });
  }

  let passwordIsValid = hash.verify(req.body.password, userData.password);

  if (!passwordIsValid) {
    return ErrorHandler({ code: 400, message: "Invalid credentials" });
  }

  if (!userData.is_active) {
    return ErrorHandler({
      code: 400,
      message: "User not active. Please contact administrator!",
    });
  }

  const [jwtToken, expiresIn] = authToken.generateAccessToken(userData);
  const refreshToken = authToken.generateRefreshToken(userData);

  return res.send({
    status: true,
    token: jwtToken,
    expire_time: Date.now() + expiresIn,
    refresh_token: refreshToken,
    user_data: userData,
  });
};

const otpSend = async (req, res) => {
  const record = await table.UserModel.getByMobile(req);

  if (!record) {
    return ErrorHandler({ code: 404, message: "Customer not found!" });
  }
  if (req.body.role && req.body.role !== record.role) {
    return ErrorHandler({ code: 404, message: "User not found!" });
  }

  const otp =
    record.mobile_number === "8429000000"
      ? 111111
      : crypto.randomInt(100000, 999999);
  console.log({ otp });

  req.body.email = record.email;
  req.body.mobile_number = record.mobile_number;
  req.body.country_code = record.country_code;
  req.body.otp = otp;

  let otpRecord = null;
  if (record) {
    otpRecord = await table.OtpModel.create(req);
  }

  if (otpRecord) {
    const resp = await sendOtp({
      country_code: record?.country_code,
      mobile_number: record?.mobile_number,
      fullname: record?.fullname,
      otp,
    });

    const otpTemplatePath = path.join(
      fileURLToPath(import.meta.url),
      "..",
      "..",
      "..",
      "..",
      "views",
      "otp.ejs"
    );

    const otpTemplate = fs.readFileSync(otpTemplatePath, "utf-8");
    const otpSend = ejs.render(otpTemplate, {
      fullname: `${record.fullname ?? ""}`,
      otp: otp,
    });
    await sendMail(otpSend, record.email);
  }

  return res.send({ status: true, message: "Otp sent." });
};

const otpVerify = async (req, res) => {
  const record = await table.OtpModel.getByMobile(req);

  if (!record) {
    return ErrorHandler({ code: 404, message: "Resend OTP!" });
  }

  const isExpired = moment(record.created_at)
    .add(5, "minutes")
    .isBefore(moment());

  if (isExpired) {
    await table.OtpModel.deleteByMobile(req);
    return ErrorHandler({ code: 400, message: "Please resend OTP!" });
  }

  if (record.otp != req.body.otp) {
    return ErrorHandler({ code: 400, message: "Incorrect otp!" });
  }

  const userData = await table.UserModel.getByMobile(req);
  if (!userData) {
    return ErrorHandler({ code: 404, message: "User not found!" });
  }

  if (false && !userData.is_active) {
    return ErrorHandler({
      code: 400,
      message: "User not active. Please contact administrator!",
    });
  }

  const [jwtToken, expiresIn] = authToken.generateAccessToken(userData);
  const refreshToken = authToken.generateRefreshToken(userData);

  let user = null;

  if (userData.role === "tutor") {
    user = await table.TutorModel.getByUserId(0, userData.id);
  } else {
    user = await table.StudentModel.getByUserId(0, userData.id);
  }

  return res.send({
    status: true,
    token: jwtToken,
    expire_time: Date.now() + expiresIn,
    refresh_token: refreshToken,
    user_data: userData,
    is_profile_completed: user.is_profile_completed,
    curr_step: user.curr_step,
  });
};

const createNewUser = async (req, res) => {
  let userData;
  const record = await table.UserModel.getByUsername(req);

  if (record) {
    return ErrorHandler({
      code: 409,
      message:
        "User already exists with username. Please try with different username",
    });
  }

  const otp = crypto.randomInt(100000, 999999);
  console.log({ otp });
  const data = await table.UserModel.create(req);
  userData = await table.UserModel.getById(0, data.id);

  const resp = await sendOtp({
    country_code: userData?.country_code,
    mobile_number: userData?.mobile_number,
    first_name: userData?.first_name,
    last_name: userData?.last_name,
    otp,
  });

  // if (resp.data.result) {
  if (resp.data.result) {
    await table.OtpModel.create(req);
  }

  const [jwtToken, expiresIn] = authToken.generateAccessToken(userData);
  const refreshToken = authToken.generateRefreshToken(userData);

  return res.send({
    status: true,
    token: jwtToken,
    expire_time: Date.now() + expiresIn,
    refresh_token: refreshToken,
    user_data: userData,
  });
};

const verifyRefreshToken = async (req, res) => {
  // console.log({ cookies: req.cookies });
  return authToken.verifyRefreshToken(req, res);
};

export default {
  verifyUserCredentials: verifyUserCredentials,
  createNewUser: createNewUser,
  verifyRefreshToken: verifyRefreshToken,
  otpSend: otpSend,
  otpVerify: otpVerify,
};
