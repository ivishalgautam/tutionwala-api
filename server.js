// node modules
import { fileURLToPath } from "url";
import { dirname } from "path";
import path from "path";
import fs from "fs";

// fastify modules
import cors from "@fastify/cors";
import fastifyView from "@fastify/view";
import fastifyHelmet from "@fastify/helmet";
import fastifyRateLimit from "@fastify/rate-limit";
import fastifyMultipart from "@fastify/multipart";
import fastifyStatic from "@fastify/static";
import fastifySocketIO from "@fastify/websocket";
import formbody from "@fastify/formbody";
import fastifyCompress from "@fastify/compress";

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
import { Zoop } from "./app/services/zoop-kyc.js";
/*
  Register External packages, routes, database connection
*/
export default async (app) => {
  await app.setErrorHandler(function (error, req, res) {
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

  await app.register(fastifyRateLimit, {
    max: Number(process.env.MAX_RATE_LIMIT), // Max requests per minute
    timeWindow: process.env.TIME_WINDOW,
    errorResponseBuilder: (req, context) => {
      return ErrorHandler({ code: 429, message: "Rate limit exceeded." });
    },
  });

  await app.register(fastifyHelmet);

  await app.register(fastifyStatic, {
    root: path.join(process.cwd(), "public"),
  });

  await app.register(cors, { origin: "*" });
  await app.register(pg_database);
  await app.register(formbody);
  await app.register(fastifyMultipart, {
    limits: { fileSize: 5 * 1024 * 1024 * 1024 }, // Set the limit to 5 GB or adjust as needed
  });

  await app.register(fastifySocketIO, {
    cors: { origin: "*" },
    options: {
      maxPayload: 1048576,
      clientTracking: true,
    },
  });

  await app.register(fastifyCompress, {
    threshold: 0,
  });
  // Increase the payload size limit
  await app.register(routes, { prefix: "v1" });
  await app.register(publicRoutes, { prefix: "v1" });
  await app.register(authRoutes, { prefix: "v1/auth" });
  await app.register(fastifyView, {
    engine: {
      ejs: ejs,
    },
  });

  await app.register(uploadFileRoutes, { prefix: "v1/upload" });
  await app.get("/testing", {}, async (req, res) => {
    const htmlPath = path.join(
      process.cwd(),
      "views",
      "html",
      "thank-you-kyc.html"
    );

    const htmlContent = fs.readFileSync(htmlPath, "utf8");

    return res
      .header("Content-Type", "text/html; charset=utf-8")
      .send(htmlContent);
  });
};
