"use strict";
import constants from "../../lib/constants/index.js";
import table from "../../db/models.js";
import { ErrorHandler } from "../../helpers/handleError.js";

const { BAD_REQUEST, NOT_FOUND } = constants.http.status;

const create = async (req, res) => {
  const board = await table.SubjectModel.create(req);

  if (!board) {
    return ErrorHandler({ message: "Error creating subject!" });
  }

  const subjects = req.body.subjects;
  if (subjects && subjects.length) {
    const data = subjects.map((subject) => ({
      name: subject,
      board_id: board.id,
    }));
    console.log({ data });
    await table.SubjectModel.bulkCreate(data);
  }

  res.send({ status: true, message: "Subject Added." });
};

const updateById = async (req, res) => {
  const record = await table.SubjectModel.getById(req);

  if (!record) {
    return ErrorHandler({ code: NOT_FOUND, message: "Subject not found!" });
  }

  res.send({
    status: true,
    data: await table.SubjectModel.update(req),
  });
};

const getBySlug = async (req, res) => {
  const record = await table.SubjectModel.getBySlug(req);

  if (!record) {
    return ErrorHandler({ code: NOT_FOUND, message: "Subject not found!" });
  }

  res.send({
    status: true,
    data: await table.SubjectModel.getBySlug(req),
  });
};

const getById = async (req, res) => {
  const record = await table.SubjectModel.getById(req, req.params.id);

  if (!record) {
    return ErrorHandler({ code: NOT_FOUND, message: "Subject not found!" });
  }

  res.send({ status: true, data: record });
};

const get = async (req, res) => {
  res.send({ status: true, data: await table.SubjectModel.get(req) });
};

const deleteById = async (req, res) => {
  const record = await table.SubjectModel.getById(req, req.params.id);

  if (!record)
    return ErrorHandler({ code: NOT_FOUND, message: "Subject not found!" });

  await table.SubjectModel.deleteById(req, req.params.id);

  res.send({ status: true, message: "Subject deleted." });
};

export default {
  create: create,
  get: get,
  updateById: updateById,
  deleteById: deleteById,
  getBySlug: getBySlug,
  getById: getById,
};
