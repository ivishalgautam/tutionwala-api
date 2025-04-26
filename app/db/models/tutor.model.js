"use strict";
import constants from "../../lib/constants/index.js";
import { DataTypes, Deferrable, QueryTypes } from "sequelize";
import { ErrorHandler } from "../../helpers/handleError.js";
import { randomBytesGenerator } from "../../lib/encryption/index.js";
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
      type: {
        type: DataTypes.ENUM(["institute", "individual"]),
        defaultValue: "individual",
      },
      institute_contact_name: {
        type: DataTypes.STRING,
      },
      institute_name: {
        type: DataTypes.STRING,
      },
      experience: {
        type: DataTypes.TEXT,
        defaultValue: "",
      },
      curr_step: {
        type: DataTypes.INTEGER,
        defaultValue: 1,
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
        defaultValue: 0,
      },
      preference: {
        type: DataTypes.ENUM({
          values: [
            "one on one/private tutions",
            "no preference",
            "group classes",
          ],
        }),
        // defaultValue: "no preference",
        validate: {
          isIn: [
            ["one on one/private tutions", "no preference", "group classes"],
          ],
        },
      },
      availability: {
        type: DataTypes.ENUM({
          values: ["anyday", "weekday", "weekend"],
        }),
        // defaultValue: "anyday",
        validate: {
          isIn: [["anyday", "weekday", "weekend"]],
        },
      },
      start_date: {
        type: DataTypes.ENUM({
          values: [
            "immediately",
            "not sure, just want to look at options",
            "within a month",
          ],
        }),
        // defaultValue: "immediately",
        validate: {
          isIn: [
            [
              "immediately",
              "not sure, just want to look at options",
              "within a month",
            ],
          ],
        },
      },
      // tutor_identifier: {
      //   type: DataTypes.STRING,
      //   allowNull: false,
      //   unique: true,
      //   defaultValue: `TUT${randomBytesGenerator(4)}`,
      // },
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
    intro_video: req.body.intro_video,
    coords: req.body.coords,
    enquiry_radius: req.body.enquiry_radius || 0,
    degree: req.body.degree,
    preference: req.body.preference,
    availability: req.body.availability,
    start_date: req.body.start_date,
    type: req.body.type,
    institute_contact_name: req.body.institute_contact_name,
    institute_name: req.body.institute_name,
  });

  return tutor.dataValues;
};

const getCourses = async (req) => {
  let query = `
  SELECT
      subcat.id, subcat.name, subcat.slug, subcat.image,
      trcrs.id as course_id
    FROM ${constants.models.TUTOR_TABLE} tr
    LEFT JOIN ${constants.models.TUTOR_COURSE_TABLE} trcrs on tr.id = trcrs.tutor_id
    LEFT JOIN ${constants.models.SUB_CATEGORY_TABLE} subcat ON subcat.id = trcrs.course_id
    WHERE tr.user_id = '${req.user_data.id}' 
  `;

  const data = await TutorModel.sequelize.query(query, {
    type: QueryTypes.SELECT,
    raw: true,
  });

  return data.filter((d) => Boolean(d.id));
};

