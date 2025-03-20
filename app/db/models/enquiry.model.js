"use strict";
import constants from "../../lib/constants/index.js";
import sequelizeFwk, { Deferrable, QueryTypes } from "sequelize";
const { DataTypes } = sequelizeFwk;

let EnquiryModel = null;

const init = async (sequelize) => {
  EnquiryModel = sequelize.define(
    constants.models.ENQUIRY_TABLE,
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
      sub_category_id: {
        type: DataTypes.UUID,
        allowNull: true,
        onDelete: "CASCADE",
        references: {
          model: constants.models.SUB_CATEGORY_TABLE,
          key: "id",
          deferrable: Deferrable.INITIALLY_IMMEDIATE,
        },
      },
      status: {
        type: DataTypes.ENUM({ values: ["converted", "pending"] }),
        defaultValue: "pending",
        validate: {
          isIn: [["converted", "pending"]],
        },
      },
    },
    {
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  await EnquiryModel.sync({ alter: true });
};

const create = async (req) => {
  const data = await EnquiryModel.create({
    tutor_id: req.body.tutor_id,
    student_id: req.body.student_id,
    sub_category_id: req.body.sub_category_id,
  });
  return data.dataValues;
};

const get = async (req) => {
  const { role, id } = req.user_data;
  const queryParams = {};
  let whereQuery = "";
  if (role === "tutor") {
    whereQuery = `WHERE tutusr.id = :userId`;
    queryParams.userId = id;
  }
  if (role === "student") {
    whereQuery = `WHERE stuusr.id = :userId`;
    queryParams.userId = id;
  }

  let query = `
    SELECT
        enq.id,
        enq.created_at,
        enq.status,
        sbcat.name as sub_category_name,
        json_agg(
          json_build_object(
            'user_id', stuusr.id,
            'student_id', stu.id,
            'fullname', stuusr.fullname,
            'profile_picture', stu.profile_picture
          )
        ) as student,
        json_agg(
          json_build_object(
            'user_id', tutusr.id,
            'tutor_id', tut.id,
            'fullname', tutusr.fullname,
            'profile_picture', tut.profile_picture
          )
        ) as tutor,
        COUNT(nt.id)::integer as unread_chat_count
       FROM ${constants.models.ENQUIRY_TABLE} enq
       LEFT JOIN ${constants.models.NOTIFICATION_TABLE} nt ON enq.id = nt.enquiry_id AND nt.user_id = :userId
       LEFT JOIN ${constants.models.SUB_CATEGORY_TABLE} sbcat ON sbcat.id = enq.sub_category_id 
       LEFT JOIN ${constants.models.TUTOR_TABLE} tut ON tut.id = enq.tutor_id 
       LEFT JOIN ${constants.models.USER_TABLE} tutusr ON tutusr.id = tut.user_id 
       LEFT JOIN ${constants.models.STUDENT_TABLE} stu ON stu.id = enq.student_id 
       LEFT JOIN ${constants.models.USER_TABLE} stuusr ON stuusr.id = stu.user_id 
       ${whereQuery}
       GROUP BY enq.id, sbcat.name
  `;

  return await EnquiryModel.sequelize.query(query, {
    replacements: { ...queryParams },
    type: QueryTypes.SELECT,
    raw: true,
  });
};

const update = async (req, id, { transaction }) => {
  const [rowCount, rows] = await EnquiryModel.update(
    {
      status: req.body.status,
    },
    {
      where: {
        id: req.params.id || id,
      },
      returning: true,
      raw: true,
      transaction,
    }
  );

  return rows[0];
};

const getById = async (req, id) => {
  let query = `
    SELECT
        enq.*
       FROM ${constants.models.ENQUIRY_TABLE} enq
       WHERE enq.id = '${req?.params?.id || id}'
       GROUP BY
          enq.id
  `;

  return await EnquiryModel.sequelize.query(query, {
    type: QueryTypes.SELECT,
    raw: true,
    plain: true,
  });
};

const getByStudentAndTutorAndSubCategory = async (
  tutor_id,
  student_id,
  sub_category_id = null
) => {
  return await EnquiryModel.findOne({
    where: {
      tutor_id: tutor_id,
      student_id: student_id,
      sub_category_id: sub_category_id,
    },
  });
};

const getBySubCategoryId = async (req, id) => {
  return await EnquiryModel.findAll({
    where: {
      sub_category_id: req?.params?.id || id,
    },
    raw: true,
  });
};

const getEnquiryUsers = async (enquiryId) => {
  let query = `
  SELECT
      stu.user_id as student_user_id,
      tut.user_id as tutor_user_id,
      tusr.fullname as tutor_name, susr.fullname as student_name,
      tusr.email as tutor_email, susr.email as student_email
    FROM ${constants.models.ENQUIRY_TABLE} enq
    LEFT JOIN ${constants.models.STUDENT_TABLE} stu ON stu.id = enq.student_id
    LEFT JOIN ${constants.models.TUTOR_TABLE} tut ON tut.id = enq.tutor_id
    LEFT JOIN ${constants.models.USER_TABLE} tusr ON tusr.id = tut.user_id
    LEFT JOIN ${constants.models.USER_TABLE} susr ON susr.id = stu.user_id
    WHERE enq.id = :enquiryId
  `;

  return await EnquiryModel.sequelize.query(query, {
    replacements: { enquiryId },
    type: QueryTypes.SELECT,
    raw: true,
    plain: true,
  });
};

const deleteById = async (req, id, { transaction }) => {
  return await EnquiryModel.destroy({
    where: { id: req?.params?.id || id },
    transaction,
  });
};

const deleteBySubCategoryAndBoard = async (subCatId, boardId) => {
  return await EnquiryModel.destroy({
    where: { sub_category_id: subCatId, board_id: boardId },
  });
};

export default {
  init: init,
  create: create,
  get: get,
  update: update,
  getById: getById,
  deleteById: deleteById,
  deleteBySubCategoryAndBoard: deleteBySubCategoryAndBoard,
  getBySubCategoryId: getBySubCategoryId,
  getByStudentAndTutorAndSubCategory: getByStudentAndTutorAndSubCategory,
  getEnquiryUsers: getEnquiryUsers,
};
