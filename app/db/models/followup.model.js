"use strict";
import constants from "../../lib/constants/index.js";
import { DataTypes, Deferrable, QueryTypes } from "sequelize";

let FollowUpModel = null;

const init = async (sequelize) => {
  FollowUpModel = sequelize.define(
    constants.models.FOLLOW_UP_TABLE,
    {
      id: {
        primaryKey: true,
        allowNull: false,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true,
      },
      title: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notNull: { msg: "Title is required!" },
          notEmpty: { msg: "Title is required!" },
        },
      },
      content: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          notNull: { msg: "Content is required!" },
          notEmpty: { msg: "Content is required!" },
        },
      },
      date: {
        type: DataTypes.DATE,
        allowNull: false,
        validate: {
          isDate: { msg: "Please select valid date!" },
          notNull: { msg: "Please select valid date!" },
          notEmpty: { msg: "Please select valid date!" },
        },
      },
      tutor_id: {
        type: DataTypes.UUID,
        allowNull: false,
        onDelete: "CASCADE",
        references: {
          model: constants.models.TUTOR_TABLE,
          key: "id",
          deferrable: Deferrable.INITIALLY_IMMEDIATE,
        },
        validate: {
          isUUID: 4,
        },
      },
      student_id: {
        type: DataTypes.UUID,
        allowNull: false,
        onDelete: "CASCADE",
        references: {
          model: constants.models.STUDENT_TABLE,
          key: "id",
          deferrable: Deferrable.INITIALLY_IMMEDIATE,
        },
        validate: {
          isUUID: 4,
        },
      },
      is_completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
    },
    {
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  await FollowUpModel.sync({ alter: true });
};

const create = async (req) => {
  return await FollowUpModel.create({
    title: req.body.title,
    content: req.body.content,
    date: req.body.date,
    student_id: req.body.student_id,
    tutor_id: req.user_data.id,
  });
};

const update = async (req, id) => {
  return await FollowUpModel.update(
    {
      title: req.body.title,
      content: req.body.content,
      date: req.body.date,
      is_completed: req.body.is_completed,
    },
    {
      where: {
        id: req.params.id || id,
      },
      returning: true,
      raw: true,
    }
  );
};

const get = async (req) => {
  let whereQuery = "";
  if (req.user_data.role === "customer") {
    whereQuery = `fu.lead_id = '${req.user_data.id}'`;
  }

  let query = `
    SELECT
      *
      FROM followups fu
      ${whereQuery}
    `;

  return await FollowUpModel.sequelize.query(query, {
    type: QueryTypes.SELECT,
    raw: true,
  });
};

const getById = async (req, id) => {
  return await FollowUpModel.findOne({
    where: { id: req.params.id || id },
    raw: true,
  });
};

const getByStudentId = async (req, id) => {
  return await FollowUpModel.findAll({
    where: { student_id: req.params.id || id },
    order: [["created_at", "DESC"]],
    attributes: {
      exclude: ["tutor_id", "student_id", "updated_at"],
    },
    raw: true,
  });
};

const getByUserId = async (req, lead_id) => {
  let query = `
      SELECT
        *
        FROM followups fu
        fu.sales_person_id = '${req.user_data.id}' AND fu.lead_id = '${
    req.params.id || lead_id
  }'
      `;

  return await FollowUpModel.sequelize.query(query, {
    type: QueryTypes.SELECT,
    raw: true,
  });
};

const deleteById = async (req, id) => {
  return await FollowUpModel.destroy({
    where: { id: req.params.id || id },
  });
};

export default {
  init: init,
  create: create,
  update: update,
  getById: getById,
  getByUserId: getByUserId,
  deleteById: deleteById,
  getByStudentId: getByStudentId,
  get: get,
};
