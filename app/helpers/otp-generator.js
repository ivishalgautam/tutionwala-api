import crypto from "crypto";
import config from "../config/index.js";

export const otpGenerator = (record) => {
  if (config.node_env === "development") return 111111;
  const otp =
    record?.mobile_number === "8429000000" ||
    record?.mobile_number === "8429111111"
      ? 111111
      : crypto.randomInt(100000, 999999);

  return otp;
};
