"use strict";
import constants from "../../lib/constants/index.js";
import table from "../../db/models.js";
import { ErrorHandler } from "../../helpers/handleError.js";

const { NOT_FOUND } = constants.http.status;

const updateById = async (req, res) => {
  const record = await table.StudentModel.getById(req);
  if (!record) {
    return ErrorHandler({ code: NOT_FOUND, message: "Student not found!" });
  }

  const currStep = req.body?.curr_step ?? null;
  if (currStep) {
    req.body.curr_step = Number(currStep) < 2 ? Number(currStep) + 1 : 2;
  }

  if (currStep === 2) {
    req.body.is_profile_completed = true;
  }

  const updated = await table.StudentModel.update(req);
  if (!updated)
    return ErrorHandler({ code: 500, message: "Error updating student!" });

  res.send({ status: true, message: "Updated" });
};

const getByUserId = async (req, res) => {
  const record = await table.StudentModel.getByUserId(req);
  if (!record) {
    return ErrorHandler({ code: NOT_FOUND, message: "Student not found!" });
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
