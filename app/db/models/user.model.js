"use strict";
import constants from "../../lib/constants/index.js";
import hash from "../../lib/encryption/index.js";
import { DataTypes, QueryTypes } from "sequelize";
import { Op } from "sequelize";
import moment from "moment";

let UserModel = null;

const init = async (sequelize) => {
  UserModel = sequelize.define(
    constants.models.USER_TABLE,
    {
      id: {
        allowNull: false,
        primaryKey: true,
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        unique: true,
      },
      username: {
        type: DataTypes.STRING,
        allowNull: true,
        unique: {
          args: true,
          msg: "Username already in use!",
        },
      },
      dob: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
          args: true,
          msg: "Email address already in use!",
        },
        validate: {
          isEmail: {
            args: true,
            msg: "The email you entered is invalid or is already in our system.",
          },
        },
      },
      mobile_number: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
          args: true,
          msg: "Mobile number already in use!",
        },
        validate: {
          notEmpty: true,
        },
      },
      country_code: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      fullname: {
        type: DataTypes.STRING,
        allowNull: false,
        validate: {
          notEmpty: true,
        },
      },
      father_name: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      password: {
        type: DataTypes.STRING,
        allowNull: true,
      },
      gender: {
        type: DataTypes.ENUM({ values: ["male", "female", ""] }),
        defaultValue: "",
      },
      profile_picture: {
        type: DataTypes.STRING,
        defaultValue: "",
      },
      is_active: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
      },
      role: {
        type: DataTypes.ENUM({
          values: ["admin", "user", "tutor", "student"],
        }),
        defaultValue: "user",
        validate: {
          isIn: {
            args: [["admin", "user", "tutor", "student"]],
            msg: "Role Not Allowed!",
          },
        },
      },
      is_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      is_email_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      is_aadhaar_verified: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      reset_password_token: {
        type: DataTypes.STRING,
      },
      confirmation_token: {
        type: DataTypes.STRING,
      },
    },
    {
      createdAt: "created_at",
      updatedAt: "updated_at",
    }
  );

  await UserModel.sync({ alter: true });
};

const create = async (req) => {
  const hash_password = hash.encrypt(req.body.password);
  const user = await UserModel.create({
    username: req.body.username,
    password: hash_password,
    fullname: req.body?.fullname,
    email: req.body?.email,
    mobile_number: req.body?.mobile_number,
    country_code: req.body?.country_code.replace(/\s/g, ""),
    role: req.body?.role,
    profile_picture: req.body?.profile_picture,
  });
  return user.dataValues;
};

const createCustomer = async (req) => {
  const data = await UserModel.create({
    fullname: req.body?.fullname,
    email: req.body?.email,
    mobile_number: req.body?.mobile_number,
    gender: req.body?.gender,
    country_code: req.body?.country_code?.replace(/\s/g, ""),
    role: req.body?.role,
    profile_picture: req.body?.profile_picture,
  });

  return data.dataValues;
};

const get = async (req) => {
  const whereConditions = ["usr.role != 'admin'"];
  const queryParams = {};
  const q = req.query.q ? req.query.q : null;
  const roles = req.query.role ? req.query.role.split(".") : null;

  if (q) {
    whereConditions.push(
      `(usr.fullname ILIKE :query OR usr.email ILIKE :query)`
    );
    queryParams.query = `%${q}%`;
  }

  if (roles?.length) {
    const isOnlyTutor = roles.length === 1 && roles[0] === "tutor";
    const hasInstitute = roles.includes("institute");
    const filteredRoles = roles.filter((role) => role !== "institute");

    if (isOnlyTutor) {
      whereConditions.push(`usr.role = 'tutor' AND ttr.type = 'individual'`);
    } else if (hasInstitute && roles.length === 1) {
      whereConditions.push("ttr.type = 'institute'");
    } else if (hasInstitute) {
      whereConditions.push(
        "(usr.role = any(:roles) OR ttr.type IN ('institute', 'individual'))"
      );
    } else {
      whereConditions.push("usr.role = any(:roles)");
    }

    if (filteredRoles.length) {
      queryParams.roles = `{${filteredRoles.join(",")}}`;
    }
  }

  const page = req.query.page ? Number(req.query.page) : 1;
  const limit = req.query.limit ? Number(req.query.limit) : null;
  const offset = (page - 1) * limit;

  let whereClause = "";
  if (whereConditions.length) {
    whereClause = `WHERE ${whereConditions.join(" AND ")}`;
  }
  const query = `
  SELECT 
    usr.id, usr.fullname, usr.mobile_number, usr.email, usr.role, 
    usr.is_active, usr.is_verified, usr.created_at, usr.is_aadhaar_verified, usr.is_email_verified,
    ttr.id as tutor_id,
    COUNT(usr.id) OVER()::integer as total,
    CASE
      WHEN usr.role = 'student' THEN st.is_profile_completed ELSE ttr.is_profile_completed
      END,
    CASE
      WHEN usr.role = 'student' THEN st.curr_step ELSE ttr.curr_step
      END
  FROM ${constants.models.USER_TABLE} usr
  LEFT JOIN ${
    constants.models.TUTOR_TABLE
  } ttr ON ttr.user_id = usr.id AND usr.role = 'tutor'
  LEFT JOIN ${
    constants.models.STUDENT_TABLE
  } st ON st.user_id = usr.id AND usr.role = 'student'
  ${whereClause}
  LIMIT :limit OFFSET :offset
  `;

  return await UserModel.sequelize.query(query, {
    replacements: { ...queryParams, limit, offset },
    type: QueryTypes.SELECT,
    raw: true,
  });
};

