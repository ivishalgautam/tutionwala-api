"use strict";
import constants from "../../lib/constants/index.js";
import sequelizeFwk, { Deferrable } from "sequelize";
const { DataTypes } = sequelizeFwk;

let SubCategoryBoardModel = null;

const init = async (sequelize) => {
  SubCategoryBoardModel = sequelize.define(
    constants.models.SUB_CATEGORY_BOARD_MAPPING_TABLE,
    {
      id: {
        primaryKey: true,
        allowNull: false,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true,
      },
      sub_category_id: {
        type: DataTypes.UUID,
        allowNull: false,
        onDelete: "CASCADE",
        references: {
          model: constants.models.SUB_CATEGORY_TABLE,
          key: "id",
          deferrable: Deferrable.INITIALLY_IMMEDIATE,
        },
      },
      board_id: {
        type: DataTypes.UUID,
        allowNull: false,
        onDelete: "CASCADE",
        references: {
          model: constants.models.BOARD_TABLE,
          key: "id",
          deferrable: Deferrable.INITIALLY_IMMEDIATE,
        },
      },
    },
    {
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  await SubCategoryBoardModel.sync({ alter: true });
};

const create = async (req) => {
  return await SubCategoryBoardModel.create({
    sub_category_id: req.body.sub_category_id,
    board_id: req.body.board_id,
  });
};

const get = async (req) => {
  return await SubCategoryBoardModel.findAll({
    order: [["created_at", "DESC"]],
  });
};

const update = async (req, id) => {
  const [rowCount, rows] = await SubCategoryBoardModel.update(
    {
      name: req.body.name,
    },
    {
      where: {
        id: req.params.id || id,
      },
      returning: true,
      raw: true,
    }
  );

  return rows[0];
};

const getById = async (req, id) => {
  return await SubCategoryBoardModel.findOne({
    where: {
      id: req.params.id || id,
    },
  });
};

const getBySubCategoryId = async (req, id) => {
  return await SubCategoryBoardModel.findAll({
    where: {
      sub_category_id: req?.params?.id || id,
    },
    raw: true,
  });
};

const deleteById = async (req, id) => {
  return await SubCategoryBoardModel.destroy({
    where: { id: req.params.id || id },
  });
};

const deleteBySubCategoryAndBoard = async (subCatId, boardId) => {
  return await SubCategoryBoardModel.destroy({
    where: { sub_category_id: subCatId, board_id: boardId },
  });
};

export default {
  init: init,
  create: create,
  get: get,
  update: update,
  getById: getById,
  deleteById: deleteById,
  deleteBySubCategoryAndBoard: deleteBySubCategoryAndBoard,
  getBySubCategoryId: getBySubCategoryId,
};
