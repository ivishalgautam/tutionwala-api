"use strict";
import moment from "moment";
import constants from "../../lib/constants/index.js";
import sequelizeFwk, { Op, QueryTypes } from "sequelize";
const { DataTypes } = sequelizeFwk;

let CategoryModel = null;

const init = async (sequelize) => {
  CategoryModel = sequelize.define(
    constants.models.CATEGORY_TABLE,
    {
      id: {
        primaryKey: true,
        allowNull: false,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      slug: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      is_featured: { type: DataTypes.BOOLEAN, defaultValue: false },
      image: { type: DataTypes.TEXT, defaultValue: "" },
      meta_title: { type: DataTypes.TEXT, defaultValue: "" },
      meta_description: { type: DataTypes.TEXT, defaultValue: "" },
      meta_keywords: { type: DataTypes.TEXT, defaultValue: "" },
    },
    {
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  await CategoryModel.sync({ alter: true });
};

const create = async (req) => {
  return await CategoryModel.create({
    name: req.body.name,
    slug: req.body.slug,
    is_featured: req.body.is_featured,
    image: req.body.image,
    meta_title: req.body.meta_title,
    meta_description: req.body.meta_description,
    meta_keywords: req.body.meta_keywords,
  });
};

const get = async (req) => {
  let whereConditions = [];
  const queryParams = {};
  let q = req.query.q;
  if (q) {
    whereConditions.push(`cat.name ILIKE :query`);
    queryParams.query = `%${q}%`;
  }

  const featured = req.query.featured;
  if (featured) {
    whereConditions.push(`cat.is_featured = true`);
  }

  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : null;
  const offset = (page - 1) * limit;

  let whereClause = "";
  if (whereConditions.length > 0) {
    whereClause = "WHERE " + whereConditions.join(" AND ");
  }

  let query = `
  SELECT
      cat.id,
      cat.name,
      cat.image,
      cat.slug,
      cat.created_at,
      COUNT(subcat.id)::integer as courses,
      COUNT(cat.id) OVER()::integer as total
    FROM ${constants.models.CATEGORY_TABLE} cat
    LEFT JOIN ${constants.models.SUB_CATEGORY_TABLE} subcat ON subcat.category_id = cat.id
    ${whereClause}
    GROUP BY
      cat.id
    ORDER BY cat.created_at DESC
    LIMIT :limit OFFSET :offset
  `;

  return await CategoryModel.sequelize.query(query, {
    replacements: { ...queryParams, limit, offset },
    type: QueryTypes.SELECT,
    raw: true,
  });
};

const getInTabularForm = async (req) => {
  let query = `
  SELECT
      cat.id,
      cat.name,
      json_agg(
        json_build_object(
          'id', subcat.id,
          'name', subcat.name,
          'slug', subcat.slug
        )
      ) as sub_categories
    FROM ${constants.models.CATEGORY_TABLE} cat
    LEFT JOIN ${constants.models.SUB_CATEGORY_TABLE} subcat ON subcat.category_id = cat.id
    GROUP BY cat.id
    ORDER BY cat.created_at DESC
  `;

  return await CategoryModel.sequelize.query(query, {
    type: QueryTypes.SELECT,
    raw: true,
  });
};

const update = async (req, id) => {
  const [rowCount, rows] = await CategoryModel.update(
    {
      name: req.body.name,
      slug: req.body.slug,
      is_featured: req.body.is_featured,
      image: req.body.image,
      meta_title: req.body.meta_title,
      meta_description: req.body.meta_description,
      meta_keywords: req.body.meta_keywords,
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
  return await CategoryModel.findOne({
    where: {
      id: req.params.id || id,
    },
  });
};

const getBySlug = async (req, slug) => {
  return await CategoryModel.findOne({
    where: {
      slug: req.params?.slug || slug,
    },
    raw: true,
  });
};

const deleteById = async (req, id) => {
  return await CategoryModel.destroy({
    where: { id: req.params.id || id },
  });
};

const countCategories = async (last_30_days = false) => {
  return await CategoryModel.findAll({
    attributes: [
      [
        CategoryModel.sequelize.fn("COUNT", CategoryModel.sequelize.col("id")),
        "total_categories",
      ],
    ],
    plain: true,
    raw: true,
  });
};

const countCategory = async (last_30_days = false) => {
  let where_query;
  if (last_30_days) {
    where_query = {
      created_at: {
        [Op.gte]: moment()
          .subtract(30, "days")
          .format("YYYY-MM-DD HH:mm:ss.SSSZ"),
      },
    };
  }

  return await CategoryModel.count({
    where: where_query,
    raw: true,
  });
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
  countCategory: countCategory,
  getInTabularForm: getInTabularForm,
};
