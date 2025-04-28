"use strict";

import table from "../../db/models.js";
import hash from "../../lib/encryption/index.js";
import { ErrorHandler } from "../../helpers/handleError.js";
import { sequelize } from "../../db/postgres.js";
import { deleteKey } from "../../helpers/s3.js";
import { randomInt } from "crypto";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import ejs from "ejs";
import { sendMail } from "../../helpers/mailer.js";
import moment from "moment";

const create = async (req, res) => {
  console.log(req.body);
  const userExist = await table.UserModel.getByMobile(req);
  if (userExist)
    return ErrorHandler({ code: 400, message: "User exist with this number" });

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

  return res.send({ status: true, message: "User created" });
};

const update = async (req, res) => {
  const record = await table.UserModel.getById(req);
  if (!record) {
    return ErrorHandler({ code: 404, message: "User not exists" });
  }

  const user = await table.UserModel.update(req);

  if (user && req?.body?.password) {
    req.body.new_password = req.body.password;
    await table.UserModel.updatePassword(req, req.user_data.id);
  }

  if (req.user_data.role === "student") {
    const studentRecord = await table.StudentModel.getByUserId(0, record.id);
    if (studentRecord) {
      let newReq = { ...req };
      newReq.params.id = studentRecord.id;
      await table.StudentModel.update(newReq);
    }
  }

  return res.send({ status: true, message: "Updated" });
};

const updateStatus = async (req, res) => {
  const record = await table.UserModel.getById(req);
  if (!record) {
    return ErrorHandler({ code: 404, message: "User not exists" });
  }
  const data = await table.UserModel.updateStatus(
    req.params.id,
    req.body.is_active
  );

  res.send({
    status: true,
    message: data?.is_active ? "Customer Active." : "Customer Inactive.",
  });
};

const deleteById = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const record = await table.UserModel.getByPk(req.params.id);
    if (record === 0) {
      return ErrorHandler({ code: 404, message: "User not exists" });
    }

    if (record.role === "tutor") {
      const tutorRecord = await table.TutorModel.getByUserId(0, record.id);
      if (tutorRecord) {
        const key1 = tutorRecord.profile_picture?.split(".com/")[1];
        if (key1) {
          await deleteKey(key1);
        }
        const key2 = tutorRecord.intro_video?.split(".com/")[1];
        if (key2) {
          await deleteKey(key2);
        }
      }
    }

    if (record.role === "student") {
      const studentRecord = await table.StudentModel.getByUserId(0, record.id);
      if (studentRecord) {
        const key1 = studentRecord.profile_picture?.split(".com/")[1];
        if (key1) {
          await deleteKey(key1);
        }
      }
    }

    await table.UserModel.deleteById(0, record.id, { transaction });
    await transaction.commit();
    return res.send({
      status: true,
      message: "User deleted",
    });
  } catch (error) {
    await transaction.rollback();
    ErrorHandler({ message: error.message });
    console.log(error);
  }
};

const deleteAccount = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const record = await table.UserModel.getByPk(req.user_data.id);
    if (record === 0) {
      return ErrorHandler({ code: 404, message: "User not exists" });
    }

    if (record.role === "tutor") {
      const tutorRecord = await table.TutorModel.getByUserId(0, record.id);
      if (tutorRecord) {
        const key1 = tutorRecord.profile_picture?.split(".com/")[1];
        if (key1) {
          await deleteKey(key1);
        }
        const key2 = tutorRecord.intro_video?.split(".com/")[1];
        if (key2) {
          await deleteKey(key2);
        }
      }
    }

    if (record.role === "student") {
      const studentRecord = await table.StudentModel.getByUserId(0, record.id);
      if (studentRecord) {
        const key1 = studentRecord.profile_picture?.split(".com/")[1];
        console.log({ key1 });
        if (key1) {
          await deleteKey(key1);
        }
      }
    }

    await table.UserModel.deleteById(0, record.id, { transaction });
    await transaction.commit();
    return res.send({
      status: true,
      message: "Account deleted, Thank you for being with us.",
    });
  } catch (error) {
    await transaction.rollback();
    ErrorHandler({ message: error.message });
    console.log(error);
  }
};

