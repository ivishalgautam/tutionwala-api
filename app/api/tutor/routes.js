"use strict";
import controller from "./controller.js";
import { schema } from "./schema.js";

export default async function routes(fastify, options) {
  fastify.put("/:id", { schema: schema.checkParam }, controller.updateById);
  fastify.get(
    "/getByUser/:id",
    { schema: schema.checkParam },
    controller.getByUserId
  );
  fastify.get("/getTutorDetail", {}, controller.getTutorDetail);
  fastify.get("/courses", {}, controller.getCourses);
  fastify.delete("/courses/:id", {}, controller.deleteTutorCourseById);
  fastify.post("/courses", {}, controller.createCourse);
  fastify.post(
    "/get-tutor-course-by-tutor-and-course-id",
    {},
    controller.getTutorCourseByTutorAndCourseId
  );
  fastify.put(
    "/update-tutor-course-by-id/:id",
    {},
    controller.updateTutorCourseById
  );
}

export async function publicRoutes(fastify, options) {
  fastify.get("/", {}, controller.get);
  fastify.post("/filter", {}, controller.getFilteredTutors);
  fastify.get("/:id", { schema: schema.checkParam }, controller.getById);
}
