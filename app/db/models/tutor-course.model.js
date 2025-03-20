"use strict";
import constants from "../../lib/constants/index.js";
import { DataTypes, Deferrable, Op, QueryTypes } from "sequelize";

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
      is_demo_class: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      class_conduct_mode: {
        type: DataTypes.ARRAY(DataTypes.STRING),
        validate: {
          isValidModes(value) {
            if (["offline", "online"].includes(value)) {
              throw new Error("Not valid modes allowed: 'online', 'offline'!");
            }
          },
        },
      },
      budgets: {
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
    is_demo_class: req.body.is_demo_class,
    budgets: req.body.budgets,
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

const getByCourseId = async (courseId) => {
  return await TutorCourseModel.findOne({
    where: {
      course_id: courseId,
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
  const query = `
  SELECT 
      tc.*,
      sbct.is_boards
    FROM ${constants.models.TUTOR_COURSE_TABLE} tc
    LEFT JOIN ${constants.models.SUB_CATEGORY_TABLE} sbct ON sbct.id = tc.course_id
    WHERE tc.tutor_id = :tutor_id AND tc.course_id = :course_id
  `;

  // const data = await TutorCourseModel.findOne({
  //   where: {
  //     tutor_id: tutorId,
  //     course_id: courseId,
  //   },
  //   raw: true,
  // });
  const data = await TutorCourseModel.sequelize.query(query, {
    type: QueryTypes.SELECT,
    replacements: {
      tutor_id: tutorId,
      course_id: courseId,
    },
    raw: true,
    plain: true,
  });

  return data;
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
      is_demo_class: req.body.is_demo_class,
      budgets: req.body.budgets,
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
  getByCourseId: getByCourseId,
  deleteById: deleteById,
};
