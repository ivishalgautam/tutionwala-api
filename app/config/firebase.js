import admin from "firebase-admin";
import path from "path";
import { fileURLToPath } from "url";
import fs from "fs/promises";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Paths
const serviceAccountPathLearners = path.join(
  __dirname,
  "../../learners-app-firebase-config.json"
);
const serviceAccountPathTutors = path.join(
  __dirname,
  "../../tutors-app-firebase-config.json"
);

// Read JSON
const [serviceAccountContentLearners, serviceAccountContentTutors] =
  await Promise.all([
    fs.readFile(serviceAccountPathLearners, "utf-8"),
    fs.readFile(serviceAccountPathTutors, "utf-8"),
  ]);

const serviceAccountLearners = JSON.parse(serviceAccountContentLearners);
const serviceAccountTutors = JSON.parse(serviceAccountContentTutors);

// Initialize multiple apps with unique names
const learnersApp = admin.initializeApp(
  {
    credential: admin.credential.cert(serviceAccountLearners),
  },
  "learners_app"
);

const tutorsApp = admin.initializeApp(
  {
    credential: admin.credential.cert(serviceAccountTutors),
  },
  "tutors_app"
);

export default {
  learners: learnersApp,
  tutors: tutorsApp,
};
