"use strict";
import constants from "../../lib/constants/index.js";
import { DataTypes, Deferrable, Op } from "sequelize";

let TutorCourseModel = null;

const init = async (sequelize) => {
  TutorCourseModel = sequelize.define(
    constants.models.TUTOR_COURSE_TABLE,
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
      course_id: {
        type: DataTypes.UUID,
        allowNull: false,
        onDelete: "CASCADE",
        references: {
          model: constants.models.SUB_CATEGORY_TABLE,
          key: "id",
          deferrable: Deferrable.INITIALLY_IMMEDIATE,
        },
      },
      fields: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      boards: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
    },
    {
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  await TutorCourseModel.sync({ alter: true });
};

const create = async (req) => {
  return await TutorCourseModel.create({
    tutor_id: req.body.tutor_id,
    course_id: req.body.course_id,
    fields: req.body.fields,
    boards: req.body.boards,
  });
};

const getById = async (req, id) => {
  return await TutorCourseModel.findOne({
    where: {
      id: req?.params?.id || id,
    },
    raw: true,
  });
};

const deleteById = async (req, id) => {
  return await TutorCourseModel.destroy({
    where: {
      id: req?.params?.id || id,
    },
    raw: true,
  });
};

const findByTutorAndCourseId = async (tutorId, courseId) => {
  return await TutorCourseModel.findOne({
    where: {
      tutor_id: tutorId,
      course_id: courseId,
    },
    raw: true,
  });
};

const findFirstUserCourse = async (tutorId) => {
  return await TutorCourseModel.findOne({
    where: {
      tutor_id: tutorId,
    },
    order: [["created_at", "asc"]],
    raw: true,
  });
};

const update = async (req, id) => {
  const tcId = req?.params?.id || id;
  // console.log("body", req.body, "id", tcId);
  const [rowCount, rows] = await TutorCourseModel.update(
    {
      fields: req.body.fields,
      boards: req.body.boards,
    },
    {
      where: {
        id: tcId,
      },
      returning: true,
      plain: true,
      raw: true,
    }
  );
  return rows;
};

export default {
  init: init,
  create: create,
  update: update,
  findFirstUserCourse: findFirstUserCourse,
  findByTutorAndCourseId: findByTutorAndCourseId,
  getById: getById,
  deleteById: deleteById,
};
