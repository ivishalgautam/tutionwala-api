"use strict";
import constants from "../../lib/constants/index.js";
import table from "../../db/models.js";
import slugify from "slugify";
import fileController from "../upload_files/controller.js";
import { ErrorHandler } from "../../helpers/handleError.js";

const { BAD_REQUEST, NOT_FOUND } = constants.http.status;

const create = async (req, res) => {
  let slug = slugify(req.body.name, { lower: true });
  req.body.slug = slug;
  const record = await table.CategoryModel.getBySlug(req, slug);

  if (record)
    return ErrorHandler({
      code: BAD_REQUEST,
      message: "Category exist with this name!",
    });

  res.send({ status: true, data: await table.CategoryModel.create(req) });
};

const updateById = async (req, res) => {
  let slug = slugify(req.body.name, { lower: true });
  req.body.slug = slug;

  const record = await table.CategoryModel.getById(req, req.params.id);

  if (!record) {
    return ErrorHandler({ code: NOT_FOUND, message: "Category not found!" });
  }

  const slugExist = await table.CategoryModel.getBySlug(req, req.body.slug);

  // Check if there's another Product with the same slug but a different ID
  if (slugExist && record?.id !== slugExist?.id)
    return ErrorHandler({
      code: BAD_REQUEST,
      message: "Category exist with this name!",
    });

  res.send({
    status: true,
    data: await table.CategoryModel.update(req, req.params.id),
  });
};

const getBySlug = async (req, res) => {
  const record = await table.CategoryModel.getBySlug(req);

  if (!record) {
    return ErrorHandler({ code: NOT_FOUND, message: "Category not found!" });
  }

  res.send({
    status: true,
    data: await table.CategoryModel.getBySlug(req),
  });
};

const getById = async (req, res) => {
  const record = await table.CategoryModel.getById(req, req.params.id);

  if (!record) {
    return ErrorHandler({ code: NOT_FOUND, message: "Category not found!" });
  }

  res.send({ status: true, data: record });
};

const get = async (req, res) => {
  res.send({ status: true, data: await table.CategoryModel.get(req) });
};

const deleteById = async (req, res) => {
  const record = await table.CategoryModel.getById(req, req.params.id);

  if (!record)
    return ErrorHandler({ code: NOT_FOUND, message: "Category not found!" });

  await table.CategoryModel.deleteById(req, req.params.id);
  req.query.file_path = record?.image;
  fileController.deleteFile(req, res);

  res.send({ status: true, message: "Category deleted." });
};

export default {
  create: create,
  get: get,
  updateById: updateById,
  deleteById: deleteById,
  getBySlug: getBySlug,
  getById: getById,
};
