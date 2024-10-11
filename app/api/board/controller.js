"use strict";
import constants from "../../lib/constants/index.js";
import table from "../../db/models.js";
import { ErrorHandler } from "../../helpers/handleError.js";

const { BAD_REQUEST, NOT_FOUND } = constants.http.status;

const create = async (req, res) => {
  const board = await table.BoardModel.create(req);

  if (!board) {
    return ErrorHandler({ message: "Error creating board!" });
  }

  const subjects = req.body.subjects;
  if (subjects && subjects.length) {
    const data = subjects.map((subject) => ({
      name: String(subject).toLowerCase(),
      board_id: board.id,
    }));
    await table.SubjectModel.bulkCreate(data);
  }

  res.send({ status: true, message: "Board Added." });
};

const updateById = async (req, res) => {
  const record = await table.BoardModel.getById(req);
  if (!record) {
    return ErrorHandler({ code: NOT_FOUND, message: "Board not found!" });
  }

  const updated = await table.BoardModel.update(req);

  if (!updated)
    return ErrorHandler({ code: 500, message: "Error updated board!" });

  const subjectsToBeDeleted = [];
  const newSubjects = [];

  const subjects = req.body.subjects;
  const subjectRecord = await table.SubjectModel.getByBoardId({
    params: { id: record.id },
  });

  subjectRecord.map((subject) => {
    if (!subjects.includes(subject.name)) {
      subjectsToBeDeleted.push(subject.id);
    }
  });

  // Filter new subjects (subjects in the request but not in the DB)
  subjects.map((subject) => {
    if (!subjectRecord.some((rec) => rec.name === subject)) {
      newSubjects.push(String(subject).toLowerCase());
    }
  });

  if (subjectsToBeDeleted.length > 0) {
    await table.SubjectModel.bulkDelete(subjectsToBeDeleted);
  }

  // console.log({ subjectsToBeDeleted, newSubjects });

  const data = newSubjects.map((subject) => ({
    name: subject,
    board_id: req.params.id,
  }));

  await table.SubjectModel.bulkCreate(data);

  res.send({ status: true, message: "Updated" });
};

const getById = async (req, res) => {
  const record = await table.BoardModel.getById(req, req.params.id);

  if (!record) {
    return ErrorHandler({ code: NOT_FOUND, message: "Board not found!" });
  }

  res.send({ status: true, data: record });
};

const get = async (req, res) => {
  res.send({ status: true, data: await table.BoardModel.get(req) });
};

const deleteById = async (req, res) => {
  const record = await table.BoardModel.getById(req, req.params.id);

  if (!record)
    return ErrorHandler({ code: NOT_FOUND, message: "Board not found!" });

  await table.BoardModel.deleteById(req, req.params.id);

  res.send({ status: true, message: "Board deleted." });
};

export default {
  create: create,
  get: get,
  updateById: updateById,
  deleteById: deleteById,
  getById: getById,
};
