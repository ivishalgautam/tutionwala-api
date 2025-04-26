"use strict";

import axios from "axios";
import config from "../config/index.js";

export async function sendDltOtp({ country_code = "+91", phone, otp }) {
  return true;
  let axiosConfig = {
    method: "get",
    maxBodyLength: Infinity,
    url: `https://pgapi.smartping.ai/fe/api/v1/send?username=${config.smartping_username}&password=${config.smartping_password}&unicode=false&from=TUTWLA&to=${phone}&text=Welcome%20to%20Tutionwala%20Your%20OTP%20for%20account%20verification%20is%20${otp}.%20%0AThis%20OTP%20will%20expire%20in%205%20minutes.%20%0ADo%20not%20share%20it%20with%20anyone&dltContentId=${config.smartping_content_id}`,

    headers: {},
  };
  try {
    if (config.node_env === "development") return { state: "SUBMIT_ACCEPTED" };

    const resp = await axios.request(axiosConfig);
    return resp.data;
  } catch (error) {
    throw error;
  }
}
