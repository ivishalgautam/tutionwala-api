"use strict";
import controller from "./controller.js";

export default async function routes(fastify, options) {
  fastify.get("/", {}, controller.get);
  fastify.delete("/:id", {}, controller.deleteById);
  fastify.get("/:id/chats", {}, controller.fetchChats);
  fastify.get("/:id/chat", { websocket: true }, (connection, req, res) =>
    controller.tutorStudentChat(fastify, connection, req, res)
  );
}
