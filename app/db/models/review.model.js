"use strict";
import constants from "../../lib/constants/index.js";
import sequelizeFwk, { Deferrable, Op, QueryTypes } from "sequelize";
const { DataTypes } = sequelizeFwk;

let ReviewModel = null;

const init = async (sequelize) => {
  ReviewModel = sequelize.define(
    constants.models.REVIEW_TABLE,
    {
      id: {
        primaryKey: true,
        allowNull: false,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true,
      },
      rating: {
        type: DataTypes.INTEGER,
        allowNull: false,
        validate: {
          max: 5,
        },
      },
      review: {
        type: DataTypes.TEXT,
        allowNull: false,
        validate: {
          len: {
            args: [20],
            msg: "Review must be more than 20 characters long!",
          },
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

  await ReviewModel.sync({ alter: true });
};

const create = async (req) => {
  return await ReviewModel.create({
    rating: req.body.rating,
    review: req.body.review,
    tutor_id: req.body.tutor_id,
    student_id: req.body.student_id,
  });
};

const get = async (req) => {
  const whereConditions = [];
  let queryParams = {};

  const minRating = Number(req.query.minRating) ?? 4;
  if (minRating) {
    whereConditions.push(`rvw.rating >= :minRating`);
    queryParams.minRating = minRating;
  }

  const limit = req.query.limit ? Number(req.query.limit) : null;
  const page = req.query.page ? Math.max(1, parseInt(req.query.page)) : 1;
  const offset = (page - 1) * limit;

  let whereClause = "";

  if (whereConditions.length > 0) {
    whereClause = `WHERE ${whereConditions.join(" AND ")}`;
  }

  let query = `
  SELECT
      rvw.id,
      rvw.rating,
      rvw.review,
      rvw.created_at,
      ttrusr.fullname as tutor_name,
      ttr.profile_picture as tutor_profile,
      stuusr.fullname as student_name
    FROM ${constants.models.REVIEW_TABLE} rvw
    LEFT JOIN ${constants.models.TUTOR_TABLE} ttr ON ttr.id = rvw.tutor_id
    LEFT JOIN ${constants.models.STUDENT_TABLE} stu ON stu.id = rvw.student_id
    LEFT JOIN ${constants.models.USER_TABLE} ttrusr ON ttrusr.id = ttr.user_id 
    LEFT JOIN ${constants.models.USER_TABLE} stuusr ON stuusr.id = stu.user_id 
    ${whereClause}
    LIMIT :limit OFFSET :offset
  `;
  return await ReviewModel.sequelize.query(query, {
    replacements: { ...queryParams, limit, offset },
    type: QueryTypes.SELECT,
    raw: true,
  });
};

const getByStudentId = async (req, id) => {
  return await ReviewModel.findAll({
    where: {
      student_id: req.params.id || id,
    },
    raw: true,
  });
};

const getByStudentAndTutor = async (req) => {
  return await ReviewModel.findOne({
    where: {
      student_id: req.body.student_id,
      tutor_id: req.body.tutor_id,
      enquiry_id: req.body.enquiry_id,
    },
    raw: true,
  });
};

const getByTutorId = async (req, id) => {
  return await ReviewModel.findAll({
    where: {
      tutor_id: req.params.id || id,
    },
    raw: true,
  });
};

const deleteById = async (req, id) => {
  return await ReviewModel.destroy({
    where: { id: req.params.id || id },
  });
};

export default {
  init: init,
  create: create,
  get: get,
  getByStudentId: getByStudentId,
  getByTutorId: getByTutorId,
  deleteById: deleteById,
  getByStudentAndTutor: getByStudentAndTutor,
};
