"use strict";
import table from "../../db/models.js";
import { ErrorHandler } from "../../helpers/handleError.js";

const get = async (req, res) => {
  const data = await table.TutorStudentMapModel.get(req);
  res.send({ status: true, data });
};

const deleteById = async (req, res) => {
  const data = await table.TutorStudentMapModel.getById(req);
  if (!data)
    return res.code(404).message({ status: false, message: "Not found!" });

  await table.TutorStudentMapModel.deleteById(req);

  res.send({ status: true, message: "Deleted." });
};

const fetchChats = async (req, res) => {
  const record = await table.TutorStudentMapModel.getById(req);
  if (!record) return ErrorHandler({ code: 404, message: "Chat not found!" });

  await table.NotificationModel.deleteByChatId(req);

  res.send({
    status: true,
    data: await table.TutorStudentChatModel.getByMapId(req),
  });
};

const onlineUsers = new Map();
const tutorStudentChat = async (fastify, connection, req, res) => {
  console.log("Client connected");
  const chatId = req.params.id;
  const userId = req.user_data.id;
  const record = await table.TutorStudentMapModel.getById(req);
  if (!record)
    return res.code(404).send({ message: "Chats not exist!", status: false });
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
    req.body.tutor_student_map_id = req.params.id;

    await table.TutorStudentChatModel.create(req);
    const newMessage = {
      sender: req.user_data.fullname ?? "",
      content,
      id: Date.now(),
      tutorStudentMapId: req.params.id,
    };

    broadcast(newMessage, connection.socket);

    const getReceiverId = async (chatId, senderId) => {
      const chat = await table.TutorStudentMapModel.getChatUsers(chatId);
      if (!chat) return null;

      return chat.tutor_user_id === senderId
        ? chat.student_user_id
        : chat.tutor_user_id;
    };

    const receiverId = await getReceiverId(chatId, userId);
    if (!onlineUsers.has(receiverId)) {
      await sendNotification(receiverId, content);
    }

    async function sendNotification(userId, message) {
      req.body.user_id = userId;
      req.body.message = message;
      req.body.chat_id = chatId;
      req.body.type = "chat";

      await table.NotificationModel.create(req);
    }
  });

  connection.socket.on("close", () => {
    console.log("Client disconnected");
  });
};

export default {
  get: get,
  fetchChats: fetchChats,
  tutorStudentChat: tutorStudentChat,
  deleteById: deleteById,
};
