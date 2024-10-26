"use strict";

import controller from "./controller.js";

export default async function routes(fastify, options) {
  fastify.get("/all", {}, controller.getReport);
  fastify.get("/last-30-days", {}, controller.getLast30Days);
}
