import jwtVerify from "../../helpers/auth.js";

import { publicRoutes as subCategory } from "../../api/sub-categories/routes.js";
import { publicRoutes as tutor } from "../../api/tutor/routes.js";

export default async function routes(fastify, options) {
  fastify.register(subCategory, { prefix: "subCategories" });
  fastify.register(tutor, { prefix: "tutors" });
}
