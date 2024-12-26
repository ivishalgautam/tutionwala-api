"use strict";
import constants from "../../lib/constants/index.js";
import { DataTypes, Deferrable } from "sequelize";

let StudentModel = null;

const init = async (sequelize) => {
  StudentModel = sequelize.define(
    constants.models.STUDENT_TABLE,
    {
      id: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true,
      },
      user_id: {
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
      fields: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      boards: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      languages: {
        type: DataTypes.JSONB,
        defaultValue: [],
      },
      sub_categories: {
        type: DataTypes.ARRAY(DataTypes.UUID),
        allowNull: false,
      },
      curr_step: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
      },
      profile_picture: {
        type: DataTypes.TEXT,
        defaultValue: "",
      },
      adhaar: {
        type: DataTypes.TEXT,
        defaultValue: "",
      },
      is_profile_completed: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      location: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      coords: {
        type: DataTypes.ARRAY(DataTypes.FLOAT),
        defaultValue: [0, 0],
      },
      academic_details: {
        type: DataTypes.JSONB, // [{institution_name:"", program: "", year:"", grades:"", status:["current","previous"] }]
        defaultValue: [],
      },
    },
    {
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  await StudentModel.sync({ alter: true });
};

const create = async (req) => {
  return await StudentModel.create({
    user_id: req.body?.user_id,
    sub_categories: req.body.sub_categories,
    location: req.body.location,
    coords: req.body.coords,
    academic_details: req.body.academic_details,
  });
};

const get = async () => {
  return await StudentModel.findAll({
    order: [["created_at", "DESC"]],
  });
};

const getById = async (req, id) => {
  return await StudentModel.findOne({
    where: {
      id: req?.params?.id || id,
    },
    raw: true,
  });
};

const update = async (req, id) => {
  const [rowCount, rows] = await StudentModel.update(
    {
      user_id: req.body.user_id,
      fields: req.body.fields,
      boards: req.body.boards,
      languages: req.body.languages,
      sub_categories: req.body.sub_categories,
      curr_step: req.body.curr_step,
      profile_picture: req.body.profile_picture,
      adhaar: req.body.adhaar,
      is_profile_completed: req.body.is_profile_completed,
      coords: req.body.coords,
      academic_details: req.body.academic_details,
    },
    {
      where: {
        id: req?.params?.id || id,
      },
      returning: true,
      raw: true,
      plain: true,
    }
  );

  return rows;
};

const deleteById = async (req, user_id) => {
  return await StudentModel.destroy({
    where: {
      id: req?.params?.id || user_id,
    },
    returning: true,
    raw: true,
  });
};

const getByUserId = async (req, user_id) => {
  return await StudentModel.findOne({
    where: {
      user_id: req?.params?.id || user_id,
    },
    raw: true,
  });
};

export default {
  init: init,
  create: create,
  get: get,
  getById: getById,
  update: update,
  deleteById: deleteById,
  getByUserId: getByUserId,
};
