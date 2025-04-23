"use strict";
import moment from "moment";
import table from "../../db/models.js";
import { ErrorHandler } from "../../helpers/handleError.js";

const create = async (req, res) => {
  // console.log("create review", req.body);
  const tutor = await table.TutorModel.getById(0, req.body.tutor_id);
  if (!tutor) return ErrorHandler({ code: 404, message: "Tutor not exist!" });

  const student = await table.StudentModel.getByUserId(0, req.user_data.id);
  if (!student)
    return ErrorHandler({ code: 404, message: "Student not exist!" });
  req.body.student_id = student.id;

  const tutorStudentMap =
    await table.TutorStudentMapModel.getByTutorAndStudentId(
      tutor.id,
      student.id
    );

  if (!tutorStudentMap)
    return res
      .code(404)
      .message({ status: false, message: "Tutor-student mapping not found" });

  const is7DaysOld = moment(tutorStudentMap.created_at)
    .add(7, "days")
    .isSameOrBefore(moment());

  if (!is7DaysOld)
    return ErrorHandler({
      code: 400,
      message: "You can't review before 7 days!",
    });

  // const reviewExist =
  //   await table.ReviewModel.getByAndStudentAndTutor(req);
  // if (reviewExist) return ErrorHandler({ code: 400, message: "Review exist" });

  const review = await table.ReviewModel.create(req);
  if (!review) {
    return ErrorHandler({ message: "Error creating review!" });
  }

  res.send({ status: true, message: "Review submitted." });
};

const get = async (req, res) => {
  res.send({ status: true, data: await table.ReviewModel.get(req) });
};

export default {
  create: create,
  get: get,
};
