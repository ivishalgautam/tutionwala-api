import axios from "axios";

const init = async () => {
  try {
    let config = {
      method: "post",
      maxBodyLength: Infinity,
      url: "https://live.zoop.plus/identity/digilocker/v1/init",
      headers: {
        "app-id": process.env.ZOOP_APP_ID,
        "api-key": process.env.ZOOP_APP_KEY,
        "Content-Type": "application/json",
      },
      data: JSON.stringify({
        docs: ["ADHAR"],
        purpose: "lll",
        response_url: `${process.env.NEXT_PUBLIC_API_URL}/zoop/callback`,
        redirect_url: `${process.env.NEXT_PUBLIC_API_URL}/zoop/redirect`,
        pinless: false,
      }),
    };

    const { data } = await axios.request(config);
    return data;
  } catch (error) {
    throw error;
  }
};

const checkStatus = async (request_id) => {
  try {
    let config = {
      method: "get",
      maxBodyLength: Infinity,
      url: `https://test.zoop.plus/identity/digilocker/v1/fetch/${request_id}`,
      headers: {
        "app-id": "67bc713f25a42400289d43f0",
        "api-key": "PTR3YC5-WE64FWC-MJPQEHR-8JK4NHH",
        "Content-Type": "application/json",
      },
    };

    const { data } = await axios.request(config);
    console.log({ status: data });
    return data;
  } catch (error) {
    throw error;
  }
};

export const Zoop = {
  init: init,
  checkStatus: checkStatus,
};
