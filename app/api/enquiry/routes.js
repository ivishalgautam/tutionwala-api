"use strict";
import controller from "./controller.js";
import { schema } from "./schema.js";

export default async function routes(fastify, options) {
  fastify.post("/:id", { schema: schema.checkParams }, controller.create);
  fastify.put("/:id", { schema: schema.checkParams }, controller.update);
  fastify.get("/", {}, controller.get);
  fastify.delete("/:id", { schema: schema.checkParams }, controller.deleteById);
  fastify.get("/:id/chats", {}, controller.fetchChats);
  fastify.get("/:id/chat", { websocket: true }, (connection, req, res) =>
    controller.enquiryChat(fastify, connection, req, res)
  );
}
