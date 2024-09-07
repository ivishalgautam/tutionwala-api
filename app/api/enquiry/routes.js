"use strict";
import controller from "./controller.js";
import { schema } from "./schema.js";

export default async function routes(fastify, options) {
  fastify.post("/:id", { schema: schema.checkParams }, controller.create);
  fastify.get("/", {}, controller.get);
  fastify.delete("/:id", { schema: schema.checkParams }, controller.deleteById);
}
