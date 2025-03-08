"use strict";
import table from "../../db/models.js";
import { sequelize } from "../../db/postgres.js";
import { ErrorHandler } from "../../helpers/handleError.js";
import { haversine } from "../../helpers/haversine.js";

const create = async (req, res) => {
  const mode = req.query.mode || null;
  const subCategorySlug = req.query.category || null;
  if (!mode) return ErrorHandler({ code: 400, message: "Please select mode!" });

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

  if (mode === "offline") {
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
  }

  let subCategory = null;
  if (subCategorySlug) {
    subCategory = await table.SubCategoryModel.getBySlug(0, subCategorySlug);
  }
  if (!tutor) {
    return ErrorHandler({ code: 400, message: "Tutor not found!" });
  }

  const enquiry = await table.EnquiryModel.getByStudentAndTutorAndSubCategory(
    tutor.id,
    student.id,
    subCategory?.id ?? null
  );

  if (enquiry) {
    return ErrorHandler({ code: 400, message: "Already enquired!" });
  }

  await table.EnquiryModel.create({
    body: {
      student_id: student.id,
      tutor_id: tutor.id,
      sub_category_id: subCategory?.id ?? null,
    },
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
  const transaction = await sequelize.transaction();
  try {
    const record = await table.EnquiryModel.getById(req);
    if (!record)
      return ErrorHandler({ code: 404, message: "Enquiry not found!" });

    const data = await table.EnquiryModel.update(req, 0, { transaction });
    console.log(data);
    if (req.body.status === "converted") {
      await table.EnquiryModel.deleteById(req, 0, { transaction });
      req.body.tutor_id = record.tutor_id;
      req.body.student_id = record.student_id;
      const tutorStuMapRecord =
        await table.TutorStudentMapModel.getByTutorAndStudentId(
          record.tutor_id,
          record.student_id
        );

      if (!tutorStuMapRecord) {
        await table.TutorStudentMapModel.create(req, { transaction });
      }
    }
    await transaction.commit();
    res.send({ status: true, message: "Enquiry updated." });
  } catch (error) {
    await transaction.rollback();
    return ErrorHandler({ message: error?.message ?? "error" });
  }
};

const deleteById = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const record = await table.EnquiryModel.getById(req);
    if (!record)
      return ErrorHandler({ code: 404, message: "Enquiry not found!" });
    console.log({ record });
    await table.EnquiryModel.deleteById(req, 0, { transaction });

    await transaction.commit();
    res.send({ status: true, message: "Enquiry deleted." });
  } catch (error) {
    await transaction.rollback();
    return ErrorHandler({ message: error.message });
  }
};

const onlineUsers = new Map();
const enquiryChat = async (fastify, connection, req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const enquiryId = req.params.id;
    const userId = req.user_data.id;

    const record = await table.EnquiryModel.getById(req);
    if (!record)
      return res
        .code(404)
        .send({ message: "Enquiry not exist!", status: false });

    onlineUsers.set(userId, connection.socket);

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

      const getReceiverId = async (enquiryId, senderId) => {
        const enquiry = await table.EnquiryModel.getEnquiryUsers(enquiryId);
        if (!enquiry) return null;

        return enquiry.tutor_user_id === senderId
          ? enquiry.student_user_id
          : enquiry.tutor_user_id;
      };

      const receiverId = await getReceiverId(enquiryId, userId);
      console.log({ onlineUsers });
      if (!onlineUsers.has(receiverId)) {
        await sendNotification(receiverId, content);
      }

      async function sendNotification(userId, message) {
        req.body.user_id = userId;
        req.body.message = message;
        req.body.enquiry_id = enquiryId;

        await table.NotificationModel.create(req, { transaction });
        await transaction.commit();
      }
    });

    // Handle client disconnection
    connection.socket.on("close", () => {
      console.log("Client disconnected");
      onlineUsers.delete(userId);
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export default {
  create: create,
  get: get,
  deleteById: deleteById,
  update: update,
  enquiryChat: enquiryChat,
  fetchChats: fetchChats,
};
