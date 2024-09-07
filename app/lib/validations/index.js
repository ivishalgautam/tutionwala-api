import { ErrorHandler } from "../../helpers/handleError.js";

export function isValidLanguage(value) {
  const { language, proficiency } = value;
  if (!language || typeof language !== "string" || language.trim() === "") {
    return ErrorHandler({ message: "Language must be a non-empty string." });
  }

  const validProficiencyLevels = [
    "beginner",
    "intermediate",
    "advanced",
    "native",
  ];

  if (!proficiency || !validProficiencyLevels.includes(proficiency)) {
    return ErrorHandler({
      message:
        "Proficiency must be one of the following: beginner, intermediate, advanced, native.",
    });
  }
}

export function isValidDegree(value) {
  const { courseName, university, status } = value;
  if (
    !courseName ||
    typeof courseName !== "string" ||
    courseName.trim() === ""
  ) {
    return ErrorHandler({ message: "Course name must be a non-empty string." });
  }
  if (
    !university ||
    typeof university !== "string" ||
    university.trim() === ""
  ) {
    return ErrorHandler({
      message: "University name must be a non-empty string.",
    });
  }

  const validStutuses = ["completed", "persuing"];

  if (!status || !validStutuses.includes(status)) {
    return ErrorHandler({
      message:
        "Proficiency must be one of the following: beginner, intermediate, advanced, native.",
    });
  }
}
