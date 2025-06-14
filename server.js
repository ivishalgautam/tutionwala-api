// node modules
import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";

// fastify modules
import cors from "@fastify/cors";
import fastifyView from "@fastify/view";
import fastifyHelmet from "@fastify/helmet";
import fastifyRateLimit from "@fastify/rate-limit";
import fastifyMultipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import fastifySocketIO from "@fastify/websocket";

// import internal modules
import authRoutes from "./app/api/auth/routes.js";
import pg_database from "./app/db/postgres.js";
import routes from "./app/routes/v1/index.js";
import publicRoutes from "./app/routes/v1/public.js";
import uploadFileRoutes from "./app/api/upload_files/routes.js";
import { ErrorHandler } from "./app/helpers/handleError.js";
//
// other modules
import ejs from "ejs";
import controller from "./app/api/enquiry/controller.js";

import admin from "./app/config/firebase.js";
import { sendMail } from "./app/helpers/mailer.js";
import nodemailer from "nodemailer";
import config from "./app/config/index.js";
/*
  Register External packages, routes, database connection
*/
export default (app) => {
  app.setErrorHandler(function (error, req, res) {
    console.error(error);
    const statusCode = error.statusCode || 500;
    const errorMessage = error.message || "Internal Server Error";
    res.code(statusCode).send({
      status_code: statusCode,
      status: false,
      error: error.name,
      message: errorMessage,
    });
  });

  app.post("/v1/send-notification", (req, res) => {
    const token = req.body.fcm_token;
    console.log({ token });
    // Create the message object correctly with 'token' field
    const message = {
      token: token,
      notification: {
        title: "Enquiry chat",
        body: "New enquiry chat message",
      },
      data: {
        hello: "world",
      },
    };

    admin.tutors
      .messaging()
      .send(message)
      .then((response) => {
        console.log("Successfully sent message:", response);
        res.code(200).send({ success: true, response });
      })
      .catch((error) => {
        console.error("Error sending message:", error);
        res.code(500).send({ success: false, error: error.message });
      });
  });

  app.register(fastifyRateLimit, {
    max: Number(process.env.MAX_RATE_LIMIT), // Max requests per minute
    timeWindow: process.env.TIME_WINDOW,
    errorResponseBuilder: (req, context) => {
      return ErrorHandler({ code: 429, message: "Rate limit exceeded." });
    },
  });
  app.register(fastifyHelmet);
  app.register(fastifyStatic, {
    root: path.join(dirname(fileURLToPath(import.meta.url), "public")),
  });

  app.register(cors, { origin: "*" });
  app.register(pg_database);
  app.register(fastifyMultipart, {
    limits: { fileSize: 5 * 1024 * 1024 * 1024 }, // Set the limit to 5 GB or adjust as needed
  });

  app.register(fastifySocketIO, {
    cors: { origin: "*" },
    options: {
      maxPayload: 1048576,
      clientTracking: true,
    },
  });

  // Increase the payload size limit
  app.register(routes, { prefix: "v1" });
  app.register(publicRoutes, { prefix: "v1" });
  app.register(authRoutes, { prefix: "v1/auth" });
  app.register(fastifyView, {
    engine: {
      ejs: ejs,
    },
  });

  app.register(uploadFileRoutes, { prefix: "v1/upload" });
};
