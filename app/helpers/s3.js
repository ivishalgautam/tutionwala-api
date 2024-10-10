import {
  GetObjectCommand,
  S3Client,
  PutObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import constants from "../lib/constants/index.js";
import { randomBytesGenerator } from "../lib/encryption/index.js";
import { ErrorHandler } from "./handleError.js";
const { imageMime, videoMime, docsMime } = constants.mime;

const bucketName = process.env.BUCKET_NAME;
const bucketRegion = process.env.BUCKET_REGION;
const accessKey = process.env.ACCESS_KEY;
const secretAccessKey = process.env.SECRET_ACCESS_KEY;

const params = {
  credentials: {
    accessKeyId: accessKey,
    secretAccessKey: secretAccessKey,
  },
  region: bucketRegion,
};

const s3 = new S3Client(params);

export const generateSignedUrl = async (key, expiresIn = 3600) => {
  const command = new GetObjectCommand({ Bucket: bucketName, Key: key });
  const url = await getSignedUrl(s3, command, { expiresIn: expiresIn });
  return url;
};

export const deleteKey = async (key) => {
  try {
    const command = new DeleteObjectCommand({ Bucket: bucketName, Key: key });
    await s3.send(command);
  } catch (error) {
    return ErrorHandler({ message: error.message });
  }
};

export const presignedPUTURL = async (
  filename,
  mimetype,
  size,
  expiresIn = 60 * 5
) => {
  try {
    let folder;
    const sizeInMB = size / 1024 / 1024;
    const mime = mimetype.split("/").pop();
    if (imageMime.includes(mime)) {
      folder = "public/images/";
    } else if (videoMime.includes(mime)) {
      folder = "public/videos/";
      if (sizeInMB > 100) {
        return ErrorHandler({ message: "Video must be less than 100MB!" });
      }
    } else if (docsMime.includes(mime)) {
      folder = "public/docs/";
    } else {
      folder = "public/";
    }
    const name = filename.replace(/[\s'/]/g, "_").toLowerCase();
    const key = `${folder}${randomBytesGenerator(16)}-${name}`;
    const command = new PutObjectCommand({ Bucket: bucketName, Key: key });

    const uploadUrl = await getSignedUrl(s3, command, { expiresIn });
    return uploadUrl;
  } catch (error) {
    return ErrorHandler({ message: error.message });
  }
};
