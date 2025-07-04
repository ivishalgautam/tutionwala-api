import table from "../../db/models.js";

import { ErrorHandler } from "../../helpers/handleError.js";
import { Zoop } from "../../services/zoop-kyc.js";
import { transformAadhaarData } from "../../helpers/transform-aadhaar-data.js";
import path from "path";
import fs from "fs";

const zoopInit = async (req, res) => {
  const { role, id } = req.user_data;

  const tutor = await table.TutorModel.getByUserId(req);
  if (role === "tutor" && !tutor)
    return res
      .code(404)
      .send({ status: false, message: "Tutor not registered!" });

  const student = await table.StudentModel.getByUserId(0, id);
  if (role === "student" && !student)
    return res
      .code(404)
      .send({ status: false, message: "Student not registered!" });

  try {
    const data = await Zoop.init();
    console.log({ data });
    if (data?.request_id) {
      await table.ZoopModel.create({
        ...req,
        body: { request_id: data.request_id },
      });
      return res.code(201).send({ status: true, data });
    } else {
      return res
        .code(400)
        .send({ status: false, message: "Something went wrong!" });
    }
  } catch (error) {
    console.log(error);
    ErrorHandler({
      message: error?.response?.data?.response_message ?? "error",
    });
  }
};

const zoopCallback = async (req, res) => {
  try {
    const request_id = req.body?.request_id;
    const status = req.body?.result?.[0]?.status;
    if (status === "FETCHED") {
      const zoopRequestRecord =
        await table.ZoopModel.getByRequestId(request_id);
      if (!zoopRequestRecord) return false;

      const user = await table.UserModel.getById(0, zoopRequestRecord.user_id);

      const details = transformAadhaarData(req.body);
      req.body.is_aadhaar_verified = true;
      req.body.fullname = details.user_full_name;
      await table.UserModel.update(req, user.id);
      req.body.details = details;
      req.body.customer_aadhaar_number = details.user_aadhaar_number;

      const record = await table.AadhaarModel.getByUserId(user.id);
      if (!record) {
        await table.AadhaarModel.create({ ...req, user_data: { id: user.id } });
      }
      await table.ZoopModel.deleteByRequestId(request_id);
      return true;
    } else {
      await table.ZoopModel.deleteByRequestId(request_id);
      return false;
    }
  } catch (error) {
    console.log(error);
    ErrorHandler({
      message: error?.response?.data?.response_message ?? "error",
    });
  }
};

const zoopRedirect = async (req, res) => {
  try {
    // console.log("Redirect2: ", JSON.parse(req.body.payload));
    const action = req.query.action;
    const data = JSON.parse(req.body.payload);
    const request_id = data?.request_id ?? null;
    const status = data?.result?.[0]?.status;
    if (request_id) {
      await table.ZoopModel.deleteByRequestId(request_id);
    }
    const htmlPath = path.join(
      process.cwd(),
      "views",
      "html",
      action === "digilocker-success" && status === "FETCHED"
        ? "thank-you-kyc.html"
        : "error-kyc.html"
    );
    const htmlContent = fs.readFileSync(htmlPath, "utf8");

    return res
      .header("Content-Type", "text/html; charset=utf-8")
      .send(htmlContent);
  } catch (error) {
    console.log(error);
    ErrorHandler({
      message: error?.response?.data?.response_message ?? "error",
    });
  }
};

export default {
  zoopInit: zoopInit,
  zoopCallback: zoopCallback,
  zoopRedirect: zoopRedirect,
};
