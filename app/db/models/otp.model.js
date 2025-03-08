"use strict";
import constants from "../../lib/constants/index.js";
import { DataTypes, Deferrable } from "sequelize";

let OtpModel = null;

const init = async (sequelize) => {
  OtpModel = sequelize.define(
    constants.models.OTP_TABLE,
    {
      id: {
        primaryKey: true,
        allowNull: false,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          isEmail: { msg: "Email is not valid!" },
        },
      },
      mobile_number: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      country_code: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      otp: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
    },
    {
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  await OtpModel.sync({ alter: true });
};

const create = async (req) => {
  return await OtpModel.create({
    email: req.body.email,
    mobile_number: req.body.mobile_number,
    country_code: req.body.country_code,
    otp: req.body.otp,
  });
};

const update = async (req) => {
  return await OtpModel.update(
    { otp: req.body.otp },
    {
      where: {
        mobile_number: req.body.mobile_number,
      },
      returning: true,
      raw: true,
    }
  );
};

const getByEmail = async (req) => {
  return await OtpModel.findOne({
    where: {
      email: req.body.email,
    },
    order: [["created_at", "DESC"]],
    raw: true,
    plain: true,
  });
};

const getByMobile = async (req) => {
  return await OtpModel.findOne({
    where: {
      mobile_number: req.body.mobile_number,
    },
    order: [["created_at", "DESC"]],
    raw: true,
    plain: true,
  });
};

const deleteByMobile = async (req) => {
  return await OtpModel.destroy({
    where: { mobile_number: req.body.mobile_number },
  });
};

const deleteByEmail = async (req) => {
  return await OtpModel.destroy({
    where: { email: req.body.email },
  });
};

export default {
  init: init,
  create: create,
  update: update,
  getByEmail: getByEmail,
  getByMobile: getByMobile,
  deleteByMobile: deleteByMobile,
  deleteByEmail: deleteByEmail,
};
