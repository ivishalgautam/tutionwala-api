"use strict";
import constants from "../../lib/constants/index.js";
import { DataTypes, Deferrable, QueryTypes } from "sequelize";

let EnquiryChatModel = null;

const init = async (sequelize) => {
  EnquiryChatModel = sequelize.define(
    constants.models.ENQUIRY_CHAT_TABLE,
    {
      id: {
        primaryKey: true,
        allowNull: false,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true,
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notNull: { msg: "Content is required!" },
          notEmpty: { msg: "Content is required!" },
        },
      },
      enquiry_id: {
        type: DataTypes.UUID,
        allowNull: false,
        onDelete: "CASCADE",
        references: {
          model: constants.models.ENQUIRY_TABLE,
          key: "id",
          deferrable: Deferrable.INITIALLY_IMMEDIATE,
        },
        validate: {
          isUUID: 4,
        },
      },
      sender_id: {
        type: DataTypes.UUID,
        allowNull: false,
        onDelete: "CASCADE",
        references: {
          model: constants.models.USER_TABLE,
          key: "id",
          deferrable: Deferrable.INITIALLY_IMMEDIATE,
        },
        validate: {
          isUUID: 4,
        },
      },
      is_deleted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  await EnquiryChatModel.sync({ alter: true });
};

const create = async (req) => {
  return await EnquiryChatModel.create({
    content: req.body.content,
    enquiry_id: req.body.enquiry_id,
    sender_id: req.user_data.id,
  });
};

const update = async (req, id) => {
  return await EnquiryChatModel.update(
    { content: req.body.content },
    {
      where: {
        id: req.params.id || id,
      },
      returning: true,
      raw: true,
    }
  );
};

const getById = async (req, id) => {
  return await EnquiryChatModel.findOne({
    where: { id: req.params.id || id },
    raw: true,
  });
};

const getByEnquiryId = async (req, id) => {
  let query = `
   SELECT 
        c.id, c.content, is_deleted,
    CASE 
        WHEN c.sender_id = :currUserId THEN true
        ELSE false
    END AS admin
    FROM ${constants.models.ENQUIRY_CHAT_TABLE} c
    LEFT JOIN ${constants.models.USER_TABLE} usr ON usr.id = c.sender_id
    WHERE c.enquiry_id = :enquiry_id;
`;

  return await EnquiryChatModel.sequelize.query(query, {
    type: QueryTypes.SELECT,
    replacements: {
      currUserId: req.user_data.id,
      enquiry_id: req.params.id || id,
    },
    raw: true,
  });
};

const deleteById = async (req, id) => {
  return await EnquiryChatModel.update(
    { is_deleted: true },
    {
      where: { id: req.params.id || id },
    }
  );
};

export default {
  init: init,
  create: create,
  update: update,
  deleteById: deleteById,
  getById: getById,
  getByEnquiryId: getByEnquiryId,
};
