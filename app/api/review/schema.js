export const schema = {
  create: {
    body: {
      type: "object",
      properties: {
        rating: { type: "integer", minimum: 1 },
        tutor_id: { type: "string", format: "uuid" },
        enquiry_id: { type: "string", format: "uuid" },
        review: { type: "string", minLength: 3 },
      },
      required: ["rating", "review", "tutor_id", "enquiry_id"],
    },
  },
  checkParam: {
    params: {
      type: "object",
      properties: { id: { type: "string", format: "uuid" } },
      required: ["id"],
    },
  },
};
