"use strict";
import constants from "../../lib/constants/index.js";
import table from "../../db/models.js";
import { ErrorHandler } from "../../helpers/handleError.js";

import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import ejs from "ejs";
import { sendMail } from "../../helpers/mailer.js";
import config from "../../config/index.js";

const { NOT_FOUND } = constants.http.status;

const create = async (req, res) => {
  const data = await table.QueryModel.create(req);
  const query_no = data.query_number;
  const raiseQueryTemplatePath = path.join(
    fileURLToPath(import.meta.url),
    "..",
    "..",
    "..",
    "..",
    "views",
    "query-raise.ejs"
  );

  const queryraiseTemplate = fs.readFileSync(raiseQueryTemplatePath, "utf-8");
  const queryRaiseSend = ejs.render(queryraiseTemplate, {
    name: req.body.name,
    email: req.body.email,
    address: req.body.address,
    phone: req.body.phone,
    subject: req.body.subject,
    message: req.body.message,
    query_no,
    status: data.status,
  });
  await sendMail(
    queryRaiseSend,
    data.email,
    `Query Raise #${query_no} | Tutionwala`
  );
  await sendMail(
    queryRaiseSend,
    config.smtp_from_email,
    `Query Raise #${query_no} | Tutionwala`
  );

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

const update = async (req, res) => {
  const record = await table.QueryModel.getById(req);

  if (!record)
    return ErrorHandler({ status: NOT_FOUND, message: "Query not found!" });

  const data = await table.QueryModel.update(req);
  const query_no = data.query_number;
  const raiseQueryTemplatePath = path.join(
    fileURLToPath(import.meta.url),
    "..",
    "..",
    "..",
    "..",
    "views",
    "query-raise.ejs"
  );

  const queryraiseTemplate = fs.readFileSync(raiseQueryTemplatePath, "utf-8");
  const queryRaiseSend = ejs.render(queryraiseTemplate, {
    name: data.name,
    email: data.email,
    address: data.address,
    phone: data.phone,
    subject: data.subject,
    message: data.message,
    status: data.status,
    query_no,
  });
  await sendMail(
    queryRaiseSend,
    data.email,
    `Query Raise #${query_no} | Tutionwala`
  );
  await sendMail(
    queryRaiseSend,
    config.smtp_from_email,
    `Query Raise #${query_no} | Tutionwala`
  );

  res.send({ status: true, message: "Query Updated." });
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
  update: update,
  getById: getById,
};
