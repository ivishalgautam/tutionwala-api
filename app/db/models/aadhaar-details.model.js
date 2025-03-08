"use strict";
import constants from "../../lib/constants/index.js";
import sequelizeFwk, { Deferrable, Op } from "sequelize";
const { DataTypes } = sequelizeFwk;

let AadhaarModel = null;

const init = async (sequelize) => {
  AadhaarModel = sequelize.define(
    constants.models.AADHAAR_TABLE,
    {
      id: {
        primaryKey: true,
        allowNull: false,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true,
      },
      details: {
        type: DataTypes.JSONB,
        allowNull: false,
      },
      customer_aadhaar_number: {
        type: DataTypes.STRING,
        allowNull: false,
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

  await AadhaarModel.sync({ alter: true });
};

const create = async (req) => {
  return await AadhaarModel.create({
    user_id: req.user_data.id,
    details: req.body.details,
    customer_aadhaar_number: req.body.customer_aadhaar_number,
  });
};

const get = async (req) => {
  return await AadhaarModel.findAll({
    order: [["created_at", "DESC"]],
  });
};

const update = async (req, id) => {
  const [rowCount, rows] = await AadhaarModel.update(
    {
      details: req.body.details,
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
  return await AadhaarModel.findOne({
    where: {
      id: req.params.id || id,
    },
  });
};

const getByUserId = async (userId) => {
  return await AadhaarModel.findOne({
    where: {
      user_id: userId,
    },
  });
};

const deleteById = async (req, id) => {
  return await AadhaarModel.destroy({
    where: { id: req.params.id || id },
  });
};

export default {
  init: init,
  create: create,
  get: get,
  update: update,
  getById: getById,
  getByUserId: getByUserId,
  deleteById: deleteById,
};
