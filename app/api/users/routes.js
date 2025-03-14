"use strict";

import controller from "./controller.js";
import { schema } from "./schema.js";

export default async function routes(fastify, options) {
  // fastify.addHook("onRequest", jwtVerify.verifyToken);
  fastify.post(
    "/:id/change-password",
    { schema: schema.checkParam },
    controller.updatePassword
  );
  fastify.put("/:id", { schema: schema.checkParam }, controller.update);
  fastify.put(
    "/status/:id",
    { schema: schema.checkParam },
    controller.updateStatus
  );
  fastify.get("/me", {}, controller.getUser);
  fastify.post("/", { schema: schema.create }, controller.create);
  fastify.post("/tutor", { schema: schema.tutor }, controller.create);
  fastify.post("/student", { schema: schema.student }, controller.create);
  fastify.get("/", {}, controller.get);
  fastify.get("/:id", { schema: schema.checkParam }, controller.getById);
  fastify.delete("/delete-account", {}, controller.deleteAccount);
  fastify.delete("/:id", { schema: schema.checkParam }, controller.deleteById);
  fastify.get(
    "/get-aadhaar-details/:id",
    { schema: schema.checkParam },
    controller.getAadhaarDetails
  );
  fastify.post("/email/otp/send", {}, controller.emailVerificationOTPSend);
  fastify.post("/email/otp/verify", {}, controller.verifyEmailOtp);
}
