"use strict";
import constants from "../../lib/constants/index.js";
import table from "../../db/models.js";
import { ErrorHandler } from "../../helpers/handleError.js";

const { NOT_FOUND } = constants.http.status;

const updateById = async (req, res) => {
  const record = await table.TutorModel.getById(req);
  if (!record) {
    return ErrorHandler({ code: NOT_FOUND, message: "Tutor not found!" });
  }
  const currStep = req.body.curr_step;
  req.body.curr_step = Number(currStep) < 3 ? Number(currStep) + 1 : 3;
  if (currStep === 3) {
    req.body.is_profile_completed = true;
  }
  const updated = await table.TutorModel.update(req);
  if (!updated)
    return ErrorHandler({ code: 500, message: "Error updating tutor!" });

  res.send({ status: true, message: "Updated" });
};

const getById = async (req, res) => {
  const record = await table.TutorModel.getById(req);
  if (!record) {
    return ErrorHandler({ code: NOT_FOUND, message: "Tutor not found!" });
  }

  res.send({ status: true, data: record });
};

const getByUserId = async (req, res) => {
  const record = await table.TutorModel.getByUserId(req);
  if (!record) {
    return ErrorHandler({ code: NOT_FOUND, message: "Tutor not found!" });
  }

  res.send({ status: true, data: record });
};

const get = async (req, res) => {
  res.send({ status: true, data: await table.TutorModel.get(req) });
};

const getFilteredTutors = async (req, res) => {
  let data = await table.TutorModel.getFilteredTutors(req);
  const total = data?.length ?? 0;
  const sliced = req.query.limit
    ? data
        ?.map(({ id, profile_picture }) => ({ id, profile_picture }))
        .slice(0, req.query.limit ?? 6)
    : data?.map(
        ({ id, profile_picture, fullname, experience, languages, boards }) => ({
          id,
          profile_picture,
          fullname,
          experience,
          languages,
          boards,
        })
      );

  res.send({
    status: true,
    data: sliced,
    total,
  });
};

export default {
  updateById: updateById,
  getByUserId: getByUserId,
  get: get,
  getFilteredTutors: getFilteredTutors,
  getById: getById,
};
