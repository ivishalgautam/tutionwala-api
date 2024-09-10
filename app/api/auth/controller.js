"use strict";

import hash from "../../lib/encryption/index.js";

import table from "../../db/models.js";
import authToken from "../../helpers/auth.js";
import crypto from "crypto";
import { sendOtp } from "../../helpers/interaktApi.js";
import { ErrorHandler } from "../../helpers/handleError.js";
import moment from "moment";

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
    return res.code(404).send({ message: "Customer not found!" });
  }

  if (!record.is_active)
    return res
      .code(400)
      .send({ message: "Please contact administrator for login!" });

  const otp = crypto.randomInt(100000, 999999);
  console.log({ otp });
  req.body.email = record.email;
  req.body.mobile_number = record.mobile_number;
  req.body.country_code = record.country_code;
  req.body.otp = otp;

  if (record) {
    await table.OtpModel.create(req);
  }

  return res.send({ status: true, message: "Otp sent." });
};

const otpVerify = async (req, res) => {
  console.log(req.body);
  const record = await table.OtpModel.getByMobile(req);

  if (!record) {
    return ErrorHandler({ code: NOT_FOUND, message: "Resend OTP!" });
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
  const data = await table.UserModel.create(req);
  userData = await table.UserModel.getById(0, data.id);

  // const resp = await sendOtp({
  //   country_code: userData?.country_code,
  //   mobile_number: userData?.mobile_number,
  //   first_name: userData?.first_name,
  //   last_name: userData?.last_name,
  //   otp,
  // });

  // if (resp.data.result) {
  if (false) {
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
