"use strict";
import constants from "../../lib/constants/index.js";
import table from "../../db/models.js";
import slugify from "slugify";
import fileController from "../upload_files/controller.js";
import { ErrorHandler } from "../../helpers/handleError.js";

const { BAD_REQUEST, INTERNAL_SERVER_ERROR, NOT_FOUND } = constants.http.status;

const create = async (req, res) => {
  let slug = slugify(req.body.name, { lower: true });
  req.body.slug = slug;
  const record = await table.SubCategoryModel.getBySlug(req, slug);

  if (record)
    return ErrorHandler({
      code: BAD_REQUEST,
      message: "Sub category exist with this name!",
    });

  const subCat = await table.SubCategoryModel.create(req);
  if (!subCat) {
    return ErrorHandler({ code: 500, message: "Category creation failed" });
  }

  const boardIds = req.body.board_ids;
  if (boardIds && boardIds.length > 0) {
    req.body.sub_category_id = subCat.id;

    for (const id of boardIds) {
      req.body.board_id = id;
      await table.SubCatAndBoardMappingModel.create(req);
    }
  }

  res.send({ status: true, message: "Created" });
};

const updateById = async (req, res) => {
  const { id } = req.params; // Subcategory ID
  const { is_boards, board_ids } = req.body; //  board IDs

  const record = await table.SubCategoryModel.getById(req, req.params.id);

  if (!record) {
    return ErrorHandler({
      code: NOT_FOUND,
      message: "Sub category not found!",
    });
  }

  const updateSubCat = await table.SubCategoryModel.update(req);
  if (!updateSubCat)
    return ErrorHandler({ message: "Error updating sub category!" });

  // Fetch the existing board mappings for this subcategory
  const existingMappings =
    await table.SubCatAndBoardMappingModel.getBySubCategoryId(0, id);
  const existingBoardIds = existingMappings.map((mapping) => mapping.board_id);

  // Find the boards to add and remove
  const boardsToAdd = board_ids.filter(
    (boardId) => !existingBoardIds.includes(boardId)
  );
  const boardsToRemove = existingBoardIds.filter(
    (boardId) => !board_ids.includes(boardId)
  );

  // Remove the boards that are no longer associated
  for (const boardId of boardsToRemove) {
    await table.SubCatAndBoardMappingModel.deleteBySubCategoryAndBoard(
      id,
      boardId
    );
  }

  // Add new board mappings
  for (const boardId of boardsToAdd) {
    req.body.board_id = boardId;
    req.body.sub_category_id = id;
    await table.SubCatAndBoardMappingModel.create(req);
  }

  res.send({ status: true, data: "Updated" });
};

const getBySlug = async (req, res) => {
  const record = await table.SubCategoryModel.getBySlug(req);

  if (!record) {
    return ErrorHandler({
      code: NOT_FOUND,
      message: "Sub category not found!",
    });
  }

  res.send({
    status: true,
    data: await table.SubCategoryModel.getBySlug(req),
  });
};

const getByCategory = async (req, res) => {
  const record = await table.CategoryModel.getBySlug(req, req.params.slug);

  if (!record) {
    return ErrorHandler({ code: NOT_FOUND, message: "Category not found!" });
  }

  res.send({
    status: true,
    data: await table.SubCategoryModel.getByCategory(req, req.params.slug),
  });
};

const getById = async (req, res) => {
  const record = await table.SubCategoryModel.getById(req, req.params.id);

  if (!record) {
    return ErrorHandler({
      code: NOT_FOUND,
      message: "Sub category not found!",
    });
  }

  res.send({ status: true, data: record });
};

const get = async (req, res) => {
  const products = await table.SubCategoryModel.get(req);
  console.log({ products });
  res.send({ status: true, data: products });
};

const deleteById = async (req, res) => {
  const record = await table.SubCategoryModel.getById(req, req.params.id);

  if (!record)
    return ErrorHandler({
      code: NOT_FOUND,
      message: "Sub category not found!",
    });

  await table.SubCategoryModel.deleteById(req, req.params.id);
  req.query.file_path = record?.image;
  fileController.deleteFile(req, res);

  res.send({ status: true, message: "Sub category deleted." });
};

export default {
  create: create,
  get: get,
  updateById: updateById,
  deleteById: deleteById,
  getBySlug: getBySlug,
  getByCategory: getByCategory,
  getById: getById,
};
