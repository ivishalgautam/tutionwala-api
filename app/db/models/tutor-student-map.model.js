"use strict";
import constants from "../../lib/constants/index.js";
import { DataTypes, Deferrable, Op, QueryTypes } from "sequelize";

let TutorStudentMapModel = null;

const init = async (sequelize) => {
  TutorStudentMapModel = sequelize.define(
    constants.models.TUTOR_STUDENT_MAP_TABLE,
    {
      id: {
        primaryKey: true,
        allowNull: false,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true,
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
      },
    },
    {
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  await TutorStudentMapModel.sync({ alter: true });
};

const create = async (req, { transaction }) => {
  return await TutorStudentMapModel.create(
    {
      tutor_id: req.body.tutor_id,
      student_id: req.body.student_id,
    },
    { transaction }
  );
};

const getById = async (req, id) => {
  return await TutorStudentMapModel.findOne({
    where: {
      id: req?.params?.id || id,
    },
    raw: true,
  });
};

const getByTutorAndStudentId = async (tutor_id, student_id) => {
  return await TutorStudentMapModel.findOne({
    where: {
      tutor_id: tutor_id,
      student_id: student_id,
    },
    raw: true,
  });
};

const getChatUsers = async (id) => {
  let query = `
  SELECT
      stu.user_id as student_user_id,
      tut.user_id as tutor_user_id
    FROM ${constants.models.TUTOR_STUDENT_MAP_TABLE} tsm
    LEFT JOIN ${constants.models.STUDENT_TABLE} stu ON stu.id = tsm.student_id
    LEFT JOIN ${constants.models.TUTOR_TABLE} tut ON tut.id = tsm.tutor_id
    WHERE tsm.id = :id
  `;

  return await TutorStudentMapModel.sequelize.query(query, {
    replacements: { id },
    type: QueryTypes.SELECT,
    raw: true,
    plain: true,
  });
};

const get = async (req) => {
  const { role, id } = req.user_data;
  const whereConditions = [];
  const queryParams = {};

  if (role === "tutor") {
    whereConditions.push("tr.user_id = :userId");
    queryParams.userId = id;
  }

  if (role === "student") {
    whereConditions.push("stu.user_id = :userId");
    queryParams.userId = id;
  }

  const q = req.query.q ? req.query.q : null;

  if (q) {
    if (role === "student") whereConditions.push(`usrtr.fullname ILIKE :query`);
    if (role === "tutor") whereConditions.push(`usrstu.fullname ILIKE :query`);
    queryParams.query = `%${q}%`;
  }

  let whereQuery = "";
  if (whereConditions.length > 0) {
    whereQuery = `WHERE ${whereConditions.join(" AND ")}`;
  }

  const page = req.query.page ? req.query.page : 1;
  const limit = req.query.limit ? req.query.limit : null;
  const offset = (page - 1) * limit;

  let selectFields = "tsm.*";

  if (role === "tutor") {
    selectFields = `
      tsm.*, 
      stu.id AS student_id, 
      usrstu.fullname AS student_name
    `;
  }

  if (role === "student") {
    selectFields = `
      tsm.*, 
      tr.id AS tutor_id, 
      usrtr.fullname AS tutor_name
    `;
  }

  let query = `
  SELECT
      ${selectFields}
    FROM ${constants.models.TUTOR_STUDENT_MAP_TABLE} tsm
    LEFT JOIN ${constants.models.STUDENT_TABLE} stu ON stu.id = tsm.student_id
    LEFT JOIN ${constants.models.USER_TABLE} usrstu ON usrstu.id = stu.user_id
    LEFT JOIN ${constants.models.TUTOR_TABLE} tr ON tr.id = tsm.tutor_id
    LEFT JOIN ${constants.models.USER_TABLE} usrtr ON usrtr.id = tr.user_id
    ${whereQuery}
    LIMIT :limit OFFSET :offset
  `;

  let countQuery = `
  SELECT
      COUNT(tsm.id) OVER()::integer as total 
    FROM ${constants.models.TUTOR_STUDENT_MAP_TABLE} tsm
    LEFT JOIN ${constants.models.STUDENT_TABLE} stu ON stu.id = tsm.student_id
    LEFT JOIN ${constants.models.USER_TABLE} usrstu ON usrstu.id = stu.user_id
    LEFT JOIN ${constants.models.TUTOR_TABLE} tr ON tr.id = tsm.tutor_id
    LEFT JOIN ${constants.models.USER_TABLE} usrtr ON usrtr.id = tr.user_id
    ${whereQuery}
  `;

  const data = await TutorStudentMapModel.sequelize.query(query, {
    type: QueryTypes.SELECT,
    replacements: { ...queryParams, limit, offset },
    raw: true,
  });

  const count = await TutorStudentMapModel.sequelize.query(countQuery, {
    type: QueryTypes.SELECT,
    replacements: { ...queryParams },
    raw: true,
    plain: true,
  });

  return { data, total: count?.total ?? 0 };
};

const deleteById = async (req, id) => {
  return await TutorStudentMapModel.destroy({
    where: {
      id: req?.params?.id || id,
    },
    raw: true,
  });
};

const getByTutorId = async (tutorId) => {
  return await TutorStudentMapModel.findOne({
    where: {
      tutor_id: tutorId,
    },
    raw: true,
  });
};

export default {
  init: init,
  create: create,
  getByTutorId: getByTutorId,
  getById: getById,
  deleteById: deleteById,
  get: get,
  getByTutorAndStudentId: getByTutorAndStudentId,
  getChatUsers: getChatUsers,
};
