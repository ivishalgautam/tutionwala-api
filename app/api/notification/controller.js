"use strict";
import table from "../../db/models.js";
import constants from "../../lib/constants/index.js";

const get = async (req, res) => {
  const notifications = await table.NotificationModel.getByUserId(req);

  res.send({ status: true, data: notifications });
};

const getNotifications = async (fastify, connection, req, res) => {
  const userId = req.user_data.id;
  const notifications = await table.NotificationModel.getByUserId(req);

  constants.onlineUsers.set(userId, connection.socket);

  fastify.websocketServer.clients.forEach((client) => {
    if (client.readyState === 1) {
      notifications.forEach((noti) => client.send(JSON.stringify(noti)));
    }
  });

  // Handle client disconnection
  connection.socket.on("close", () => {
    console.log("Client disconnected");
  });
};

export default {
  get: get,
  getNotifications: getNotifications,
};
