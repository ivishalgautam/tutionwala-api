"use strict";

import { sequelize } from "../../db/postgres.js";
import table from "../../db/models.js";

const getNotifications = async (fastify, connection, req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const userId = req.user_data.id;

    const data = await table.NotificationModel.getByUserId(req);

    onlineUsers.set(userId, connection.socket);

    fastify.websocketServer.clients.forEach((client) => {
      if (client.readyState === 1) {
        client.send(JSON.stringify(data));
      }
    });

    // Handle client disconnection
    connection.socket.on("close", () => {
      console.log("Client disconnected");
    });
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
};

export default {
  getNotifications: getNotifications,
};
