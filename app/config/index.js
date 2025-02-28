"use strict";
import "dotenv/config";

process.env.PORT = process.env.PORT || 3001;

const config = {
  port: parseInt(process.env.PORT, 10),

  // postgres creds
  pg_database_name: process.env.PG_DATABASE_NAME,
  pg_username: process.env.PG_USERNAME,
  pg_password: process.env.PG_PASSWORD,
  pg_host: process.env.PG_HOST,
  pg_dialect: process.env.DB_DIALECT,

  // node env
  node_env: process.env.NODE_ENV ?? "production",

  // jwt secret key
  jwt_secret: process.env.SECRET_TOKEN,
  jwt_refresh_secret: process.env.REFRESH_SECRET_TOKEN,
  smtp_from_email: process.env.SMTP_EMAIL,
  smtp_port: parseInt(process.env.SMTP_PORT) || 465,
  smtp_host: process.env.SMTP_SERVER || "smtp.gmail.com",
  smtp_password: process.env.SMTP_PASSWORD,

  waffly_template_name: process.env.WAFFLY_TEMPLATE_NAME,
  waffly_api_key: process.env.WAFFLY_API_KEY,
  waffly_license_no: process.env.WAFFLY_LICENSE_NO,

  // smartping
  smartping_username: process.env.SMARTPING_USERNAME,
  smartping_password: process.env.SMARTPING_PASSWORD,
  smartping_content_id: process.env.SMARTPING_CONTENT_ID,
};

export default config;
