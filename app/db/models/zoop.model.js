"use strict";
import constants from "../../lib/constants/index.js";
import sequelizeFwk, { Deferrable, Op } from "sequelize";
const { DataTypes } = sequelizeFwk;

let ZoopModel = null;

const init = async (sequelize) => {
  ZoopModel = sequelize.define(
    constants.models.ZOOP_TABLE,
    {
      request_id: {
        primaryKey: true,
        allowNull: false,
        type: DataTypes.UUID,
        unique: true,
      },
      user_id: {
        type: DataTypes.UUID,
        allowNull: false,
        onDelete: "CASCADE",
        references: {
          model: constants.models.USER_TABLE,
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

  await ZoopModel.sync({ alter: true });
};

const create = async (req) => {
  return await ZoopModel.create({
    user_id: req.user_data.id,
    request_id: req.body.request_id,
  });
};

const get = async (req) => {
  return await ZoopModel.findAll({
    order: [["created_at", "DESC"]],
  });
};

const getByRequestId = async (request_id) => {
  return await ZoopModel.findOne({
    where: {
      request_id: request_id,
    },
  });
};

const getByUserId = async (userId) => {
  return await ZoopModel.findOne({
    where: {
      user_id: userId,
    },
  });
};

const deleteByRequestId = async (request_id) => {
  return await ZoopModel.destroy({
    where: { request_id: request_id },
  });
};

export default {
  init: init,
  create: create,
  get: get,
  getByRequestId: getByRequestId,
  getByUserId: getByUserId,
  deleteByRequestId: deleteByRequestId,
};
