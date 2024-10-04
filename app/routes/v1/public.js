import { publicRoutes as category } from "../../api/categories/routes.js";
import { publicRoutes as subCategory } from "../../api/sub-categories/routes.js";
import { publicRoutes as tutor } from "../../api/tutor/routes.js";
import { publicRoutes as review } from "../../api/review/routes.js";

export default async function routes(fastify, options) {
  fastify.register(category, { prefix: "categories" });
  fastify.register(subCategory, { prefix: "subCategories" });
  fastify.register(tutor, { prefix: "tutors" });
  fastify.register(review, { prefix: "reviews" });
}
