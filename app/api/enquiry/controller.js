"use strict";
import table from "../../db/models.js";
import { ErrorHandler } from "../../helpers/handleError.js";

const create = async (req, res) => {
  const user = await table.UserModel.getById(0, req.user_data.id);
  if (!user) {
    return ErrorHandler({ code: 400, message: "You are not logged in!" });
  }

  const student = await table.StudentModel.getByUserId(0, req.user_data.id);
  if (!student) {
    return ErrorHandler({ code: 400, message: "Student not registered!" });
  }

  const tutor = await table.TutorModel.getById(req);
  if (!tutor) {
    return ErrorHandler({ code: 400, message: "Tutor not found!" });
  }

  const subCategory = await table.SubCategoryModel.getById(req);
  if (!tutor) {
    return ErrorHandler({ code: 400, message: "Tutor not found!" });
  }

  const enquiry = await table.EnquiryModel.getByStudentAndTutor(
    tutor.id,
    student.id
  );

  // ! remove false
  if (false && enquiry) {
    return ErrorHandler({ code: 400, message: "Already enquired!" });
  }

  await table.EnquiryModel.create({
    body: { student_id: student.id, tutor_id: tutor.id },
  });

  res.send({ status: true, message: "Enquiry sent." });
};

const get = async (req, res) => {
  res.send({ status: true, data: await table.EnquiryModel.get(req) });
};

const update = async (req, res) => {
  const record = await table.EnquiryModel.getById(req);
  if (!record)
    return ErrorHandler({ code: 404, message: "Enquiry not found!" });

  await table.EnquiryModel.update(req);
  res.send({ status: true, message: "Enquiry updated." });
};

const deleteById = async (req, res) => {
  const record = await table.EnquiryModel.getById(req);
  if (!record)
    return ErrorHandler({ code: 404, message: "Enquiry not found!" });
  console.log({ record });
  await table.EnquiryModel.deleteById(req);
  res.send({ status: true, message: "Enquiry deleted." });
};

export default {
  create: create,
  get: get,
  deleteById: deleteById,
  update: update,
};
