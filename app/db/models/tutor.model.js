"use strict";
import constants from "../../lib/constants/index.js";
import { DataTypes, Deferrable, QueryTypes, where } from "sequelize";
import { ErrorHandler } from "../../helpers/handleError.js";
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
      degree: {
        type: DataTypes.JSONB,
        defaultValue: {},
      },
      coords: {
        type: DataTypes.ARRAY(DataTypes.FLOAT),
        defaultValue: [0, 0],
        validate: {
          bothCoordsOrNone(coords) {
            if ((coords[0] === null) !== (coords[1] === null)) {
              return ErrorHandler({
                message: "Either both latitude and longitude, or neither!",
              });
            }
          },
        },
      },
      enquiry_radius: {
        type: DataTypes.INTEGER, // in km
      },
      class_conduct_mode: {
        type: DataTypes.ENUM({
          values: ["offline", "online", "nearby", "any"],
        }),
        defaultValue: "offline",
        validate: {
          isIn: [["offline", "online", "nearby", "any"]],
        },
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
    coords: req.body.coords,
    enquiry_radius: req.body.enquiry_radius,
    class_conduct_mode: req.body.class_conduct_mode,
    degree: req.body.degree,
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

  const category = req.query.category ? req.query.category?.split(" ") : [];
  const language = req.query.language ? req.query.language?.split(" ") : [];
  const minAvgRating = req.query.rating
    ? req.query.rating.split(" ") ?? []
    : null;
  const gender = req.query.gender ? req.query.gender : null;
  const address = req.query.addr ? req.query.addr : null;
  const lat = req.query.lat ? Number(req.query.lat) : null;
  const lng = req.query.lng ? Number(req.query.lng) : null;
  const isDemo = req.query.demo
    ? req.query.demo === "yes"
      ? true
      : false
    : null;
  const mode = req.query.mode ? req.query.mode : null;
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

  if (minAvgRating?.length) {
    whereConditions.push(`
      COALESCE(
        (SELECT AVG(rvw.rating)::FLOAT
          FROM ${constants.models.REVIEW_TABLE} rvw 
          WHERE rvw.tutor_id = tr.id), 0.0
      ) = ANY(:minAvgRating)
    `);
    queryParams.minAvgRating = `{${minAvgRating.join(",")}}`;
  }

  if (gender) {
    whereConditions.push(`usr.gender = :gender`);
    queryParams.gender = gender;
  }

  if (address && lat && lng) {
    whereConditions.push(`
      ((
        6371 * acos(
          cos(radians(:lat)) * cos(radians(tr.coords[1])) * 
          cos(radians(tr.coords[2]) - radians(:lng)) + 
          sin(radians(:lat)) * sin(radians(tr.coords[1]))
        )
      ) <= tr.enquiry_radius OR tr.location = :address)
    `);
    queryParams.lat = lat;
    queryParams.lng = lng;
    queryParams.address = address;
  }

  if (isDemo) {
    whereConditions.push(`trcrs.is_demo_class = :is_demo_class`);
    queryParams.is_demo_class = isDemo;
  }

  if (mode) {
    whereConditions.push(`ttr.class_conduct_mode = :mode`);
    queryParams.mode = mode;
  }

  const page = req.query.page ? Math.max(1, parseInt(req.query.page)) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : 10;
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
      tr.id, tr.user_id, tr.is_profile_completed, tr.coords, tr.enquiry_radius, tr.created_at, tr.updated_at,
      jsonb_path_query_first(
        json_agg(
          json_build_object(
            'id', usr.id,
            'tutor_id', tr.id,
            'mobile_number', usr.mobile_number,
            'fullname', usr.fullname,
            'email', usr.email,
            'profile_picture', tr.profile_picture,
            'experience', tr.experience,
            'intro_video', tr.intro_video,
            'is_demo_class', trcrs.is_demo_class,
            'course_name', subcat.name
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
  let queryParams = {};
  let whereQuery = `WHERE tr.is_profile_completed = true AND trcrs.tutor_id IS NOT NULL AND  (subcat.slug = '${req.body.subCatSlug}' OR subcat.slug IS NULL)`;
  const lat = req.body.lat ? Number(req.body.lat) : null;
  const lng = req.body.lng ? Number(req.body.lng) : null;
  const address = req.body.location ? req.body.location : null;
  if (address && lat && lng) {
    whereQuery += `
       AND ((
        6371 * acos(
          cos(radians(:lat)) * cos(radians(tr.coords[1])) * 
          cos(radians(tr.coords[2]) - radians(:lng)) + 
          sin(radians(:lat)) * sin(radians(tr.coords[1]))
        )
      ) <= tr.enquiry_radius OR tr.location = :address)
    `;
    queryParams.lat = lat;
    queryParams.lng = lng;
    queryParams.address = address;
  }

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
    ${whereQuery}
    GROUP BY tr.id, usr.fullname
    ORDER BY tr.created_at DESC
  `;

  const data = await TutorModel.sequelize.query(query, {
    type: QueryTypes.SELECT,
    replacements: { ...queryParams },
    raw: true,
  });

  const fieldOptions = req.body.fields ?? [];
  const boardOptions = req.body.boards ?? [];
  const languageOptions = req.body.languages ?? [];
  const filteredData = data.filter((item) => {
    const fields = item.fields[0];
    const boards = item.boards[0];
    const languages = item.languages;
    const location = item.location;
    return (
      (fieldOptions.length
        ? fieldOptions.every(({ fieldName, options }) => {
            if (!options.length) return true;
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
            if (!subjects.length) return true;
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
        : true)
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
      tr.intro_video,
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
      languages: req.body.languages,
      degree: req.body.degree,
      class_conduct_mode: req.body.class_conduct_mode,
      enquiry_radius: req.body.enquiry_radius,
      boards: req.body.boards,
      fields: req.body.fields,
      sub_categories: req.body.sub_categories,
      is_profile_completed: req.body.is_profile_completed,
      curr_step: req.body.curr_step,
      coords: req.body.coords,
      location: req.body.location,

      experience: req.body.experience,
      profile_picture: req.body.profile_picture,
      intro_video: req.body.intro_video,

      adhaar: req.body.adhaar,
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
