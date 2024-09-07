"use strict";
import constants from "../../lib/constants/index.js";
import sequelizeFwk, { QueryTypes } from "sequelize";
const { DataTypes } = sequelizeFwk;

let BoardModel = null;

const init = async (sequelize) => {
  BoardModel = sequelize.define(
    constants.models.BOARD_TABLE,
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
        unique: {
          msg: "Board name should be unique!",
        },
      },
    },
    {
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  await BoardModel.sync({ alter: true });
};

const create = async (req) => {
  const board = await BoardModel.create(
    {
      name: req.body.name,
    },
    {
      returning: true,
    }
  );
  return board.dataValues;
};

const get = async (req) => {
  let query = `
  SELECT
      brd.*,
      COUNT(sbj.id) as total_subjects
    FROM ${constants.models.BOARD_TABLE} brd
    LEFT JOIN ${constants.models.SUBJECT_TABLE} sbj ON sbj.board_id = brd.id
    GROUP BY
      brd.id
    ORDER BY brd.created_at DESC
  `;

  return await BoardModel.sequelize.query(query, {
    type: QueryTypes.SELECT,
    raw: true,
  });
};

const update = async (req, id) => {
  const [rowCount, rows] = await BoardModel.update(
    {
      name: req.body.name,
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
      brd.*,
      json_agg(sbj.name) as subjects
    FROM ${constants.models.BOARD_TABLE} brd
    LEFT JOIN ${constants.models.SUBJECT_TABLE} sbj ON sbj.board_id = brd.id
    WHERE brd.id = '${req.params.id || id}'
    GROUP BY
      brd.id
    ORDER BY brd.created_at DESC
  `;

  return await BoardModel.sequelize.query(query, {
    type: QueryTypes.SELECT,
    raw: true,
    plain: true,
  });
};

const deleteById = async (req, id) => {
  return await BoardModel.destroy({
    where: { id: req.params.id || id },
  });
};

export default {
  init: init,
  create: create,
  get: get,
  update: update,
  getById: getById,
  deleteById: deleteById,
};
