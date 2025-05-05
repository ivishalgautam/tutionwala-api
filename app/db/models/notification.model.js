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
      onDelete: "CASCADE",
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
    chat_id: {
      type: DataTypes.UUID,
      allowNull: true,
      onDelete: "CASCADE",
      references: {
        model: constants.models.TUTOR_STUDENT_MAP_TABLE,
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
      type: DataTypes.ENUM(["enquiry", "chat", "enquiry_chat", ""]),
      defaultValue: "",
    },
  });

  await NotificationModel.sync({ alter: true });
};

const create = async (req) => {
  return await NotificationModel.create({
    user_id: req.body.user_id,
    enquiry_id: req.body.enquiry_id,
    chat_id: req.body.chat_id,
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
    attributes: ["id", "enquiry_id", "createdAt", "type", "message", "chat_id"],
  });
};

const deleteByEnquiryId = async (req, id) => {
  return await NotificationModel.destroy({
    where: { user_id: req.user_data.id, enquiry_id: req?.params?.id || id },
  });
};

const deleteByChatId = async (req, id) => {
  return await NotificationModel.destroy({
    where: { user_id: req.user_data.id, chat_id: req?.params?.id || id },
  });
};

const deleteByEnquiry = async (req, id) => {
  return await NotificationModel.destroy({
    where: { user_id: req.user_data.id, type: "enquiry" },
  });
};

export default {
  init: init,
  create: create,
  markAsRead: markAsRead,
  getByUserId: getByUserId,
  deleteByEnquiryId: deleteByEnquiryId,
  deleteByChatId: deleteByChatId,
  deleteByEnquiry: deleteByEnquiry,
};
