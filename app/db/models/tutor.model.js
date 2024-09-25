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
      languages: {
        type: DataTypes.JSONB,
        defaultValue: [],
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
      profile_picture: {
        type: DataTypes.TEXT,
        defaultValue: "",
      },
      intro_video: {
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
  const tutor = await TutorModel.create({
    user_id: req.body.user_id,
    location: req.body.location,
    intro_video: req.body.intro_video,
  });

  return tutor.dataValues;
};

const getCourses = async (req) => {
  let query = `
  SELECT
      subcat.id,
      subcat.name,
      subcat.slug,
      subcat.image,
      trcrs.id as course_id
    FROM ${constants.models.TUTOR_TABLE} tr
    LEFT JOIN ${constants.models.TUTOR_COURSE_TABLE} trcrs on tr.id = trcrs.tutor_id
    LEFT JOIN ${constants.models.SUB_CATEGORY_TABLE} subcat ON subcat.id = trcrs.course_id
    WHERE tr.user_id = '${req.user_data.id}' 
  `;

  return await TutorModel.sequelize.query(query, {
    type: QueryTypes.SELECT,
    raw: true,
  });
};

const get = async (req, id) => {
  let whereConditions = ["tr.is_profile_completed = true"];
  const queryParams = {};
  console.log({ language: req.query.language });

  const category = req.query.category?.split(" ") ?? [];
  const language = req.query.language ? req.query.language?.split(" ") : [];
  const minAvgRating = req.query.rating ? Number(req.query.rating) : null;
  const gender = req.query.gender ? req.query.gender : null;

  if (category.length) {
    whereConditions.push(`subcat.slug = ANY(:category)`);
    queryParams.category = `{${category.join(",")}}`;
  }

  if (language.length) {
    whereConditions.push(`
      EXISTS (
        SELECT 1
        FROM jsonb_array_elements(tr.languages) AS lang
        WHERE lang->>'name' = ANY(:language)
      )`);
    queryParams.language = `{${language.join(",")}}`;
  }

  if (minAvgRating !== null) {
    whereConditions.push(`
      COALESCE(
        (SELECT AVG(rvw.rating)::FLOAT
          FROM ${constants.models.REVIEW_TABLE} rvw 
          WHERE rvw.tutor_id = tr.id), 0.0
      ) >= :minAvgRating
    `);
    queryParams.minAvgRating = minAvgRating;
  }

  if (gender) {
    whereConditions.push(`usr.gender = :gender`);
    queryParams.gender = gender;
  }

  const limit = req.query.limit ? Number(req.query.limit) : 10;
  const page = req.query.page ? Math.max(1, parseInt(req.query.page)) : 1;
  const offset = (page - 1) * limit;

  let whereClause = "";
  if (whereConditions) {
    whereClause = `WHERE ${whereConditions.join(" AND ")}`;
  }

  let countQuery = `
  SELECT
      COUNT(tr.id) OVER()::integer AS total
    FROM ${constants.models.TUTOR_TABLE} tr
    LEFT JOIN ${constants.models.USER_TABLE} usr ON usr.id = tr.user_id
    LEFT JOIN ${constants.models.TUTOR_COURSE_TABLE} trcrs ON trcrs.tutor_id = tr.id
    LEFT JOIN ${constants.models.SUB_CATEGORY_TABLE} subcat ON subcat.id = trcrs.course_id
    LEFT JOIN ${constants.models.CATEGORY_TABLE} cat ON cat.id = subcat.category_id
    ${whereClause}
    GROUP BY
      tr.id
    LIMIT :limit OFFSET :offset
  `;

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
            'profile_picture', tr.profile_picture,
            'experience', tr.experience,
            'intro_video', tr.intro_video
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
      ) as courses,
      COALESCE(
        (SELECT AVG(rvw.rating)::FLOAT
          FROM ${constants.models.REVIEW_TABLE} rvw 
          WHERE rvw.tutor_id = tr.id
        ), 0.0
      ) as avg_ratings,
      COALESCE(
        (SELECT COUNT(rvw.id)
          FROM ${constants.models.REVIEW_TABLE} rvw
          WHERE rvw.tutor_id = tr.id
        ), 0
      )::integer as total_reviews
    FROM ${constants.models.TUTOR_TABLE} tr
    LEFT JOIN ${constants.models.USER_TABLE} usr ON usr.id = tr.user_id
    LEFT JOIN ${constants.models.TUTOR_COURSE_TABLE} trcrs ON trcrs.tutor_id = tr.id
    LEFT JOIN ${constants.models.SUB_CATEGORY_TABLE} subcat ON subcat.id = trcrs.course_id
    LEFT JOIN ${constants.models.CATEGORY_TABLE} cat ON cat.id = subcat.category_id
    ${whereClause}
    GROUP BY
      tr.id
    LIMIT :limit OFFSET :offset
  `;

  const tutors = await TutorModel.sequelize.query(query, {
    replacements: { ...queryParams, limit, offset },
    type: QueryTypes.SELECT,
    raw: true,
  });
  const count = await TutorModel.sequelize.query(countQuery, {
    replacements: { ...queryParams, limit, offset },
    type: QueryTypes.SELECT,
    raw: true,
  });

  let total = count?.[0]?.total;

  return { tutors, total };
};

const getFilteredTutors = async (req) => {
  console.log(req.body);
  let query = `
  SELECT
      tr.id,
      tr.profile_picture,
      tr.languages,
      tr.location,
      tr.experience,
      tr.created_at,
      usr.fullname,
      COALESCE(JSON_AGG(trcrs.fields) FILTER (WHERE trcrs IS NOT NULL), '[]') AS fields,
      COALESCE(JSON_AGG(trcrs.boards) FILTER (WHERE trcrs IS NOT NULL), '[]') AS boards
    FROM ${constants.models.TUTOR_TABLE} tr
    LEFT JOIN ${constants.models.USER_TABLE} usr ON usr.id = tr.user_id
    LEFT JOIN ${constants.models.TUTOR_COURSE_TABLE} trcrs ON trcrs.tutor_id = tr.id
    LEFT JOIN ${constants.models.SUB_CATEGORY_TABLE} subcat ON subcat.id = trcrs.course_id
    WHERE tr.is_profile_completed = true AND trcrs.tutor_id IS NOT NULL AND  (subcat.slug = '${req.body.subCatSlug}' OR subcat.slug IS NULL)
    GROUP BY tr.id, usr.fullname
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
    const fields = item.fields[0];
    const boards = item.boards[0];
    const languages = item.languages;
    const location = item.location;
    return (
      (fieldOptions.length
        ? fieldOptions.every(({ fieldName, options }) => {
            const field = fields.find(
              (f) =>
                String(f?.fieldName).toLowerCase() ===
                String(fieldName).toLowerCase()
            );
            return (
              field && options.some((option) => field.options.includes(option))
            );
          })
        : true) &&
      (boardOptions.length
        ? boardOptions.some(({ board_name, subjects }) => {
            const board = boards.find((b) => b?.board_name === board_name);
            return board && subjects.length
              ? subjects.some((subject) => board.subjects.includes(subject))
              : false;
          })
        : true) &&
      (languageOptions.length
        ? languageOptions.some((name) => {
            const language = languages?.find(
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
            'profile_picture', tr.profile_picture,
            'experience', tr.experience,
            'intro_video', tr.intro_video
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
      ) as courses,
      COALESCE(
        (SELECT AVG(rvw.rating)::FLOAT
          FROM ${constants.models.REVIEW_TABLE} rvw 
          WHERE rvw.tutor_id = tr.id
        ), 0.0
      ) as avg_ratings,
      COALESCE(
        (SELECT COUNT(rvw.id)
          FROM ${constants.models.REVIEW_TABLE} rvw
          WHERE rvw.tutor_id = tr.id
        ), 0
      )::integer as total_reviews
    FROM ${constants.models.TUTOR_TABLE} tr
    LEFT JOIN ${constants.models.USER_TABLE} usr ON usr.id = tr.user_id
    LEFT JOIN ${
      constants.models.TUTOR_COURSE_TABLE
    } ttrcrs ON ttrcrs.tutor_id = tr.id
    LEFT JOIN ${
      constants.models.SUB_CATEGORY_TABLE
    } subcat ON subcat.id = ttrcrs.course_id
    LEFT JOIN ${
      constants.models.CATEGORY_TABLE
    } cat ON cat.id = subcat.category_id 
    WHERE tr.id = '${req.params?.id || id}'
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
      profile_picture: req.body.profile_picture,
      is_profile_completed: req.body.is_profile_completed,
      intro_video: req.body.intro_video,
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
  getCourses: getCourses,
};
