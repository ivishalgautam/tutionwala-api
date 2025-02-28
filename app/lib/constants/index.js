"use strict";

const constants = {
  environment: {
    LOCAL: "local",
    DEVELOPMENT: "development",
    TEST: "test",
    PRODUCTION: "production",
  },
  http: {
    status: {
      OK: 200,
      CREATED: 201,
      ACCEPTED: 202,
      NOCONTENT: 204,
      MULTI_STATUS: 207,
      REDIRECT: 301,
      BAD_REQUEST: 400,
      UNAUTHORIZED: 401,
      FORBIDDEN: 403,
      CONFLICT: 409,
      INTERNAL_SERVER_ERROR: 500,
      NOT_FOUND: 404,
    },
  },
  error: {
    validation: {},
    message: {
      // HTTP Status code messages
      HTTP_STATUS_CODE_201: "Created",
      HTTP_STATUS_CODE_400: "Bad Request.",
      HTTP_STATUS_CODE_301: "Redirect to other url",
      HTTP_STATUS_CODE_401: "Unauthorized.",
      HTTP_STATUS_CODE_403: "Forbidden.",
      HTTP_STATUS_CODE_404: "The specified resource was not found.",
      HTTP_STATUS_CODE_409: "Resource already exists",
      HTTP_STATUS_CODE_500: "Internal Server Error.",
      INVALID_LOGIN: "Invalid Login",
      EMAIL_MISSING: "Email Missing",
      PAYMENT_ACCOUNT_ID_MISSING: "Payment Account Id Missing",
      INVALID_PAYMENT_ACCOUNT_ID: "Invalid Payment Account Id provided",
    },
  },
  models: {
    USER_TABLE: "users",
    TUTOR_TABLE: "tutors",
    STUDENT_TABLE: "students",
    OTP_TABLE: "otps",
    CATEGORY_TABLE: "categories",
    SUB_CATEGORY_TABLE: "sub_categories",
    SUB_CATEGORY_BOARD_MAPPING_TABLE: "sub_categories_and_board_mappings",
    SUB_CATEGORY_FIELDS_TABLE: "sub_categories_fields",
    BOARD_TABLE: "boards",
    SUBJECT_TABLE: "subjects",
    REVIEW_TABLE: "reviews",
    TUTOR_COURSE_TABLE: "tutor_courses",
    TUTOR_STUDENT_MAP_TABLE: "tutor_student_mappings",
    ENQUIRY_TABLE: "enquiries",
    FOLLOW_UP_TABLE: "follow_ups",
    QUERY_TABLE: "queries",
    ENQUIRY_CHAT_TABLE: "enquiry_chats",
    TUTOR_STUDENT_CHAT_TABLE: "tutor_student_chats",
  },
  bcrypt: {
    SALT_ROUNDS: 10,
  },
  time: {
    TOKEN_EXPIRES_IN: 1000 * 60 * 60 * 24 * 30, // 15 * 1 minute = 15 minutes
    REFRESH_TOKEN_EXPIRES_IN: "30d", // 1 day
  },
  mime: {
    imageMime: ["jpeg", "jpg", "png", "gif", "webp"],
    videoMime: ["mp4", "mpeg", "ogg", "webm", "m4v", "mov", "mkv"],
    docsMime: [
      "pdf",
      "ppt",
      "pptx",
      "docx",
      "application/msword",
      "msword",
      "vnd.openxmlformats-officedocument.wordprocessingml.document",
    ],
  },
};

export default constants;
