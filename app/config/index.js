"use strict";
import "dotenv/config";

// Set the NODE_ENV to 'development' by default
process.env.NODE_ENV = process.env.NODE_ENV || "development";
process.env.PORT = process.env.PORT || 3001;

const config = {
  port: parseInt(process.env.PORT, 10),

  // postgres creds
  pg_database_name: process.env.PG_DATABASE_NAME,
  pg_username: process.env.PG_USERNAME,
  pg_password: process.env.PG_PASSWORD,
  pg_host: process.env.PG_HOST,
  pg_dialect: process.env.DB_DIALECT,

  // jwt secret key
  jwt_secret: process.env.SECRET_TOKEN,
  jwt_refresh_secret: process.env.REFRESH_SECRET_TOKEN,
  smtp_from_email: process.env.SMTP_EMAIL || "tech.bdseducation@gmail.com",
  smtp_port: parseInt(process.env.SMTP_PORT) || 465,
  smtp_host: process.env.SMTP_SERVER || "smtp.gmail.com",
  smtp_password: process.env.SMTP_PASSWORD,
};

export default config;
