"use strict";
import constants from "../../lib/constants/index.js";
import table from "../../db/models.js";
import { ErrorHandler } from "../../helpers/handleError.js";

const { NOT_FOUND } = constants.http.status;

const createCourse = async (req, res) => {
  console.log(req.body);
  const tutor = await table.TutorModel.getByUserId(req);
  if (!tutor)
    return ErrorHandler({ code: 404, message: "Tutor not registered!" });
  const courseRecord = await table.SubCategoryModel.getBySlug(
    0,
    req.body.sub_category_slug
  );
  if (!courseRecord)
    return ErrorHandler({ code: 404, message: "Course not found!" });

  const courseExist = await table.TutorCourseModel.findByTutorAndCourseId(
    tutor.id,
    courseRecord.id
  );
  if (courseExist)
    return ErrorHandler({ code: 400, message: "Course already exist!" });

  req.body.tutor_id = tutor.id;
  req.body.course_id = courseRecord.id;
  const course = await table.TutorCourseModel.create(req);
  if (!course)
    return ErrorHandler({ code: 500, message: "Error creating course!" });

  res.send({ status: true, message: "Created" });
};

const updateById = async (req, res) => {
  console.log(req.body);
  const record = await table.TutorModel.getById(req);
  if (!record) {
    return ErrorHandler({ code: NOT_FOUND, message: "Tutor not found!" });
  }

  const currStep = req.body?.curr_step ?? null;
  if (currStep) {
    req.body.curr_step = Number(currStep) < 3 ? Number(currStep) + 1 : 3;
  }

  if (currStep === 3) {
    req.body.is_profile_completed = true;
  }

  const updated = await table.TutorModel.update(req);
  if (!updated)
    return ErrorHandler({ code: 500, message: "Error updating tutor!" });

  if (currStep === 1) {
    const tutorCourse = await table.TutorCourseModel.findFirstUserCourse(
      record.id
    );
    let newReq = {
      ...req,
      body: { ...req.body },
      params: { id: tutorCourse.id },
    };
    await table.TutorCourseModel.update(newReq);
  }

  res.send({ status: true, message: "Updated" });
};

const getById = async (req, res) => {
  // const tutor = await table.TutorModel.getByUserId(0, req.params.id);
  // if (!tutor) {
  //   return ErrorHandler({ code: 400, message: "Tutor not registered!" });
  // }

  const record = await table.TutorModel.getById(0, req.params.id);
  if (!record) {
    return ErrorHandler({ code: NOT_FOUND, message: "Tutor not found!" });
  }

  res.send({ status: true, data: record });
};

const getTutorDetail = async (req, res) => {
  res.send({ status: true, data: await table.TutorModel.getByUserId(req) });
};

const deleteTutorCourseById = async (req, res) => {
  const record = await table.TutorCourseModel.getById(req);
  if (!record) {
    return ErrorHandler({
      code: NOT_FOUND,
      message: "Tutor course not found!",
    });
  }

  await table.TutorCourseModel.deleteById(req);

  res.send({ status: true, data: record, message: "Course Deleted." });
};

const getByUserId = async (req, res) => {
  const record = await table.TutorModel.getByUserId(req);
  if (!record) {
    return ErrorHandler({ code: NOT_FOUND, message: "Tutor not found!" });
  }

  res.send({ status: true, data: record });
};

const get = async (req, res) => {
  const { tutors, total } = await table.TutorModel.get(req);
  res.send({ status: true, data: tutors, total });
};

const getCourses = async (req, res) => {
  res.send({ status: true, data: await table.TutorModel.getCourses(req) });
};

const getFilteredTutors = async (req, res) => {
  let data = await table.TutorModel.getFilteredTutors(req);
  const total = data?.length ?? 0;
  const sliced = req.query.limit
    ? data
        ?.map(({ id, profile_picture }) => ({ id, profile_picture }))
        .slice(0, req.query.limit ?? 6)
    : data?.map(
        ({ id, profile_picture, fullname, experience, languages, boards }) => ({
          user: {
            id,
            profile_picture,
            fullname,
            experience,
            languages,
            boards,
          },
        })
      );

  res.send({
    status: true,
    data: sliced,
    total,
  });
};

export default {
  updateById: updateById,
  getByUserId: getByUserId,
  get: get,
  getFilteredTutors: getFilteredTutors,
  getById: getById,
  getCourses: getCourses,
  createCourse: createCourse,
  deleteTutorCourseById: deleteTutorCourseById,
  getTutorDetail: getTutorDetail,
};
