"use strict";
import constants from "../../lib/constants/index.js";
import table from "../../db/models.js";
import { ErrorHandler } from "../../helpers/handleError.js";

const { NOT_FOUND } = constants.http.status;

const updateById = async (req, res) => {
  console.log(req.body);
  const record = await table.StudentModel.getById(req);
  if (!record) {
    return ErrorHandler({ code: NOT_FOUND, message: "Tutor not found!" });
  }
  const currStep = req.body.curr_step;
  req.body.curr_step = currStep < 2 ? currStep + 1 : 2;
  if (currStep === 2) {
    req.body.is_profile_completed = true;
  }
  const updated = await table.StudentModel.update(req);
  if (!updated)
    return ErrorHandler({ code: 500, message: "Error updating tutor!" });

  res.send({ status: true, message: "Updated" });
};

const getByUserId = async (req, res) => {
  const record = await table.StudentModel.getByUserId(req);
  if (!record) {
    return ErrorHandler({ code: NOT_FOUND, message: "Tutor not found!" });
  }

  res.send({ status: true, data: record });
};

const get = async (req, res) => {
  res.send({ status: true, data: await table.StudentModel.get(req) });
};

export default {
  updateById: updateById,
  getByUserId: getByUserId,
  get: get,
};