const get = async (req, id) => {
  let whereConditions = [
    "tr.is_profile_completed IS true",
    "usr.is_email_verified IS true",
    "usr.is_aadhaar_verified IS true",
  ];
  const queryParams = {};

  const category = req.query.category ?? null;
  const language = req.query.language ? req.query.language?.split(" ") : [];
  const subjects = !!req.query.subject ? req.query.subject?.split(" ") : [];
  const minAvgRating = req.query.rating
    ? (req.query.rating.split(" ") ?? [])
    : null;
  const gender = req.query.gender ? req.query.gender : null;
  // const address = req.query.addr ? req.query.addr : null;
  const lat = req.query.lat ? Number(req.query.lat) : null;
  const lng = req.query.lng ? Number(req.query.lng) : null;
  const isDemo = req.query.demo
    ? req.query.demo === "yes"
      ? true
      : false
    : null;
  const mode = req.query.mode ? req.query.mode?.split(" ") : null;
  const flexibility = req.query.flexibility
    ? req.query.flexibility?.split(" ")
    : null;
  const place = req.query.place ? req.query.place?.split(" ") : null;
  const budgetRange = req.query.budgetRange
    ? req.query.budgetRange?.split(".")
    : null;

  if (category) {
    whereConditions.push(`subcat.slug = :category`);
    queryParams.category = category;
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

  if (subjects.length) {
    whereConditions.push(`
        EXISTS (
          SELECT 1
          FROM jsonb_array_elements(trcrs.boards) AS brd,
               jsonb_array_elements_text(brd->'subjects') AS subj
          WHERE subj = ANY(:subjects)
        )`);
    queryParams.subjects = `{${subjects.map((item) => item.split("-").join(" ")).join(",")}}`;
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

  if (lat && lng) {
    whereConditions.push(`
      ((
        6371 * acos(
          cos(radians(:lat)) * cos(radians(tr.coords[1])) * 
          cos(radians(tr.coords[2]) - radians(:lng)) + 
          sin(radians(:lat)) * sin(radians(tr.coords[1]))
        )
      ) <= tr.enquiry_radius)
    `);
    queryParams.lat = lat;
    queryParams.lng = lng;
  }

  if (isDemo) {
    whereConditions.push(`trcrs.is_demo_class = :is_demo_class`);
    queryParams.is_demo_class = isDemo;
  }

  if (mode) {
    whereConditions.push(`EXISTS (
        SELECT 1
        FROM jsonb_array_elements(trcrs.budgets) AS budget
        WHERE budget->>'mode' = ANY(:mode)
      )`);
    queryParams.mode = `{${mode.join(",")}}`;
  }

  if (flexibility) {
    whereConditions.push(`EXISTS (
        SELECT 1
        FROM jsonb_array_elements(trcrs.budgets) AS budget
        WHERE budget->>'type' = ANY(:flexibility)
      )`);
    queryParams.flexibility = `{${flexibility.join(",")}}`;
  }

  if (place) {
    whereConditions.push(`EXISTS (
        SELECT 1
        FROM jsonb_array_elements(trcrs.budgets) AS budget
        WHERE budget->>'location' = ANY(:place)
      )`);
    queryParams.place = `{${place.join(",")}}`;
  }

  if (budgetRange) {
    whereConditions.push(`EXISTS (
        SELECT 1
        FROM jsonb_array_elements(trcrs.budgets) AS budget
        WHERE (budget->>'budget')::numeric BETWEEN :minRange AND :maxRange
      )`);
    queryParams.minRange = budgetRange[0];
    queryParams.maxRange = budgetRange[1];
  }
  console.log({ whereConditions, queryParams });
  const page = req.query.page ? Math.max(1, parseInt(req.query.page)) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : null;
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
            'type', tr.type,
            'institute_name', tr.institute_name,
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
    replacements: { ...queryParams },
    type: QueryTypes.SELECT,
    raw: true,
  });

  let total = count?.[0]?.total;

  return { tutors, total };
};