const getById = async (req, id) => {
  let query = `
   SELECT
    usr.*,
    ttr.profile_picture, stu.profile_picture, 
    ttr.institute_name, ttr.institute_contact_name, ttr.type as tutor_type,
    (
      SELECT json_agg(DISTINCT jsonb_build_object(
        'id', subcat.id,
        'slug', subcat.slug
      ))
      FROM ${constants.models.SUB_CATEGORY_TABLE} subcat
      LEFT JOIN ${constants.models.TUTOR_COURSE_TABLE} ttrcrs 
        ON subcat.id = ttrcrs.course_id
      LEFT JOIN ${constants.models.TUTOR_TABLE} inner_ttr
        ON inner_ttr.id = ttrcrs.tutor_id
      LEFT JOIN ${constants.models.STUDENT_TABLE} inner_stu
        ON inner_stu.user_id = usr.id
      WHERE inner_ttr.user_id = usr.id OR subcat.id = ANY(inner_stu.sub_categories)
    ) AS sub_categories
    FROM ${constants.models.USER_TABLE} usr
    LEFT JOIN ${constants.models.TUTOR_TABLE} ttr 
      ON ttr.user_id = usr.id AND usr.role = 'tutor'
    LEFT JOIN ${constants.models.STUDENT_TABLE} stu 
      ON stu.user_id = usr.id AND usr.role = 'student'
    WHERE usr.id = '${req?.params?.id || id}'
    GROUP BY usr.id, ttr.profile_picture, stu.profile_picture, ttr.type, ttr.institute_name, ttr.institute_contact_name
    LIMIT 1;
    `;

  return await UserModel.sequelize.query(query, {
    type: QueryTypes.SELECT,
    plain: true,
    raw: true,
  });
};

const getByUsername = async (req, record = undefined) => {
  let query = `
    SELECT
        usr.id,
        usr.username,
        usr.password,
        usr.email,
        usr.fullname,
        usr.is_active,
        usr.role,
        usr.mobile_number,
        usr.country_code,
        usr.profile_picture,
        usr.is_verified
      FROM ${constants.models.USER_TABLE} usr
      WHERE usr.username = '${req?.body?.username || record?.user?.username}'
      LIMIT 1
    `;

  return await UserModel.sequelize.query(query, {
    type: QueryTypes.SELECT,
    plain: true,
    raw: true,
  });
};

const getByMobile = async (req, record = undefined) => {
  let query = `
    SELECT
        usr.id,
        usr.username,
        usr.password,
        usr.email,
        usr.fullname,
        usr.is_active,
        usr.role,
        usr.mobile_number,
        usr.country_code,
        usr.is_verified,
        usr.profile_picture,
        json_agg(
          json_build_object(
            'id', subcat.id,
            'slug', subcat.slug
          )
        ) as sub_categories
      FROM ${constants.models.USER_TABLE} usr
      LEFT JOIN ${constants.models.TUTOR_TABLE} ttr ON ttr.user_id = usr.id AND usr.role = 'tutor'
      LEFT JOIN ${constants.models.TUTOR_COURSE_TABLE} ttrcrs ON ttrcrs.tutor_id = ttr.id
      LEFT JOIN ${constants.models.STUDENT_TABLE} stu ON stu.user_id = usr.id AND usr.role = 'student'
      LEFT JOIN ${constants.models.SUB_CATEGORY_TABLE} subcat ON subcat.id = ttrcrs.course_id OR subcat.id = ANY(stu.sub_categories)
      WHERE usr.mobile_number = '${req?.body?.mobile_number}'
      GROUP BY
          usr.id
      LIMIT 1
    `;

  return await UserModel.sequelize.query(query, {
    type: QueryTypes.SELECT,
    plain: true,
    raw: true,
  });
};

const update = async (req, id) => {
  return await UserModel.update(
    {
      username: req.body?.username,
      fullname: req.body?.fullname,
      email: req.body?.email,
      mobile_number: req.body?.mobile_number,
      gender: req.body?.gender,
      country_code: req.body?.country_code?.replace(/\s/g, ""),
      role: req.body?.role,
      profile_picture: req.body?.profile_picture,
      dob: req.body?.dob ?? null,
      is_aadhaar_verified: req.body?.is_aadhaar_verified,
      is_email_verified: req.body?.is_email_verified,
      father_name: req.body?.father_name,
    },
    {
      where: {
        id: req?.params?.id || id,
      },
      returning: [
        "id",
        "username",
        "email",
        "fullname",
        "is_active",
        "role",
        "mobile_number",
        "country_code",
        "is_verified",
        "profile_picture",
      ],
      plain: true,
    }
  );
};

