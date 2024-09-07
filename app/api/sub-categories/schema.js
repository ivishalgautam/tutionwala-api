export const schema = {
  create: {
    body: {
      type: "object",
      properties: {
        name: { type: "string", minLength: 1 },
        category_id: { type: "string", format: "uuid" },
        image: { type: "string", minLength: 1 },
      },
      required: ["name", "category_id", "image"],
    },
  },
  checkParams: {
    params: {
      type: "object",
      properties: {
        id: { type: "string", format: "uuid" },
      },
      required: ["id"],
    },
  },
};
