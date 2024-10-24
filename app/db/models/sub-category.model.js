"use strict";
import constants from "../../lib/constants/index.js";
import sequelizeFwk, { Deferrable, QueryTypes } from "sequelize";
const { DataTypes } = sequelizeFwk;

let SubCategoryModel = null;

const init = async (sequelize) => {
  SubCategoryModel = sequelize.define(
    constants.models.SUB_CATEGORY_TABLE,
    {
      id: {
        primaryKey: true,
        allowNull: false,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true,
      },
      category_id: {
        type: DataTypes.UUID,
        allowNull: false,
        onDelete: "CASCADE",
        references: {
          model: constants.models.CATEGORY_TABLE,
          key: "id",
          deferrable: Deferrable.INITIALLY_IMMEDIATE,
        },
        validate: {
          isUUID: 4,
        },
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      image: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      is_featured: { type: DataTypes.BOOLEAN, defaultValue: false },
      is_boards: { type: DataTypes.BOOLEAN, defaultValue: false },
      fields: {
        type: DataTypes.JSONB, // [{ fieldName: "", questionForTutor: "", questionForStudent: "", options: [], fieldType: radio | checkboxes | text | textarea }]
        allowNull: false,
      },
    },
    {
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  await SubCategoryModel.sync({ alter: true });
};

const create = async (req) => {
  const category = await SubCategoryModel.create(
    {
      name: req.body.name,
      image: req.body.image,
      slug: req.body.slug,
      category_id: req.body.category_id,
      is_featured: req.body.is_featured,
      is_boards: req.body.is_boards,
      fields: req.body.fields,
    },
    {
      returning: true,
      raw: true,
    }
  );

  return category.dataValues;
};

const get = async (req) => {
  let whereConditions = [];
  const queryParams = {};
  let q = req.query.q;
  if (q) {
    whereConditions.push(`sbcat.name ILIKE :query OR cat.name ILIKE :query`);
    queryParams.query = `%${q}%`;
  }

  const featured = req.query.featured;
  const isBoards = req.query.isBoards;

  if (featured) {
    whereConditions.push(`sbcat.is_featured = true`);
  }
  if (isBoards) {
    whereConditions.push(`sbcat.is_boards = true`);
  }

  const limit = req.query.limit ? Number(req.query.limit) : 10;
  const page = req.query.page ? Math.max(1, parseInt(req.query.page)) : 1;
  const offset = (page - 1) * limit;

  let whereClause = "";
  if (whereConditions.length > 0) {
    whereClause = "WHERE " + whereConditions.join(" AND ");
  }

  let query = `
  SELECT
      sbcat.id,
      sbcat.name,
      sbcat.image,
      sbcat.slug,
      sbcat.is_boards,
      sbcat.created_at,
      cat.name as category_name,
      COUNT(sbcat.id) OVER()::integer as total
    FROM ${constants.models.SUB_CATEGORY_TABLE} sbcat
    LEFT JOIN ${constants.models.CATEGORY_TABLE} cat ON cat.id = sbcat.category_id
    ${whereClause}
    ORDER BY sbcat.created_at DESC
    LIMIT :limit OFFSET :offset
  `;

  return await SubCategoryModel.sequelize.query(query, {
    replacements: { ...queryParams, limit, offset },
    type: QueryTypes.SELECT,
    raw: true,
  });
};

const update = async (req, id) => {
  const [rowCount, rows] = await SubCategoryModel.update(
    {
      name: req.body.name,
      image: req.body.image,
      slug: req.body.slug,
      category_id: req.body.category_id,
      is_featured: req.body.is_featured,
      is_boards: req.body.is_boards,
      fields: req.body.fields,
    },
    {
      where: {
        id: req.params.id || id,
      },
      returning: true,
      plain: true,
      raw: true,
    }
  );

  return rows;
};

const getById = async (req, id) => {
  let query = `
  SELECT
    sbcat.*,
    COALESCE(json_agg(sbmp.board_id) FILTER (WHERE sbmp.id IS NOT NULL), '[]') AS board_ids,
    COALESCE(
      json_agg(
        json_build_object(
          'board_name', board_data.board_name,
          'subjects', board_data.subjects
        )
      ) FILTER (WHERE board_data.board_name IS NOT NULL), '[]'
    ) AS boards,
    ttr.curr_step,
    ttr.id as tutor_id,
    stu.curr_step,
    stu.id as student_id
  FROM ${constants.models.SUB_CATEGORY_TABLE} sbcat
  LEFT JOIN ${constants.models.SUB_CATEGORY_BOARD_MAPPING_TABLE} sbmp
    ON sbmp.sub_category_id = sbcat.id
  LEFT JOIN ${constants.models.USER_TABLE} usr
    ON usr.id = '${req.user_data.id}'
  LEFT JOIN ${constants.models.TUTOR_TABLE} ttr
    ON usr.id = ttr.user_id
  LEFT JOIN ${constants.models.STUDENT_TABLE} stu
    ON usr.id = stu.user_id
  LEFT JOIN ${constants.models.BOARD_TABLE} brd
    ON brd.id = sbmp.board_id
  LEFT JOIN (
    SELECT
      brd.name AS board_name,
      json_agg(sbj.name) AS subjects
    FROM ${constants.models.BOARD_TABLE} brd
    LEFT JOIN ${constants.models.SUBJECT_TABLE} sbj
      ON sbj.board_id = brd.id
    GROUP BY brd.name
  ) AS board_data ON board_data.board_name = brd.name
  WHERE sbcat.id = '${req.params.id || id}'
  GROUP BY sbcat.id, ttr.curr_step, ttr.id, stu.curr_step, stu.id
  ORDER BY sbcat.created_at DESC;
  `;

  return await SubCategoryModel.sequelize.query(query, {
    type: QueryTypes.SELECT,
    plain: true,
  });
};

const getBySlug = async (req, slug) => {
  let query = `
  SELECT
    sbcat.*,
    COALESCE(json_agg(sbmp.board_id) FILTER (WHERE sbmp.id IS NOT NULL), '[]') AS board_ids,
    COALESCE(
      json_agg(
        json_build_object(
          'board_name', board_data.board_name,
          'subjects', board_data.subjects
        )
      ) FILTER (WHERE board_data.board_name IS NOT NULL), '[]'
    ) AS boards
  FROM ${constants.models.SUB_CATEGORY_TABLE} sbcat
  LEFT JOIN ${constants.models.SUB_CATEGORY_BOARD_MAPPING_TABLE} sbmp
    ON sbmp.sub_category_id = sbcat.id
  LEFT JOIN ${constants.models.BOARD_TABLE} brd
    ON brd.id = sbmp.board_id
  LEFT JOIN (
    SELECT
      brd.name AS board_name,
      json_agg(sbj.name) AS subjects
    FROM ${constants.models.BOARD_TABLE} brd
    LEFT JOIN ${constants.models.SUBJECT_TABLE} sbj
      ON sbj.board_id = brd.id
    GROUP BY brd.name
  ) AS board_data ON board_data.board_name = brd.name
  WHERE sbcat.slug = '${req.params?.slug || slug}'
  GROUP BY sbcat.id
  ORDER BY sbcat.created_at DESC;
  `;

  return await SubCategoryModel.sequelize.query(query, {
    type: QueryTypes.SELECT,
    plain: true,
  });
};

const deleteById = async (req, id) => {
  return await SubCategoryModel.destroy({
    where: { id: req.params.id || id },
  });
};

const countCategories = async (last_30_days = false) => {
  return await SubCategoryModel.findAll({
    attributes: [
      [
        SubCategoryModel.sequelize.fn(
          "COUNT",
          SubCategoryModel.sequelize.col("id")
        ),
        "total_categories",
      ],
    ],
    plain: true,
    raw: true,
  });
};

const getByCategorySlug = async (req, slug) => {
  let whereConditions = [`cat.slug = '${req?.params?.slug || slug}'`];
  const queryParams = {};
  let q = req.query.q;
  if (q) {
    whereConditions.push(`sbcat.name ILIKE :query OR cat.name ILIKE :query`);
    queryParams.query = `%${q}%`;
  }

  const featured = req.query.featured;
  if (featured) {
    whereConditions.push(`sbcat.is_featured = true`);
  }

  const limit = req.query.limit ? Number(req.query.limit) : 10;
  const page = req.query.page ? Math.max(1, parseInt(req.query.page)) : 1;
  const offset = (page - 1) * limit;

  let whereClause = "";
  if (whereConditions.length > 0) {
    whereClause = "WHERE " + whereConditions.join(" AND ");
  }

  let countQuery = `
  SELECT
    COUNT(sbcat.id) OVER()::integer AS total
  FROM ${constants.models.SUB_CATEGORY_TABLE} sbcat
  LEFT JOIN ${constants.models.CATEGORY_TABLE} cat ON cat.id = sbcat.category_id
  ${whereClause}
  ORDER BY sbcat.created_at DESC
  LIMIT :limit OFFSET :offset
`;

  let query = `
    SELECT
      sbcat.id,
      sbcat.name,
      sbcat.image,
      sbcat.slug,
      sbcat.is_boards,
      sbcat.created_at,
      cat.name as category_name
    FROM ${constants.models.SUB_CATEGORY_TABLE} sbcat
    LEFT JOIN ${constants.models.CATEGORY_TABLE} cat ON cat.id = sbcat.category_id
    ${whereClause}
    ORDER BY sbcat.created_at DESC
    LIMIT :limit OFFSET :offset
  `;

  const data = await SubCategoryModel.sequelize.query(query, {
    replacements: { ...queryParams, limit, offset },
    type: QueryTypes.SELECT,
    raw: true,
  });
  const count = await SubCategoryModel.sequelize.query(countQuery, {
    replacements: { ...queryParams, limit, offset },
    type: QueryTypes.SELECT,
    raw: true,
  });

  let total = count?.[0]?.total;

  return { courses: data, total };
};

export default {
  init: init,
  create: create,
  get: get,
  update: update,
  getById: getById,
  getBySlug: getBySlug,
  deleteById: deleteById,
  countCategories: countCategories,
  getByCategorySlug: getByCategorySlug,
};
