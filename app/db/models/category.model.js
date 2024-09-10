"use strict";
import constants from "../../lib/constants/index.js";
import sequelizeFwk, { QueryTypes } from "sequelize";
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
      cat.created_at
    FROM ${constants.models.CATEGORY_TABLE} cat
    ${whereClause}
    ORDER BY cat.created_at DESC
  `;
  return await CategoryModel.sequelize.query(query, {
    replacements: { ...queryParams },
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

export default {
  init: init,
  create: create,
  get: get,
  update: update,
  getById: getById,
  getBySlug: getBySlug,
  deleteById: deleteById,
  countCategories: countCategories,
};
