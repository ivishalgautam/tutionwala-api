"use strict";
import constants from "../../lib/constants/index.js";
import { DataTypes, Deferrable, QueryTypes } from "sequelize";

let TutorStudentChatModel = null;

const init = async (sequelize) => {
  TutorStudentChatModel = sequelize.define(
    constants.models.TUTOR_STUDENT_CHAT_TABLE,
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
      tutor_student_map_id: {
        type: DataTypes.UUID,
        allowNull: false,
        onDelete: "CASCADE",
        references: {
          model: constants.models.TUTOR_STUDENT_MAP_TABLE,
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

  await TutorStudentChatModel.sync({ alter: true });
};

const create = async (req) => {
  return await TutorStudentChatModel.create({
    content: req.body.content,
    tutor_student_map_id: req.body.tutor_student_map_id,
    sender_id: req.user_data.id,
  });
};

const update = async (req, id) => {
  return await TutorStudentChatModel.update(
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
  return await TutorStudentChatModel.findOne({
    where: { id: req.params.id || id },
    raw: true,
  });
};

const getByMapId = async (req, id) => {
  let query = `
   SELECT 
      c.id, c.content, is_deleted,
    CASE 
      WHEN c.sender_id = :currUserId THEN true
      ELSE false
    END AS admin
    FROM ${constants.models.TUTOR_STUDENT_CHAT_TABLE} c
    LEFT JOIN ${constants.models.USER_TABLE} usr ON usr.id = c.sender_id
    WHERE c.tutor_student_map_id = :tutor_student_map_id;
`;

  return await TutorStudentChatModel.sequelize.query(query, {
    type: QueryTypes.SELECT,
    replacements: {
      currUserId: req.user_data.id,
      tutor_student_map_id: req.params.id || id,
    },
    raw: true,
  });
};

const deleteById = async (req, id) => {
  return await TutorStudentChatModel.update(
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
  getByMapId: getByMapId,
};
