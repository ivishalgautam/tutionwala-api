"use strict";
import table from "../../db/models.js";

const getReport = async (req, res) => {
  const user = await table.UserModel.countUser();
  const category = await table.CategoryModel.countCategory();
  const subCategory = await table.SubCategoryModel.countSubCategory();
  let reports = {};
  for (const i in user) {
    reports[`total_${user[i].role}`] = parseInt(user[i].total);
  }
  reports.total_category = category;
  reports.total_sub_category = subCategory;
  return res.send(reports);
};

const getLast30Days = async (req, res) => {
  const user = await table.UserModel.countUser(true);
  const category = await table.CategoryModel.countCategory(true);
  const subCategory = await table.SubCategoryModel.countSubCategory(true);
  let reports = {};
  for (const i in user) {
    reports[`total_${user[i].role}`] = parseInt(user[i].total);
  }
  reports.total_category = category;
  reports.total_sub_category = subCategory;
  return res.send(reports);
};

export default {
  getReport: getReport,
  getLast30Days: getLast30Days,
};
