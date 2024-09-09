export const schema = {
  post: {
    body: {
      type: "object",
      properties: {
        title: { type: "string", minLength: 3 },
        content: { type: "string", minLength: 3 },
        date: { type: "string", minLength: 3 },
        student_id: { type: "string", format: "uuid" },
      },
      required: ["title", "content", "date", "student_id"],
    },
  },
  checkParams: {
    params: {
      type: "object",
      properties: { id: { type: "string", format: "uuid" } },
      required: ["id"],
    },
  },
};
