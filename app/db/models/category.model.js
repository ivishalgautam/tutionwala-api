"use strict";
import constants from "../../lib/constants/index.js";
import sequelizeFwk from "sequelize";
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
      isFeatured: { type: DataTypes.BOOLEAN, defaultValue: false },
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
    isFeatured: req.body.isFeatured,
  });
};

const get = async (req) => {
  let whereClause = "";

  if (req.query.featured) {
    whereClause = { where: { isFeatured: true } };
  }

  return await CategoryModel.findAll({
    ...whereClause,
    order: [["created_at", "DESC"]],
  });
};

const update = async (req, id) => {
  const [rowCount, rows] = await CategoryModel.update(
    {
      name: req.body.name,
      slug: req.body.slug,
      isFeatured: req.body.isFeatured,
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
      slug: req.params.slug || slug,
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
