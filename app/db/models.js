"use strict";
import userModel from "./models/user.model.js";
import otpModel from "./models/otp.model.js";
import categoryModel from "./models/category.model.js";
import subCategoryModel from "./models/sub-category.model.js";
import boardModel from "./models/board.model.js";
import subCategoryAndBoardMappingModel from "./models/sub-category-and-board-mapping.model.js";
import subjectModel from "./models/subject.model.js";
import tutorModel from "./models/tutor.model.js";
import enquiryModel from "./models/enquiry.model.js";
import studentModel from "./models/student.model.js";
import followupModel from "./models/followup.model.js";
import tutorCourseModel from "./models/tutor-course.model.js";
import reviewModel from "./models/review.model.js";
import queryModel from "./models/query.model.js";
import enquiryChatModel from "./models/enquiry-chat.model.js";
import tutorStudentMapModel from "./models/tutor-student-map.model.js";
import tutorStudentChatModel from "./models/tutor-student-chat.model.js";
import aadhaarDetailsModel from "./models/aadhaar-details.model.js";
import notificationModel from "./models/notification.model.js";
import fcmModel from "./models/fcm.model.js";
import zoopModel from "./models/zoop.model.js";

export default {
  UserModel: userModel,
  TutorModel: tutorModel,
  StudentModel: studentModel,
  OtpModel: otpModel,
  CategoryModel: categoryModel,
  SubCategoryModel: subCategoryModel,
  BoardModel: boardModel,
  SubjectModel: subjectModel,
  SubCatAndBoardMappingModel: subCategoryAndBoardMappingModel,
  EnquiryModel: enquiryModel,
  FollowupModel: followupModel,
  TutorCourseModel: tutorCourseModel,
  ReviewModel: reviewModel,
  QueryModel: queryModel,
  EnquiryChatModel: enquiryChatModel,
  TutorStudentMapModel: tutorStudentMapModel,
  TutorStudentChatModel: tutorStudentChatModel,
  AadhaarModel: aadhaarDetailsModel,
  NotificationModel: notificationModel,
  FCMModel: fcmModel,
  ZoopModel: zoopModel,
};
