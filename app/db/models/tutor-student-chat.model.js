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
  const { role } = req.user_data;

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

  let selectQuery =
    role === "tutor" ? `stuusr.fullname as name` : `tutusr.fullname as name`;

  let detailsQuery = `
  SELECT
    ${selectQuery}
    FROM ${constants.models.TUTOR_STUDENT_MAP_TABLE} tsm
    LEFT JOIN ${constants.models.STUDENT_TABLE} stu ON stu.id = tsm.student_id
    LEFT JOIN ${constants.models.TUTOR_TABLE} tut ON tut.id = tsm.tutor_id
    LEFT JOIN ${constants.models.USER_TABLE} stuusr ON stuusr.id = stu.user_id
    LEFT JOIN ${constants.models.USER_TABLE} tutusr ON tutusr.id = tut.user_id
    WHERE tsm.id = :tutor_student_map_id
  `;

  const chats = await TutorStudentChatModel.sequelize.query(query, {
    type: QueryTypes.SELECT,
    replacements: {
      currUserId: req.user_data.id,
      tutor_student_map_id: req.params.id || id,
    },
    raw: true,
  });

  const details = await TutorStudentChatModel.sequelize.query(detailsQuery, {
    type: QueryTypes.SELECT,
    replacements: {
      tutor_student_map_id: req.params.id || id,
    },
    raw: true,
    plain: true,
  });

  return { chats, name: details?.name ?? "" };
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
