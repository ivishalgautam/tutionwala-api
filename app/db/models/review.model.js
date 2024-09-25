"use strict";
import constants from "../../lib/constants/index.js";
import sequelizeFwk, { Deferrable, Op } from "sequelize";
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
      enquiry_id: {
        type: DataTypes.UUID,
        allowNull: false,
        onDelete: "CASCADE",
        references: {
          model: constants.models.ENQUIRY_TABLE,
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
    enquiry_id: req.body.enquiry_id,
  });
};

const get = async (req) => {
  return await ReviewModel.findAll({
    order: [["created_at", "DESC"]],
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

const getByEnquiryAndStudentAndTutor = async (req) => {
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
  getByEnquiryAndStudentAndTutor: getByEnquiryAndStudentAndTutor,
};
