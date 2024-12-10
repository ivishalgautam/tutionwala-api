"use strict";
import constants from "../../lib/constants/index.js";
import table from "../../db/models.js";
import moment from "moment";
import crypto from "crypto";
import { sendOtp } from "../../helpers/interaktApi.js";
import { ErrorHandler } from "../../helpers/handleError.js";
import authToken from "../../helpers/auth.js";

const { NOT_FOUND, BAD_REQUEST } = constants.http.status;

const create = async (req, res) => {
  const user = await table.UserModel.getByMobile(req);
  if (user)
    return ErrorHandler({ code: 400, message: "User exist with this number" });
  const otp = crypto.randomInt(100000, 999999);

  req.body.otp = otp;
  const record = await table.OtpModel.getByMobile(req);
  console.log({ otp });
  const resp = await sendOtp({
    country_code: req.body?.country_code,
    mobile_number: req.body?.mobile_number,
    fullname: req.body?.fullname,
    otp,
  });
  // ! change true and check resp
  if (resp.statusText === "OK") {
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
  const isExpired = moment(record.created_at)
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
