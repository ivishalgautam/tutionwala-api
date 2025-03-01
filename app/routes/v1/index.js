import jwtVerify from "../../helpers/auth.js";
import userRoutes from "../../api/users/routes.js";
import otpRoutes from "../../api/otp/routes.js";
import categoryRoutes from "../../api/categories/routes.js";
import subCategoryRoutes from "../../api/sub-categories/routes.js";
import boardRoutes from "../../api/board/routes.js";
import tutorRoutes from "../../api/tutor/routes.js";
import studentRoutes from "../../api/student/routes.js";
import enquiryRoutes from "../../api/enquiry/routes.js";
import followUpRoutes from "../../api/followup/routes.js";
import reviewRoutes from "../../api/review/routes.js";
import queryRoutes from "../../api/query/routes.js";
import reportRoutes from "../../api/dashboard/routes.js";
import tutorStudentMapRoutes from "../../api/tutor-student-map/routes.js";
import zoopRoutes from "../../api/zoop-kyc/routes.js";

export default async function routes(fastify, options) {
  fastify.addHook("onRequest", jwtVerify.verifyToken);
  fastify.addHook("preHandler", async (request, reply) => {
    request.body && console.log("body", request.body);
  });
  fastify.register(userRoutes, { prefix: "users" });
  fastify.register(otpRoutes, { prefix: "otp" });
  fastify.register(categoryRoutes, { prefix: "categories" });
  fastify.register(subCategoryRoutes, { prefix: "subCategories" });
  fastify.register(boardRoutes, { prefix: "boards" });
  fastify.register(tutorRoutes, { prefix: "tutors" });
  fastify.register(studentRoutes, { prefix: "students" });
  fastify.register(enquiryRoutes, { prefix: "enquiries" });
  fastify.register(followUpRoutes, { prefix: "followUps" });
  fastify.register(reviewRoutes, { prefix: "reviews" });
  fastify.register(queryRoutes, { prefix: "queries" });
  fastify.register(reportRoutes, { prefix: "reports" });
  fastify.register(tutorStudentMapRoutes, { prefix: "tutor-student-map" });
  fastify.register(zoopRoutes, { prefix: "zoop" });
}
