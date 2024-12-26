"use strict";
import controller from "./controller.js";
import schema from "./schema.js";

export default async function routes(fastify, options) {}

export async function publicRoutes(fastify, options) {
  fastify.post("/", { schema: schema.create }, controller.create);
}
