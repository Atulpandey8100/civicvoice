import dotenv from 'dotenv';
dotenv.config();
import ImageKit from "imagekit";

export const imagekitEnabled =
  Boolean(process.env.IMAGEKIT_PUBLIC_KEY) &&
  Boolean(process.env.IMAGEKIT_PRIVATE_KEY) &&
  Boolean(process.env.IMAGEKIT_URL_ENDPOINT);

let imagekit = null;

if (imagekitEnabled) {
  imagekit = new ImageKit({
    publicKey: process.env.IMAGEKIT_PUBLIC_KEY,
    privateKey: process.env.IMAGEKIT_PRIVATE_KEY,
    urlEndpoint: process.env.IMAGEKIT_URL_ENDPOINT
  });
}

export default imagekit;
