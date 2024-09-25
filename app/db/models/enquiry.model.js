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
  return await EnquiryModel.create({
    tutor_id: req.body.tutor_id,
    student_id: req.body.student_id,
  });
};

const get = async (req) => {
  const { role, id } = req.user_data;
  let whereQuery = "";
  if (role === "tutor") {
    whereQuery = `WHERE tutusr.id = '${id}'`;
  }
  if (role === "student") {
    whereQuery = `WHERE stuusr.id = '${id}'`;
  }

  let query = `
    SELECT
        enq.id,
        enq.created_at,
        enq.status,
        json_agg(
          json_build_object(
            'user_id', stuusr.id,
            'student_id', stu.id,
            'fullname', stuusr.fullname,
            'profile_picture', stuusr.profile_picture
          )
        ) as student,
        json_agg(
          json_build_object(
            'user_id', tutusr.id,
            'tutor_id', tut.id,
            'fullname', tutusr.fullname,
            'profile_picture', tutusr.profile_picture
          )
        ) as tutor
       FROM ${constants.models.ENQUIRY_TABLE} enq
       LEFT JOIN ${constants.models.TUTOR_TABLE} tut ON tut.id = enq.tutor_id 
       LEFT JOIN ${constants.models.USER_TABLE} tutusr ON tut.user_id = tutusr.id 
       LEFT JOIN ${constants.models.STUDENT_TABLE} stu ON stu.id = enq.student_id 
       LEFT JOIN ${constants.models.USER_TABLE} stuusr ON stuusr.id = stu.user_id 
       ${whereQuery}
       GROUP BY
          enq.id
  `;

  return await EnquiryModel.sequelize.query(query, {
    type: QueryTypes.SELECT,
    raw: true,
  });
};

const update = async (req, id) => {
  const [rowCount, rows] = await EnquiryModel.update(
    {
      name: req.body.name,
      status: req.body.status,
    },
    {
      where: {
        id: req.params.id || id,
      },
      returning: true,
      raw: true,
    }
  );

  return rows[0];
};

const getById = async (req, id) => {
  return await EnquiryModel.findOne({
    where: {
      id: req.params?.id || id,
    },
    raw: true,
  });
};

const getByStudentAndTutor = async (tutor_id, student_id) => {
  return await EnquiryModel.findOne({
    where: {
      tutor_id: tutor_id,
      student_id: student_id,
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

const deleteById = async (req, id) => {
  return await EnquiryModel.destroy({
    where: { id: req.params.id || id },
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
  getByStudentAndTutor: getByStudentAndTutor,
};
