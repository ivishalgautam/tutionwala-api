export const schema = {
  create: {
    body: {
      type: "object",
      properties: { name: { type: "string", minLength: 3 } },
      required: ["name"],
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
