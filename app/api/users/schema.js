export const schema = {
  create: {
    body: {
      type: "object",
      properties: {
        username: { type: "string", minLength: 3 },
        password: { type: "string", minLength: 3 },
        firstname: { type: "string", minLength: 3 },
        lastname: { type: "string" },
        email: { type: "string", minLength: 3 },
        mobileNumber: { type: "string", minLength: 3 },
        countryCode: { type: "string", minLength: 1 },
        role: { type: "string", enum: ["admin", "user"] },
      },
      required: [
        "username",
        "password",
        "firstname",
        "lastname",
        "email",
        "mobileNumber",
        "countryCode",
        "role",
      ],
    },
  },
  student: {
    body: {
      type: "object",
      properties: {
        fullname: { type: "string", minLength: 3 },
        email: { type: "string", minLength: 3 },
        mobile_number: { type: "string", minLength: 3 },
        country_code: { type: "string", minLength: 1 },
        role: { type: "string", enum: ["student"] },
      },
      required: ["fullname", "email", "mobile_number", "country_code", "role"],
    },
  },
  tutor: {
    body: {
      type: "object",
      properties: {
        fullname: { type: "string", minLength: 3 },
        email: { type: "string", minLength: 3 },
        mobile_number: { type: "string", minLength: 3 },
        country_code: { type: "string", minLength: 1 },
        role: { type: "string", enum: ["tutor"] },
        type: { type: "string", enum: ["individual", "institute"] },
        institute_name: { type: "string" },
        institute_contact_name: { type: "string" },
        location: { type: "string", minLength: 3 },
      },
      required: [
        "fullname",
        "email",
        "mobile_number",
        "country_code",
        "role",
        "type",
        "location",
      ],
    },
  },
  checkParam: {
    type: "object",
    properties: {
      id: { type: "string", format: "uuid" },
    },
    required: ["id"],
  },
};
