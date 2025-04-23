import { publicRoutes as category } from "../../api/categories/routes.js";
import { publicRoutes as subCategory } from "../../api/sub-categories/routes.js";
import { publicRoutes as tutor } from "../../api/tutor/routes.js";
import { publicRoutes as review } from "../../api/review/routes.js";
import { publicRoutes as query } from "../../api/query/routes.js";
import { publicRoutes as feedback } from "../../api/feedback/routes.js";
import { publicRoutes as subject } from "../../api/subject/routes.js";

export default async function routes(fastify, options) {
  fastify.addHook("preHandler", async (request, reply) => {
    request.body && console.log("body", request.body);
  });

  fastify.register(category, { prefix: "categories" });
  fastify.register(subCategory, { prefix: "subCategories" });
  fastify.register(tutor, { prefix: "tutors" });
  fastify.register(review, { prefix: "reviews" });
  fastify.register(query, { prefix: "queries" });
  fastify.register(feedback, { prefix: "feedbacks" });
  fastify.register(subject, { prefix: "subjects" });
}