const getFilteredTutors = async (req) => {
  let queryParams = {};
  let whereQuery = `WHERE tr.is_profile_completed IS true AND usr.is_email_verified IS true AND usr.is_aadhaar_verified IS true AND trcrs.tutor_id IS NOT NULL AND  (subcat.slug = '${req.body.subCatSlug}' OR subcat.slug IS NULL)`;
  const lat = req.body.lat ? Number(req.body.lat) : null;
  const lng = req.body.lng ? Number(req.body.lng) : null;
  const preference = req.body.preference ? req.body.preference : null;
  const availability = req.body.availability ? req.body.availability : null;
  const startDate = req.body.start_date ? req.body.start_date : null;
  // (preferenceOpt ? preferenceOpt === preference : true) &&
  // (availabilityOpt ? availabilityOpt === availability : true) &&
  // (startDateOpt ? startDateOpt === start_date : true)

  if (preference) {
    whereQuery += ` AND tr.preference = :preference`;
    queryParams.preference = preference;
  }

  if (availability) {
    whereQuery += ` AND tr.availability = :availability`;
    queryParams.availability = availability;
  }

  if (startDate) {
    whereQuery += ` AND tr.start_date = :startDate`;
    queryParams.startDate = startDate;
  }

  if (lat && lng) {
    whereQuery += `
       AND ((
        6371 * acos(
          cos(radians(:lat)) * cos(radians(tr.coords[1])) *
          cos(radians(tr.coords[2]) - radians(:lng)) +
          sin(radians(:lat)) * sin(radians(tr.coords[1]))
        )
      ) <= tr.enquiry_radius)
    `;
    queryParams.lat = lat;
    queryParams.lng = lng;
  }

  let query = `
  SELECT
      tr.id, tr.profile_picture, tr.languages, tr.experience, tr.created_at, tr.preference, tr.availability, tr.start_date,
      usr.fullname,
      JSON_AGG(trcrs.fields) AS fields,
      JSON_AGG(trcrs.boards) AS boards
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
    console.log({ item });
    // console.log(boards);
    const languages = item.languages;
    const isFieldsMatched = fieldOptions.length
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
      : true;

    const isBoardsMatched = boardOptions.length
      ? boardOptions.some(({ board_name, subjects }) => {
          if (!subjects.length) return true;
          const board = boards.find((b) => b?.board_name === board_name);
          const isTrue =
            board && subjects.length
              ? subjects.some((subject) => board.subjects.includes(subject))
              : false;
          return isTrue;
        })
      : true;

    const isLanguageMatched = languageOptions.length
      ? languageOptions.some((name) => {
          const language = languages?.find(
            (l) => l.name.toLowerCase() === name.toLowerCase()
          );
          console.log({ matched: language });
          return language;
        })
      : true;

    console.log({ isFieldsMatched, isBoardsMatched, isLanguageMatched });
    return isFieldsMatched && isBoardsMatched && isLanguageMatched;
  });

  return filteredData;
};

const getById = async (req, id) => {
  let query = `
  SELECT
      tr.*,
      jsonb_path_query_first(
        json_agg(
          json_build_object(
            'id', usr.id,
            'mobile_number', usr.mobile_number,
            'fullname', usr.fullname,
            'email', usr.email,
            'profile_picture', tr.profile_picture,
            'experience', tr.experience,
            'intro_video', tr.intro_video,
            'is_email_verified', usr.is_email_verified,
            'is_aadhaar_verified', usr.is_aadhaar_verified
          )
        )::jsonb, '$[0]'
      ) as user,
      json_agg(
        json_build_object(
          'id', subcat.id,
          'name', subcat.name,
          'image', subcat.image,
          'slug', subcat.slug,
          'category_name', cat.name,
          'details', json_build_object(
            'id', ttrcrs.id,
            'course_id', ttrcrs.course_id,
            'boards', ttrcrs.boards,
            'is_demo_class', ttrcrs.is_demo_class,
            'class_conduct_mode', ttrcrs.class_conduct_mode,
            'budgets', ttrcrs.budgets
          )
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
      enquiry_radius: req.body.enquiry_radius,
      boards: req.body.boards,
      fields: req.body.fields,
      sub_categories: req.body.sub_categories,
      is_profile_completed: req.body.is_profile_completed,
      curr_step: req.body.curr_step,
      coords: req.body.coords,
      location: req.body.location,
      preference: req.body.preference,
      availability: req.body.availability,
      start_date: req.body.start_date,

      experience: req.body.experience,
      profile_picture: req.body.profile_picture,
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
