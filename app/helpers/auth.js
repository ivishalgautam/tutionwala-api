"use strict";

import constants from "../lib/constants/index.js";
import config from "../config/index.js";
import table from "../db/models.js";
import jwt from "jsonwebtoken";
import { ErrorHandler } from "./handleError.js";

const expiresIn = constants.time.TOKEN_EXPIRES_IN;

function generateAccessToken(userData) {
  return [
    jwt.sign({ user: userData }, config.jwt_secret, {
      expiresIn: String(expiresIn),
    }),
    expiresIn,
  ];
}

function generateRefreshToken(userData) {
  return jwt.sign({ user: userData }, config.jwt_refresh_secret, {
    expiresIn: constants.time.REFRESH_TOKEN_EXPIRES_IN,
  });
}

const verifyToken = async (req, res) => {
  const isWebSocket = req.headers["sec-websocket-key"] !== undefined;
  let authHeader = null;

  if (isWebSocket) {
    authHeader = `Bearer ${req.query.at}`;
    // console.log("object", req.query.at);
  } else {
    authHeader = req.headers["authorization"];
  }

  if (!authHeader) {
    res.code(401).send({ message: "unauthorized!" });
  }

  const token = authHeader.split(" ")[1];
  if (!token) {
    return res
      .code(401)
      .send({ message: "A token is required for authentication" });
  }

  let userData;

  try {
    const decoded = jwt.verify(token, config.jwt_secret);
    if (decoded.user.role === "admin") {
      userData = await table.UserModel.getByUsername(req, decoded);
    } else {
      userData = await table.UserModel.getById(0, decoded.user.id);
    }

    req.user_data = userData;
    req.decoded = decoded;
  } catch (error) {
    return ErrorHandler({
      code: 401,
      message: error.message ?? "Invalid token or token expired",
    });
  }
  return;
};

const verifyRefreshToken = async (req, res) => {
  try {
    const decoded = jwt.verify(
      req.body.refresh_token,
      config.jwt_refresh_secret
    );
    const [jwtToken, time] = generateAccessToken(decoded.user, expiresIn);
    return res.send({
      token: jwtToken,
      expire_time: Date.now() + expiresIn,
    });
  } catch (error) {
    return res
      .code(401)
      .send({ message: "Invalid refresh token or a refresh token is expired" });
  }
};

export default {
  verifyToken,
  verifyRefreshToken,
  generateAccessToken,
  generateRefreshToken,
};
