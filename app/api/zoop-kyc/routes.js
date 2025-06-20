import controller from "./controller.js";

export default async function routes(fastify, options) {
  fastify.post("/init", {}, controller.zoopInit);
}

export async function zoopPublicRoutes(fastify, options) {
  fastify.post("/callback", {}, controller.zoopCallback);
  fastify.post("/redirect", {}, controller.zoopRedirect);
}
