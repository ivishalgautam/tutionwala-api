"use strict";
import constants from "../../lib/constants/index.js";
import { DataTypes, Deferrable } from "sequelize";

let FCMModel = null;

const init = async (sequelize) => {
  FCMModel = sequelize.define(
    constants.models.FCM_TABLE,
    {
      id: {
        primaryKey: true,
        allowNull: false,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
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
      fcm_token: {
        type: DataTypes.STRING,
        allowNull: false,
      },
    },
    {
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  await FCMModel.sync({ alter: true });
};

const create = async (user_id, fcm_token) => {
  return await FCMModel.create({
    user_id: user_id,
    fcm_token: fcm_token,
  });
};

const updateByUser = async (user_id, fcm_token) => {
  return await FCMModel.update(
    { fcm_token: fcm_token },
    { where: { user_id: user_id } }
  );
};

const getByFCM = async (fcm_token) => {
  return await FCMModel.findAll({
    where: {
      fcm_token: fcm_token,
    },
    order: [["created_at", "DESC"]],
    raw: true,
    plain: true,
  });
};

const getByUser = async (user_id) => {
  return await FCMModel.findOne({
    where: {
      user_id: user_id,
    },
    order: [["created_at", "DESC"]],
    raw: true,
  });
};

const deleteById = async (req) => {
  return await FCMModel.destroy({
    where: { id: req.body.id },
  });
};

export default {
  init: init,
  create: create,
  getByFCM: getByFCM,
  getByUser: getByUser,
  deleteById: deleteById,
  updateByUser: updateByUser,
};
