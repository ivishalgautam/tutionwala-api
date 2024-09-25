"use strict";
import moment from "moment";
import table from "../../db/models.js";
import { ErrorHandler } from "../../helpers/handleError.js";

const create = async (req, res) => {
  console.log("create review", req.body);
  const tutor = await table.TutorModel.getById(0, req.body.tutor_id);
  if (!tutor) return ErrorHandler({ code: 404, message: "Tutor not exist!" });

  const student = await table.StudentModel.getByUserId(0, req.user_data.id);
  if (!student)
    return ErrorHandler({ code: 404, message: "Student not exist!" });
  req.body.student_id = student.id;

  const enquiry = await table.EnquiryModel.getById(0, req.body.enquiry_id);
  if (!enquiry)
    return ErrorHandler({ code: 400, message: "Enquiry not found!" });

  if (enquiry.status === "pending")
    return ErrorHandler({ code: 400, message: "This enquiry is pending" });

  const isEnquiry20DaysOld = moment(enquiry.created_at)
    .add(20, "days")
    .isSameOrBefore(moment());

  if (enquiry.status === "pending")
    return ErrorHandler({ code: 400, message: "This enquiry is pending!" });

  if (!isEnquiry20DaysOld)
    return ErrorHandler({ code: 400, message: "Enquiry must be 20 days old!" });

  const reviewExist = await table.ReviewModel.getByEnquiryAndStudentAndTutor(
    req
  );
  if (reviewExist) return ErrorHandler({ code: 400, message: "Review exist" });

  const review = await table.ReviewModel.create(req);
  if (!review) {
    return ErrorHandler({ message: "Error creating review!" });
  }

  res.send({ status: true, message: "Review submitted." });
};

export default {
  create: create,
};
