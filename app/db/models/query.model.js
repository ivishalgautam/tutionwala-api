"use strict";
import { generateQueryNumber } from "../../helpers/generateQueryNumber.js";
import constants from "../../lib/constants/index.js";
import sequelizeFwk, { ENUM, QueryTypes } from "sequelize";
const { DataTypes } = sequelizeFwk;

let UserQueryModel = null;

const init = async (sequelize) => {
  UserQueryModel = sequelize.define(
    constants.models.QUERY_TABLE,
    {
      id: {
        primaryKey: true,
        allowNull: false,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true,
      },
      query_number: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      name: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      address: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      phone: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      subject: {
        type: DataTypes.STRING,
        allowNull: false,
      },
      message: {
        type: DataTypes.TEXT,
        allowNull: false,
      },
      status: {
        type: DataTypes.ENUM(["pending", "resolved"]),
        defaultValue: "pending",
      },
    },
    {
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  await UserQueryModel.sync({ alter: true });
};

const create = async (req) => {
  return await UserQueryModel.create({
    query_number: generateQueryNumber(),
    name: req.body.name,
    email: req.body.email,
    address: req.body.address,
    phone: req.body.phone,
    subject: req.body.subject,
    message: req.body.message,
  });
};

const get = async (req) => {
  const whereConditions = [];
  const queryParams = {};
  const q = req.query.q ? req.query.q : null;

  if (q) {
    whereConditions.push(
      `qr.name ILIKE :query OR qr.email ILIKE :query OR qr.phone ILIKE :query`
    );
    queryParams.query = `%${q}%`;
  }
  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : null;
  const offset = (page - 1) * limit;

  let whereClause = "";
  if (whereConditions.length) {
    whereClause = `WHERE ${whereConditions.join(" AND ")}`;
  }

  const query = `
  SELECT
      qr.*,
      COUNT(qr.id) OVER()::integer as total
    FROM ${constants.models.QUERY_TABLE} qr
    ${whereClause}
    ORDER BY qr.created_at DESC
    LIMIT :limit OFFSET :offset
  `;

  return await UserQueryModel.sequelize.query(query, {
    replacements: { ...queryParams, limit, offset },
    type: QueryTypes.SELECT,
    raw: true,
  });
};

const getById = async (req, id) => {
  return await UserQueryModel.findOne({
    where: {
      id: req.params.id || id,
    },
  });
};

const update = async (req, id) => {
  return await UserQueryModel.update(
    { status: req.body.status },
    {
      where: { id: req.params.id || id },
    }
  );
};

const deleteById = async (req, id) => {
  return await UserQueryModel.destroy({
    where: { id: req.params.id || id },
  });
};

export default {
  init: init,
  create: create,
  get: get,
  getById: getById,
  update: update,
  deleteById: deleteById,
};
