"use strict";
import { DataTypes, Deferrable } from "sequelize";
import constants from "../../lib/constants/index.js";

let NotificationModel = null;

const init = async (sequelize) => {
  NotificationModel = sequelize.define(constants.models.NOTIFICATION_TABLE, {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.UUID,
      allowNull: false,
      references: {
        model: constants.models.USER_TABLE,
        key: "id",
      },
    },
    enquiry_id: {
      type: DataTypes.UUID,
      allowNull: true,
      onDelete: "CASCADE",
      references: {
        model: constants.models.ENQUIRY_TABLE,
        key: "id",
        deferrable: Deferrable.INITIALLY_IMMEDIATE,
      },
    },
    message: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    is_read: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    type: {
      type: DataTypes.ENUM(["enquiry", ""]),
      defaultValue: "",
    },
  });

  await NotificationModel.sync({ alter: true });
};

const create = async (req) => {
  return await NotificationModel.create({
    user_id: req.body.user_id,
    enquiry_id: req.body.enquiry_id,
    message: req.body.message,
    type: req.body.type,
  });
};

const markAsRead = async (req, id, { transaction }) => {
  return await NotificationModel.update(
    { is_read: true },
    {
      where: { id: req?.params?.id || id },
      transaction,
    }
  );
};

const getByUserId = async (req, id) => {
  return await NotificationModel.findAll({
    where: { is_read: false, user_id: req.user_data.id || id },
    attributes: ["id", "enquiry_id", "createdAt", "type", "message"],
  });
};

const deleteByEnquiryId = async (req, id) => {
  return await NotificationModel.destroy({
    where: { user_id: req.user_data.id, enquiry_id: req?.params?.id || id },
  });
};

export default {
  init: init,
  create: create,
  markAsRead: markAsRead,
  getByUserId: getByUserId,
  deleteByEnquiryId: deleteByEnquiryId,
};
