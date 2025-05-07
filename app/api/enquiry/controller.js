"use strict";
import table from "../../db/models.js";
import { sequelize } from "../../db/postgres.js";
import { ErrorHandler } from "../../helpers/handleError.js";
import { haversine } from "../../helpers/haversine.js";
import { fileURLToPath } from "url";
import path from "path";
import fs from "fs";
import ejs from "ejs";
import { sendMail } from "../../helpers/mailer.js";
import admin from "../../config/firebase.js";
import { numberMasking } from "../../helpers/number-masking.js";
// import admin from "../../config/firebase.js";

const notificationTemplatePath = path.join(
  fileURLToPath(import.meta.url),
  "..",
  "..",
  "..",
  "..",
  "views",
  "notification.ejs"
);

const notificationTemplate = fs.readFileSync(notificationTemplatePath, "utf-8");

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

  if (subCategory) {
    const tutorCourse = await table.TutorCourseModel.getByTutorCourseId(
      tutor.id,
      subCategory.id
    );
    if (!tutorCourse)
      return ErrorHandler({
        code: 404,
        message: "Tutor not teach this course!",
      });
    const isModeAvailable = tutorCourse.budgets.some(
      (item) => item.mode === mode
    );
    if (!isModeAvailable)
      return ErrorHandler({
        code: 404,
        message: `Tutor not teach this course ${mode}!`,
      });
  }

  // const enquiry = await table.EnquiryModel.getByStudentAndTutorAndSubCategory(
  //   tutor.id,
  //   student.id,
  //   subCategory?.id ?? null
  // );

  // if (enquiry) {
  //   return ErrorHandler({ code: 400, message: "Already enquired!" });
  // }

  const newEnq = await table.EnquiryModel.create({
    body: {
      student_id: student.id,
      tutor_id: tutor.id,
      sub_category_id: subCategory?.id ?? null,
      subjects: req.query?.subject ?? "",
    },
  });

  const newReq = { ...req, body: {} };
  if (newEnq) {
    newReq.body.user_id = tutor.user_id;
    newReq.body.message = `You have a new enquiry from ${req.user_data.fullname}`;
    newReq.body.type = "enquiry";
    newReq.body.enquiry_id = newEnq.id;

    await table.NotificationModel.create(newReq);

    // mail
    const notificationSend = ejs.render(notificationTemplate, {
      fullname: tutor.user.fullname,
      content: `New enquiry from ${req.user_data.fullname}`,
    });

    const fcmRecord = await table.FCMModel.getByUser(req.user_data.id);
    if (fcmRecord) {
      const appNotification = {
        token: fcmRecord.fcm_token,
        notification: {
          title: "Chat",
          body: `New enquiry from ${req.user_data.fullname}.`,
        },
        data: {
          type: "enquiry",
        },
      };

      admin.tutors
        .messaging()
        .send(appNotification)
        .then((response) => {
          console.log("Successfully sent message:", response);
        })
        .catch((error) => {
          console.error("Error sending message:", error);
        });
    }
    tutor.user.email &&
      (await sendMail(
        notificationSend,
        tutor.user.email,
        subCategory
          ? `Tutionwala new Enquiry for ${subCategory.name}`
          : "Tutionwala new Enquiry"
      ));
  }

  res.send({ status: true, message: "Enquiry sent." });
};

const get = async (req, res) => {
  await table.NotificationModel.deleteByEnquiry(req);
  res.send({ status: true, data: await table.EnquiryModel.get(req) });
};

const fetchChats = async (req, res) => {
  const record = await table.EnquiryModel.getById(req);
  if (!record)
    return ErrorHandler({ code: 404, message: "Enquiry not found!" });

  await table.NotificationModel.deleteByEnquiryId(req);

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
  const enquiryId = req.params.id;
  const userId = req.user_data.id;

  const record = await table.EnquiryModel.getById(req);
  if (!record)
    return res.code(404).send({ message: "Enquiry not exist!", status: false });

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
    const maskedContent = numberMasking(content);
    req.body.content = maskedContent;
    req.body.enquiry_id = req.params.id;

    await table.EnquiryChatModel.create(req);
    const newMessage = {
      sender: req.user_data.fullname ?? "",
      content: maskedContent,
      id: Date.now(),
      enquiryId: req.params.id,
    };

    broadcast(newMessage, connection.socket);

    const getReceiverDetails = async (enquiryId, senderId) => {
      const enquiry = await table.EnquiryModel.getEnquiryUsers(enquiryId);
      if (!enquiry) return null;

      return enquiry.tutor_user_id === senderId
        ? {
            receiverId: enquiry.student_user_id,
            receiverFullname: enquiry.student_name,
            receiverEmail: enquiry.student_email,
            receiverRole: "student",

            senderId: enquiry.tutor_user_id,
            senderFullname: enquiry.tutor_name,
            senderEmail: enquiry.tutor_email,
          }
        : {
            receiverId: enquiry.tutor_user_id,
            receiverFullname: enquiry.tutor_name,
            receiverEmail: enquiry.tutor_email,
            receiverRole: "tutor",

            senderId: enquiry.student_user_id,
            senderFullname: enquiry.student_name,
            senderEmail: enquiry.student_email,
          };
    };

    const { receiverId, receiverFullname, receiverEmail, receiverRole } =
      await getReceiverDetails(enquiryId, userId);
    if (!onlineUsers.has(receiverId)) {
      await sendNotification(receiverId, content);
    }

    async function sendNotification(userId, message) {
      req.body.user_id = userId;
      req.body.message = message;
      req.body.enquiry_id = enquiryId;
      req.body.type = "enquiry_chat";

      await table.NotificationModel.create(req);
      // mail
      const notificationSend = ejs.render(notificationTemplate, {
        fullname: receiverFullname,
        content: `New enquiry chat message from ${receiverFullname}`,
      });

      const fcmRecord = await table.FCMModel.getByUser(userId);
      if (fcmRecord) {
        const appNotification = {
          token: fcmRecord.fcm_token,
          notification: {
            title: "Enquiry chat",
            body: `New enquiry chat message from ${receiverFullname}`,
          },
          data: {
            enquiry_id: enquiryId,
            type: "enquiry_chat",
          },
        };
        if (receiverRole === "student") {
          admin.learners
            .messaging()
            .send(appNotification)
            .then((response) => {
              console.log("Successfully sent message:", response);
            })
            .catch((error) => {
              console.error("Error sending message:", error);
            });
        } else {
          admin.tutors
            .messaging()
            .send(appNotification)
            .then((response) => {
              console.log("Successfully sent message:", response);
            })
            .catch((error) => {
              console.error("Error sending message:", error);
            });
        }
      }
      receiverEmail &&
        (await sendMail(
          notificationSend,
          receiverEmail,
          "Tutionwala Enquiry Chat"
        ));
    }
  });

  // Handle client disconnection
  connection.socket.on("close", () => {
    console.log("Client disconnected");
    onlineUsers.delete(userId);
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
