"use strict";
import constants from "../../lib/constants/index.js";
import table from "../../db/models.js";
import slugify from "slugify";
import { ErrorHandler } from "../../helpers/handleError.js";

const { BAD_REQUEST, INTERNAL_SERVER_ERROR, NOT_FOUND } = constants.http.status;

const create = async (req, res) => {
  console.log("create followup", req.body);
  const student = await table.StudentModel.getById(0, req.body.student_id);

  if (!student)
    return ErrorHandler({ code: 404, message: "student not exist!" });

  const tutor = await table.TutorModel.getByUserId(req);

  req.body.tutor_id = tutor.id;

  await table.FollowupModel.create(req);
  res.send({ status: true, message: "Follow up created." });
};

const getById = async (req, res) => {
  const record = await table.FollowupModel.getById(req);

  if (!record) {
    return ErrorHandler({ code: NOT_FOUND, message: "Follow up not found!" });
  }

  res.send({ status: true, data: record });
};

const getByStudentId = async (req, res) => {
  const record = await table.StudentModel.getById(req);

  if (!record) {
    return ErrorHandler({ code: NOT_FOUND, message: "Student not found!" });
  }

  res.send({
    status: true,
    data: await table.FollowupModel.getByStudentId(req),
  });
};

const updateById = async (req, res) => {
  const record = await table.FollowupModel.update(req, req.params.id);

  if (!record) {
    return ErrorHandler({ code: NOT_FOUND, message: "Follow up not found!" });
  }

  res.send({ status: true, message: "Updated.", data: record });
};

const get = async (req, res) => {
  const queries = await table.FollowupModel.get(req);
  res.send({ status: true, data: queries });
};

const deleteById = async (req, res) => {
  const record = await table.FollowupModel.getById(req, req.params.id);
  if (!record)
    return ErrorHandler({ code: NOT_FOUND, message: "Follow up not found!" });

  await table.FollowupModel.deleteById(req, req.params.id);
  res.send({ status: true, message: "Follow up deleted." });
};

export default {
  create: create,
  get: get,
  deleteById: deleteById,
  getById: getById,
  updateById: updateById,
  getByStudentId: getByStudentId,
};
