export const schema = {
  create: {
    body: {
      type: "object",
      properties: {
        rating: { type: "integer", minimum: 1 },
        review: { type: "string", minLength: 3 },
      },
      required: ["rating", "review"],
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
