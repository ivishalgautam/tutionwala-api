"use strict";
import { ErrorHandler } from "../../helpers/handleError.js";
import {
  deleteFile as deleteStoredFile,
  uploadFiles,
  getFile,
} from "../../helpers/file.js";
import {
  deleteKey,
  generateSignedUrl,
  presignedPUTURL,
} from "../../helpers/s3.js";

const upload = async (req, res) => {
  let { path } = await uploadFiles(req);
  res.send(path);
};

const get = async (req, res) => {
  res.send(await getFile(req, res));
};

const deleteObjKey = async (req, res) => {
  await deleteKey(req.query.key);
  res.send({ status: true, message: "File deleted." });
};

const presignedPutUrl = async (req, res) => {
  const { name, type, size } = req.body.file;
  const url = await presignedPUTURL(name, type, size);
  res.send({ url });
};

const presignedPutUrls = async (req, res) => {
  const urls = await presignedPUTURL();
  res.send({ urls });
};

const signedUrl = async (req, res) => {
  res.send(
    await generateSignedUrl(
      "public/images/1728375625345_6199489d31fbfc223320117ed67bea133868311fe1bcdaedf94098a45b978de0",
      10
    )
  );
};

const _delete = async (req, res) => {
  const filePath = !req.query || !req.query.file_path;
  if (filePath) {
    return res.send({
      message: "file_path is required parameter",
    });
  }

  const { status, message } = deleteStoredFile(req.query.file_path);
  if (status) {
    res.send({ message });
  } else {
    return ErrorHandler({ code: 404, message });
  }
};

export default {
  upload: upload,
  get: get,
  _delete: _delete,
  signedUrl: signedUrl,
  presignedPutUrl: presignedPutUrl,
  presignedPutUrls: presignedPutUrls,
  deleteObjKey: deleteObjKey,
};
