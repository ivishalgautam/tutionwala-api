"use strict";
import table from "../../db/models.js";
import { ErrorHandler } from "../../helpers/handleError.js";
import { haversine } from "../../helpers/haversine.js";

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
  const distance =
    haversine(
      student.coords[0],
      student.coords[1],
      tutor.coords[0],
      tutor.coords[1]
    ) / 1000;

  if (distance > tutor.enquiry_radius)
    return ErrorHandler({
      code: 400,
      message: "Sorry, You are not in allowed radius of this tutor!",
    });

  const subCategory = await table.SubCategoryModel.getById(req);
  if (!tutor) {
    return ErrorHandler({ code: 400, message: "Tutor not found!" });
  }

  const enquiry = await table.EnquiryModel.getByStudentAndTutor(
    tutor.id,
    student.id
  );

  if (enquiry) {
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

const fetchChats = async (req, res) => {
  const record = await table.EnquiryModel.getById(req);
  if (!record)
    return ErrorHandler({ code: 404, message: "Enquiry not found!" });

  res.send({
    status: true,
    data: await table.EnquiryChatModel.getByEnquiryId(req),
  });
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

const enquiryChat = async (fastify, connection, req, res) => {
  const record = await table.EnquiryModel.getById(req);
  if (!record)
    return res.code(404).send({ message: "Enquiry not exist!", status: false });

  const broadcast = (message, senderSocket) => {
    fastify.websocketServer.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(
          JSON.stringify({
            ...message,
            admin: senderSocket === client,
          })
        );
      }
    });
  };

  connection.socket.on("message", async (message) => {
    const { content } = JSON.parse(message);
    req.body = {};
    req.body.content = content;
    req.body.enquiry_id = req.params.id;

    await table.EnquiryChatModel.create(req);
    const newMessage = {
      sender: req.user_data.fullname ?? "",
      content,
      id: Date.now(),
      enquiryId: req.params.id,
    };

    broadcast(newMessage, connection.socket);
  });

  // Handle client disconnection
  connection.socket.on("close", () => {
    console.log("Client disconnected");
  });
};

export default {
  create: create,
  get: get,
  deleteById: deleteById,
  update: update,
  enquiryChat: enquiryChat,
  fetchChats: fetchChats,
};