const get = async (req, res) => {
  const data = await table.UserModel.get(req);

  return res.send({ status: true, data: data, total: data?.[0]?.total });
};

const getById = async (req, res) => {
  const record = await table.UserModel.getById(req);
  if (!record) {
    return ErrorHandler({ code: 404, message: "User not exists" });
  }
  delete record.password;

  return res.send({ status: true, record });
};

const getAadhaarDetails = async (req, res) => {
  const record = await table.UserModel.getById(req);
  if (!record) {
    return ErrorHandler({ code: 404, message: "User not exists" });
  }

  const data = await table.UserModel.getAadhaarDetails(req);

  return res.send({ status: true, data });
};

const updatePassword = async (req, res) => {
  const record = await table.UserModel.getById(req);

  if (!record) {
    return ErrorHandler({ code: 404, message: "User not exists" });
  }

  const verify_old_password = hash.verify(
    req.body.old_password,
    record.password
  );

  if (!verify_old_password) {
    return ErrorHandler({
      code: 404,
      message: "Incorrect password. Please enter a valid password",
    });
  }

  await table.UserModel.updatePassword(req);
  return res.send({
    status: true,
    message: "Password changed successfully!",
  });
};

const checkUsername = async (req, res) => {
  const user = await table.UserModel.getByUsername(req);
  if (user) {
    return ErrorHandler({
      code: 409,
      message: "username already exists try with different username",
    });
  }
  return res.send({
    status: true,
  });
};

const getUser = async (req, res) => {
  if (!req?.user_data?.id) return;
  const record = await table.UserModel.getById(0, req.user_data.id);
  if (!record) {
    return ErrorHandler({ code: 401, messaege: "invalid token" });
  }

  delete req.user_data.password;
  delete req.user_data.reset_password_token;
  delete req.user_data.confirmation_token;
  return res.send(req.user_data);
};

const resetPassword = async (req, res) => {
  const token = await table.UserModel.getByResetToken(req);
  if (!token) {
    return ErrorHandler({ code: 401, message: "invalid url" });
  }

  await table.UserModel.updatePassword(req, token.id);
  return res.send({
    status: true,
    message: "Password reset successfully!",
  });
};

const emailVerificationOTPSend = async (req, res) => {
  const record = await table.UserModel.getByEmailId(req);

  if (!record) {
    return ErrorHandler({ code: 404, message: "User not found!" });
  }

  const otp = randomInt(100000, 999999);
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

const verifyEmailOtp = async (req, res) => {
  console.log(req.body);
  const record = await table.OtpModel.getByEmail(req);

  if (!record) {
    return ErrorHandler({ code: 404, message: "Resend OTP!" });
  }
  console.log({ record });
  const isExpired = moment(record.created_at)
    .add(5, "minutes")
    .isBefore(moment());

  if (isExpired) {
    await table.OtpModel.deleteByEmail(req);
    return ErrorHandler({ code: 400, message: "Please resend OTP!" });
  }

  if (record.otp != req.body.otp) {
    return ErrorHandler({ code: 400, message: "Incorrect otp!" });
  }

  req.body.is_email_verified = true;
  await table.UserModel.update(req, req.user_data.id);

  return res.send({
    status: true,
    message: "Email verified.",
  });
};

export default {
  create: create,
  update: update,
  deleteById: deleteById,
  get: get,
  getById: getById,
  checkUsername: checkUsername,
  updatePassword: updatePassword,
  getUser: getUser,
  resetPassword: resetPassword,
  updateStatus: updateStatus,
  deleteAccount: deleteAccount,
  getAadhaarDetails: getAadhaarDetails,
  emailVerificationOTPSend: emailVerificationOTPSend,
  verifyEmailOtp: verifyEmailOtp,
};
