"use strict";
import constants from "../../lib/constants/index.js";
import sequelizeFwk, { Deferrable, Op } from "sequelize";
const { DataTypes } = sequelizeFwk;

let SubjectModel = null;

const init = async (sequelize) => {
  SubjectModel = sequelize.define(
    constants.models.SUBJECT_TABLE,
    {
      id: {
        primaryKey: true,
        allowNull: false,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
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

  await SubjectModel.sync({ alter: true });
};

const create = async (req) => {
  return await SubjectModel.create({
    name: req.body.name,
    board_id: req.body.board_id,
  });
};

const bulkCreate = async (data) => {
  return await SubjectModel.bulkCreate(data);
};

const get = async (req) => {
  return await SubjectModel.findAll({
    order: [["created_at", "DESC"]],
  });
};

const update = async (req, id) => {
  const [rowCount, rows] = await SubjectModel.update(
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
  return await SubjectModel.findOne({
    where: {
      id: req.params.id || id,
    },
  });
};

const getByBoardId = async (req, id) => {
  return await SubjectModel.findAll({
    where: {
      board_id: req.params.id || id,
    },
    attributes: ["id", "name"],
    raw: true,
  });
};

const deleteById = async (req, id) => {
  return await SubjectModel.destroy({
    where: { id: req.params.id || id },
  });
};

const bulkDelete = async (ids) => {
  return await SubjectModel.destroy({
    where: { id: { [Op.in]: ids } },
  });
};

export default {
  init: init,
  create: create,
  bulkCreate: bulkCreate,
  get: get,
  update: update,
  getById: getById,
  getByBoardId: getByBoardId,
  deleteById: deleteById,
  bulkDelete: bulkDelete,
};
