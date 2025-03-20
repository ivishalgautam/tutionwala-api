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
  const { role } = req.user_data;

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

  let selectQuery =
    role === "tutor" ? `stuusr.fullname as name` : `tutusr.fullname as name`;

  let detailsQuery = `
SELECT
    ${selectQuery}
  FROM ${constants.models.ENQUIRY_TABLE} enq
  LEFT JOIN ${constants.models.STUDENT_TABLE} stu ON stu.id = enq.student_id
  LEFT JOIN ${constants.models.TUTOR_TABLE} tut ON tut.id = enq.tutor_id
  LEFT JOIN ${constants.models.USER_TABLE} stuusr ON stuusr.id = stu.user_id
  LEFT JOIN ${constants.models.USER_TABLE} tutusr ON tutusr.id = tut.user_id
  WHERE enq.id = :enquiry_id
`;

  const chats = await EnquiryChatModel.sequelize.query(query, {
    type: QueryTypes.SELECT,
    replacements: {
      currUserId: req.user_data.id,
      enquiry_id: req.params.id || id,
    },
    raw: true,
  });

  const details = await EnquiryChatModel.sequelize.query(detailsQuery, {
    type: QueryTypes.SELECT,
    replacements: {
      enquiry_id: req.params.id || id,
    },
    raw: true,
    plain: true,
  });

  return { chats, name: details?.name ?? "" };
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
