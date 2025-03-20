"use strict";
import controller from "./controller.js";
import userController from "../users/controller.js";
import otpController from "../otp/controller.js";
import { schema } from "./schema.js";

export default async function routes(fastify, options) {
  fastify.addHook("preHandler", async (request, reply) => {
    request.body && console.log("body", request.body);
  });

  fastify.post(
    "/login",
    { schema: schema.login },
    controller.verifyUserCredentials
  );
  fastify.post("/login/otp-send", {}, controller.otpSend);
  fastify.post("/login/otp-verify", {}, controller.otpVerify);
  fastify.post("/signup", { schema: schema.signup }, controller.createNewUser);
  fastify.post("/refresh", {}, controller.verifyRefreshToken);
  fastify.post("/otp/send", {}, otpController.create);
  fastify.post("/otp/verify", {}, otpController.verify);
  fastify.post("/username", {}, userController.checkUsername);
  fastify.post("/:token", {}, userController.resetPassword);
}
