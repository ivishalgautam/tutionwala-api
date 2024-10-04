"use strict";
import controller from "./controller.js";
import { schema } from "./schema.js";

export default async function routes(fastify, options) {
  fastify.post("/", { schema: schema.create }, controller.create);
}
export async function publicRoutes(fastify, options) {
  fastify.get("/", {}, controller.get);
}
