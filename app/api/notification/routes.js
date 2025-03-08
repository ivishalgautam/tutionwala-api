import controller from "./controller.js";

export default async function routes(fastify, opts) {
  fastify.get("/", { websocket: true }, (connection, req, res) =>
    controller.getNotifications(fastify, connection, req, res)
  );
}
