import axios from "axios";
import config from "../config/index.js";

export async function sendOtp({ country_code, mobile_number, fullname, otp }) {
  let configObj = {
    method: "get",
    maxBodyLength: Infinity,
    url: `https://app.wafly.in/api/sendtemplate.php?LicenseNumber=${config.waffly_license_no}&APIKey=${config.waffly_api_key}&Contact=${country_code}${mobile_number}&Template=${config.waffly_template_name}&Param=${fullname},${otp}`,
    headers: {},
  };

  const resp = await axios(configObj);
  console.log({ waffly_resp: JSON.stringify(resp.data) });
  return resp;
}
