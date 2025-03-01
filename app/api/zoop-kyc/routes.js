import controller from "./controller.js";

export default async function routes(fastify, options) {
  fastify.post("/kyc/otp/request", {}, controller.aadhaarKYCOTPRequest);
  fastify.post("/kyc/otp/verify", {}, controller.aadhaarKYCOTPVerify);
}
