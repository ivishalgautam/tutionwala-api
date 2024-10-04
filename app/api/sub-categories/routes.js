"use strict";
import controller from "./controller.js";
import { schema } from "./schema.js";

export default async function routes(fastify, options) {
  fastify.post("/", { schema: schema.create }, controller.create);
  fastify.put("/:id", { schema: schema.checkParams }, controller.updateById);
  fastify.delete("/:id", { schema: schema.checkParams }, controller.deleteById);
  fastify.get(
    "/getById/:id",
    { schema: schema.checkParams },
    controller.getById
  );
}

export async function publicRoutes(fastify, options) {
  fastify.get("/", {}, controller.get);
  fastify.get("/:slug", {}, controller.getBySlug);
  fastify.get("/getByCategorySlug/:slug", {}, controller.getByCategorySlug);
}
