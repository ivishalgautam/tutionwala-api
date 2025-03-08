import table from "../../db/models.js";

import axios from "axios";
import configEnv from "../../config/index.js";
import { ErrorHandler } from "../../helpers/handleError.js";

const aadhaarKYCOTPRequest = async (req, res) => {
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

  let data = JSON.stringify({
    mode: "sync",
    data: req.body,
  });

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://live.zoop.one/in/identity/okyc/otp/request",
    headers: {
      "app-id": configEnv.zoop_app_id,
      "api-key": configEnv.zoop_app_key,
      "Content-Type": "application/json",
    },
    data: data,
  };
  try {
    const resp = await axios.request(config);
    if (resp.data.success) {
      console.log(resp.data);
      res.send(resp.data);
    }
  } catch (error) {
    console.log(error);
    ErrorHandler({
      message: error?.response?.data?.response_message ?? "error",
    });
  }
};

const aadhaarKYCOTPVerify = async (req, res) => {
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

  let data = JSON.stringify({
    mode: "sync",
    data: {
      ...req.body,
      consent: "Y",
      consent_text:
        "I hear by declare my consent agreement for fetching my information via ZOOP API",
    },
  });

  let config = {
    method: "post",
    maxBodyLength: Infinity,
    url: "https://live.zoop.one/in/identity/okyc/otp/verify",
    headers: {
      "app-id": configEnv.zoop_app_id,
      "api-key": configEnv.zoop_app_key,
      "Content-Type": "application/json",
    },
    data: data,
  };
  try {
    const resp = await axios.request(config);
    if (resp.data.success) {
      req.body.is_aadhaar_verified = true;
      req.body.fullname = resp.data.result.user_full_name;

      await table.UserModel.update(req, id);

      req.body.details = resp.data.result;

      const record = await table.AadhaarModel.getByUserId(id);
      if (!record) {
        await table.AadhaarModel.create(req, resp.data.result);
      }
      res.send({ status: true, message: "Verified." });
    }
  } catch (error) {
    console.log(error);
    ErrorHandler({
      message: error?.response?.data?.response_message ?? "error",
    });
  }
};

export default {
  aadhaarKYCOTPRequest: aadhaarKYCOTPRequest,
  aadhaarKYCOTPVerify: aadhaarKYCOTPVerify,
};
