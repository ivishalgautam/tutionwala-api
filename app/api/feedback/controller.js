"use strict";
import table from "../../db/models.js";

const create = async (req, res) => {
  res.send({ status: true, message: "Thank you for your feedback." });
};

export default {
  create: create,
};
