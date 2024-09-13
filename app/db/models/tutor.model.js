"use strict";
import constants from "../../lib/constants/index.js";
import hash from "../../lib/encryption/index.js";
import { DataTypes, Deferrable, QueryTypes } from "sequelize";
import { Op } from "sequelize";
import moment from "moment";
import { isValidDegree, isValidLanguage } from "../../lib/validations/index.js";

let TutorModel = null;

const init = async (sequelize) => {
  TutorModel = sequelize.define(
    constants.models.TUTOR_TABLE,
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
      experience: {
        type: DataTypes.TEXT,
        defaultValue: "",
      },
      curr_step: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
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
    },
    {
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  await TutorModel.sync({ alter: true });
};

const create = async (req) => {
  return await TutorModel.create({
    user_id: req.body.user_id,
    sub_categories: req.body.sub_categories,
    location: req.body.location,
  });
};

const get = async () => {
  return await TutorModel.findAll({
    order: [["created_at", "DESC"]],
  });
};

const getFilteredTutors = async (req) => {
  let query = `
  SELECT
      tr.id,
      tr.fields,
      tr.boards,
      usr.profile_picture,
      tr.languages,
      tr.location,
      tr.experience,
      usr.fullname
    FROM ${constants.models.TUTOR_TABLE} tr
    LEFT JOIN ${constants.models.USER_TABLE} usr ON usr.id = tr.user_id
    WHERE tr.is_profile_completed = true
    ORDER BY tr.created_at DESC
  `;
  const data = await TutorModel.sequelize.query(query, {
    type: QueryTypes.SELECT,
    raw: true,
  });

  const fieldOptions = req.body.fields ?? [];
  const boardOptions = req.body.boards ?? [];
  const languageOptions = req.body.languages ?? [];
  const enqLocation = req.body.location;

  const filteredData = data.filter((item) => {
    const fields = item.fields;
    const boards = item.boards;
    const languages = item.languages;
    const location = item.location;

    return (
      (fieldOptions.length
        ? fieldOptions.some(({ fieldName, options }) => {
            const field = fields.find((f) => f.fieldName === fieldName);
            return (
              field && options.some((option) => field.options.includes(option))
            );
          })
        : true) &&
      (boardOptions.length
        ? boardOptions.some(({ board_name, subjects }) => {
            const board = boards.find((b) => b.board_name === board_name);
            return board && subjects.length
              ? subjects.some((subject) => board.subjects.includes(subject))
              : false;
          })
        : true) &&
      (languageOptions.length
        ? languageOptions.some((name) => {
            const language = languages.find(
              (l) => String(l.name).toLowerCase() === String(name).toLowerCase()
            );
            return language;
          })
        : true) &&
      (enqLocation ? enqLocation === location : true)
    );
  });

  return filteredData;
};

const getById = async (req, id) => {
  let query = `
  SELECT
      tr.id,
      tr.user_id,
      tr.is_profile_completed,
      tr.created_at,
      tr.updated_at,
        jsonb_path_query_first(
          json_agg(
            json_build_object(
              'id', usr.id,
              'mobile_number', usr.mobile_number,
              'fullname', usr.fullname,
              'email', usr.email,
              'profile_picture', usr.profile_picture,
              'experience', tr.experience
            )
          )::jsonb, '$[0]'
      ) as user,
      json_agg(
        json_build_object(
          'id', subcat.id,
          'name', subcat.name,
          'image', subcat.image,
          'slug', subcat.slug,
          'category_name', cat.name
        )
      ) as courses
    FROM ${constants.models.TUTOR_TABLE} tr
    LEFT JOIN ${constants.models.USER_TABLE} usr ON usr.id = tr.user_id
    LEFT JOIN ${
      constants.models.SUB_CATEGORY_TABLE
    } subcat ON subcat.id = ANY(tr.sub_categories)
    LEFT JOIN ${
      constants.models.CATEGORY_TABLE
    } cat ON cat.id = subcat.category_id 
    WHERE tr.id = '${req.params.id || id}'
    GROUP BY
      tr.id
  `;

  return await TutorModel.sequelize.query(query, {
    type: QueryTypes.SELECT,
    raw: true,
    plain: true,
  });
};

const getByUserId = async (req, user_id) => {
  return await TutorModel.findOne({
    where: {
      user_id: req?.user_data?.id || user_id,
    },
    raw: true,
  });
};

const update = async (req, id) => {
  const [rowCount, rows] = await TutorModel.update(
    {
      user_id: req.body.user_id,
      fields: req.body.fields,
      boards: req.body.boards,
      languages: req.body.languages,
      sub_categories: req.body.sub_categories,
      experience: req.body.experience,
      curr_step: req.body.curr_step,
      adhaar: req.body.adhaar,
      is_profile_completed: req.body.is_profile_completed,
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
  return await TutorModel.destroy({
    where: {
      id: req?.params?.id || user_id,
    },
    returning: true,
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
  getFilteredTutors: getFilteredTutors,
};
