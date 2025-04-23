"use strict";
import moment from "moment";
import { generateQueryNumber } from "../../helpers/generateQueryNumber.js";
import constants from "../../lib/constants/index.js";
import sequelizeFwk, { ENUM, Op, QueryTypes, Sequelize } from "sequelize";
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
        type: DataTypes.ENUM(["pending", "resolved", "in progress"]),
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
  const data = await UserQueryModel.create({
    query_number: generateQueryNumber(),
    name: req.body.name,
    email: req.body.email,
    address: req.body.address,
    phone: req.body.phone,
    subject: req.body.subject,
    message: req.body.message,
  });

  return data.dataValues;
};

const get = async (req) => {
  const whereConditions = [];
  const queryParams = {};
  const q = req.query.q ? req.query.q : null;
  const status = req.query.status ? req.query.status.split(".") : null;

  if (q) {
    whereConditions.push(
      `qr.name ILIKE :query OR qr.email ILIKE :query OR qr.phone ILIKE :query OR qr.query_number ILIKE :query`
    );
    queryParams.query = `%${q}%`;
  }

  if (status?.length) {
    whereConditions.push("qr.status = any(:status)");
    queryParams.status = `{${status.join(",")}}`;
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
  const [, rows] = await UserQueryModel.update(
    { status: req.body.status },
    {
      where: { id: req.params.id || id },
      returning: true,
      raw: true,
      plain: true,
    }
  );

  return rows;
};

const deleteById = async (req, id) => {
  return await UserQueryModel.destroy({
    where: { id: req.params.id || id },
  });
};

const countQuery = async (last_30_days = false) => {
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

  const counts = await UserQueryModel.findAll({
    where: where_query,
    attributes: [
      "status",
      [Sequelize.fn("COUNT", Sequelize.col("status")), "count"],
    ],
    group: ["status"],
    raw: true,
  });

  const total = await UserQueryModel.count();

  const result = {
    pending: 0,
    resolved: 0,
    inProgress: 0,
    total,
  };

  counts.forEach(({ status, count }) => {
    if (status === "in progress") {
      result.inProgress = parseInt(count);
    } else {
      result[status] = parseInt(count);
    }
  });

  return result;
};

export default {
  init: init,
  create: create,
  get: get,
  getById: getById,
  update: update,
  deleteById: deleteById,
  countQuery: countQuery,
};
