"use strict";
import controller from "./controller.js";
import { schema } from "./schema.js";

export default async function routes(fastify, options) {
  fastify.put("/:id", { schema: schema.checkParam }, controller.updateById);
  fastify.get(
    "/getByUser/:id",
    { schema: schema.checkParam },
    controller.getByUserId
  );
}

export async function publicRoutes(fastify, options) {
  fastify.get("/", {}, controller.get);
  fastify.post("/filter", {}, controller.getFilteredTutors);
  fastify.get("/:id", { schema: schema.checkParam }, controller.getById);
}
