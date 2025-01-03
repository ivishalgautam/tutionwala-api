"use strict";

import controller from "./controller.js";

import jwtVerify from "../../helpers/auth.js";

export default async (fastify, options) => {
  fastify.get("/", {}, controller.get);
  // fastify.get("/signedUrl", {}, controller.signedUrl);
  fastify.post("/presigned-url", {}, controller.presignedPutUrl);
  fastify.post("/presigned-urls", {}, controller.presignedPutUrls);
  fastify.delete("/s3", {}, controller.deleteObjKey);
  fastify.delete("/", {}, controller._delete);
  fastify.post("/files", {}, controller.upload);
  //   fastify.post("/video", {}, controller.uploadVideo);
  //   fastify.delete("/video", {}, controller.deleteVideoFile);
};
