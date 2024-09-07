"use strict";
import controller from "./controller.js";
import { schema } from "./schema.js";

export default async function routes(fastify, options) {
  fastify.get("/", {}, controller.get);
  fastify.post("/", { schema: schema.create }, controller.create);
  fastify.put("/:id", { schema: schema.checkParam }, controller.updateById);
  fastify.delete("/:id", { schema: schema.checkParam }, controller.deleteById);
  fastify.get(
    "/getById/:id",
    { schema: schema.checkParam },
    controller.getById
  );
}
