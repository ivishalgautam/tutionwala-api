"use strict";
import controller from "./controller.js";
import { schema } from "./schema.js";

export default async function routes(fastify, options) {
  fastify.post("/", { schema: schema.create }, controller.create);
  fastify.put("/:id", { schema: schema.checkParam }, controller.updateById);
  fastify.delete("/:id", { schema: schema.checkParam }, controller.deleteById);
  fastify.get("/:id", { schema: schema.checkParam }, controller.getById);
}

export async function publicRoutes(fastify, options) {
  fastify.get("/", {}, controller.get);
}
