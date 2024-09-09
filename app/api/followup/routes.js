"use strict";
import controller from "./controller.js";
import { schema } from "./schema.js";

export default async function routes(fastify, options) {
  fastify.post("/", { schema: schema.post }, controller.create);
  fastify.delete("/:id", { schema: schema.checkParams }, controller.deleteById);
  fastify.get("/:id", { schema: schema.checkParams }, controller.getById);
  fastify.get(
    "/getByStudentId/:id",
    { schema: schema.checkParams },
    controller.getByStudentId
  );
  fastify.get("/", {}, controller.get);
  fastify.put("/:id", { schema: schema.checkParams }, controller.updateById);
}