const updatePassword = async (req, user_id) => {
  const hash_password = hash.encrypt(req.body.new_password);
  return await UserModel.update(
    {
      password: hash_password,
    },
    {
      where: {
        id: req.params?.id || user_id,
      },
    }
  );
};

const deleteById = async (req, user_id, { transaction }) => {
  return await UserModel.destroy({
    where: {
      id: req?.params?.id || user_id,
    },
    returning: true,
    raw: true,
    transaction,
  });
};

const getAadhaarDetails = async (req, user_id) => {
  let query = `
  SELECT
      adhr.*
    FROM ${constants.models.AADHAAR_TABLE} adhr
    WHERE adhr.user_id = :userId
  `;

  return await UserModel.sequelize.query(query, {
    replacements: {
      userId: req?.params?.id || user_id,
    },
    type: QueryTypes.SELECT,
    raw: true,
    plain: true,
  });
};

const countUser = async (last_30_days = false) => {
  let where_query;
  if (last_30_days) {
    where_query = {
      created_at: {
        [Op.gte]: moment()
          .subtract(30, "days")
          .format("YYYY-MM-DD HH:mm:ss.SSSZ"),
      },
    };
  }
  return await UserModel.findAll({
    where: where_query,
    attributes: [
      "role",
      [
        UserModel.sequelize.fn("COUNT", UserModel.sequelize.col("role")),
        "total",
      ],
    ],
    group: "role",
    raw: true,
  });
};

const getByEmailId = async (req) => {
  return await UserModel.findOne({
    where: {
      email: req.body.email,
    },
  });
};

const getByPk = async (pk) => {
  return await UserModel.findByPk(pk, { plain: true, raw: true });
};

const getByResetToken = async (req) => {
  return await UserModel.findOne({
    where: {
      reset_password_token: req.params.token,
    },
  });
};

const getByUserIds = async (user_ids) => {
  return await UserModel.findAll({
    where: {
      id: {
        [Op.in]: user_ids,
      },
    },
  });
};

const updateStatus = async (id, status) => {
  const [rowCount, rows] = await UserModel.update(
    {
      is_active: status,
    },
    {
      where: {
        id: id,
      },
      returning: [
        "id",
        "username",
        "email",
        "fullname",
        "is_active",
        "role",
        "mobile_number",
        "country_code",
        "is_verified",
        "profile_picture",
      ],
      plain: true,
      raw: true,
    }
  );

  return rows;
};

const verify = async ({ user_id, status }) => {
  const [rowCount, rows] = await UserModel.update(
    {
      is_verified: status,
    },
    {
      where: {
        id: user_id,
      },
      plain: true,
      raw: true,
    }
  );

  return rows;
};

const verifyEmail = async ({ user_id, status }) => {
  const [rowCount, rows] = await UserModel.update(
    {
      is_email_verified: status,
    },
    {
      where: {
        id: user_id,
      },
      plain: true,
      raw: true,
    }
  );

  return rows;
};

const verifyAadhaar = async ({ user_id, status }) => {
  const [rowCount, rows] = await UserModel.update(
    {
      is_aadhaar_verified: status,
    },
    {
      where: {
        id: user_id,
      },
      plain: true,
      raw: true,
    }
  );

  return rows;
};

const findUsersWithBirthdayToday = async () => {
  const startIST = moment().startOf("day").toDate();
  const endIST = moment().endOf("day").toDate();

  try {
    const usersWithBirthdayToday = await UserModel.findAll({
      where: {
        birth_date: {
          [Op.between]: [startIST, endIST],
        },
        role: {
          [Op.in]: ["teacher", "student"],
        },
      },
    });

    return usersWithBirthdayToday;
  } catch (error) {
    console.error("Error finding users with birthday today:", error);
    throw error;
  }
};

export default {
  init: init,
  create: create,
  get: get,
  getById: getById,
  getByUsername: getByUsername,
  update: update,
  updatePassword: updatePassword,
  deleteById: deleteById,
  countUser: countUser,
  getByEmailId: getByEmailId,
  getByResetToken: getByResetToken,
  getByUserIds: getByUserIds,
  findUsersWithBirthdayToday: findUsersWithBirthdayToday,
  updateStatus: updateStatus,
  verify: verify,
  getByMobile: getByMobile,
  createCustomer: createCustomer,
  getByPk: getByPk,
  getAadhaarDetails: getAadhaarDetails,
  verifyEmail: verifyEmail,
  verifyAadhaar: verifyAadhaar,
};
