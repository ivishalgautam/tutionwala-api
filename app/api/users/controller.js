"use strict";

import table from "../../db/models.js";
import hash from "../../lib/encryption/index.js";
import { ErrorHandler } from "../../helpers/handleError.js";

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
  console.log(req.body);
  const record = await table.UserModel.getById(req);
  if (!record) {
    return ErrorHandler({ code: 404, message: "User not exists" });
  }

  const user = await table.UserModel.update(req);

  if (user && req?.body?.password) {
    req.body.new_password = req.body.password;
    await table.UserModel.updatePassword(req, req.user_data.id);
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
  const record = await table.UserModel.deleteById(req);
  if (record === 0) {
    return ErrorHandler({ code: 404, message: "User not exists" });
  }

  return res.send({ status: true, data: record });
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
};
