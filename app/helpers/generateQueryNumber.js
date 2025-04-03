import crypto from "crypto";

export function generateQueryNumber() {
  const randomPart = crypto.randomBytes(4).toString("hex");
  return randomPart;
}
