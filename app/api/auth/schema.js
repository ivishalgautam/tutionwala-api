export const schema = {
  signup: {
    body: {
      type: "object",
      properties: {
        username: { type: "string", minLength: 3 },
        password: { type: "string", minLength: 3 },
        fullname: { type: "string", minLength: 3 },
        email: { type: "string", minLength: 3 },
        mobile_number: { type: "string", minLength: 3 },
        country_code: { type: "string", minLength: 1 },
        role: { type: "string", enum: ["admin", "user", "student", "tutor"] },
      },
      required: [
        "username",
        "password",
        "fullname",
        "email",
        "mobile_number",
        "country_code",
        "role",
      ],
    },
  },
  login: {
    body: {
      type: "object",
      properties: {
        username: { type: "string" },
        password: { type: "string" },
      },
      required: ["username", "password"],
    },
  },
  otpSend: {
    body: {
      type: "object",
      properties: {
        mobile_number: { type: "string" },
        country_code: { type: "string" },
      },
      required: ["mobile_number", "country_code"],
    },
  },
  otpVerify: {
    body: {
      type: "object",
      properties: {
        mobile_number: { type: "string" },
        otp: { type: "string", minLength: 6, maxLength: 6 },
      },
      required: ["mobile_number", "otp"],
    },
  },
};
