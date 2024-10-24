"use strict";
import constants from "../../lib/constants/index.js";
import table from "../../db/models.js";
import { ErrorHandler } from "../../helpers/handleError.js";

const { NOT_FOUND } = constants.http.status;

const create = async (req, res) => {
  await table.QueryModel.create(req);
  res.send({ status: true, message: "Query sent." });
};

const getById = async (req, res) => {
  const record = await table.QueryModel.getById(req, req.params.id);

  if (!record)
    return ErrorHandler({ status: NOT_FOUND, message: "Query not found!" });

  res.send({ status: true, data: record });
};

const get = async (req, res) => {
  const data = await table.QueryModel.get(req);
  res.send({ status: true, data, total: data?.[0]?.total });
};

const deleteById = async (req, res) => {
  const record = await table.QueryModel.getById(req, req.params.id);

  if (!record)
    return ErrorHandler({ status: NOT_FOUND, message: "Query not found!" });

  await table.QueryModel.deleteById(req, req.params.id);
  res.send({ status: true, message: "Query deleted." });
};

export default {
  create: create,
  get: get,
  deleteById: deleteById,
  getById: getById,
};
