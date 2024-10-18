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

// import internal modules
import authRoutes from "./app/api/auth/routes.js";
import pg_database from "./app/db/postgres.js";
import routes from "./app/routes/v1/index.js";
import publicRoutes from "./app/routes/v1/public.js";
import uploadFileRoutes from "./app/api/upload_files/routes.js";
import { ErrorHandler } from "./app/helpers/handleError.js";

// other modules
import ejs from "ejs";

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

  app.get("/v1/course", (req, res) => {
    const data = [
      "Bachelor of Technology (B.Tech)",
      "Bachelor of Engineering (B.E)",
      "Master of Technology (M.Tech)",
      "Master of Engineering (M.E)",
      "Diploma in Engineering",
      "Bachelor of Science (B.Sc)",
      "Master of Science (M.Sc)",
      "Bachelor of Computer Applications (BCA)",
      "Master of Computer Applications (MCA)",
      "Bachelor of Pharmacy (B.Pharm)",
      "Bachelor of Arts (B.A)",
      "Master of Arts (M.A)",
      "Bachelor of Fine Arts (BFA)",
      "Master of Fine Arts (MFA)",
      "Bachelor of Social Work (BSW)",
      "Master of Social Work (MSW)",
      "Bachelor of Commerce (B.Com)",
      "Master of Commerce (M.Com)",
      "Bachelor of Business Administration (BBA)",
      "Master of Business Administration (MBA)",
      "Chartered Accountancy (CA)",
      "Bachelor of Medicine, Bachelor of Surgery (MBBS)",
      "Bachelor of Dental Surgery (BDS)",
      "Bachelor of Ayurvedic Medicine and Surgery (BAMS)",
      "Bachelor of Homeopathic Medicine and Surgery (BHMS)",
      "Bachelor of Physiotherapy (BPT)",
      "Bachelor of Laws (LLB)",
      "Master of Laws (LLM)",
      "Integrated BA LLB",
      "Integrated BBA LLB",
      "Bachelor of Architecture (B.Arch)",
      "Master of Architecture (M.Arch)",
      "Diploma in Architecture",
      "Bachelor of Design (B.Des)",
      "Master of Design (M.Des)",
      "Bachelor of Fashion Design (B.FD)",
      "Master of Fashion Design (M.FD)",
    ].map((ele) => ({ value: ele, label: ele }));
    res.send(data);
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
