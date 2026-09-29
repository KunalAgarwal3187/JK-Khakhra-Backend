import cloudinary from "../src/config/cloudinary.js";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const imageBaseDir = path.resolve(
  __dirname,
  "..",
  "..",
  "JK Khakhra Showcase",
  "src",
  "assets",
  "coin khakhra"
);

const images = [
  {
    name: "fangama-masala",
    path: path.join(imageBaseDir, "image copy 74.webp"),
  },
  {
    name: "tanatan-masala",
    path: path.join(imageBaseDir, "image copy 75.webp"),
  },
  {
    name: "katori-masala",
    path: path.join(imageBaseDir, "image copy 76.webp"),
  },
  {
    name: "peni-masala",
    path: path.join(imageBaseDir, "image copy 73.webp"),
  },
  {
    name: "maida-kaju",
    path: path.join(imageBaseDir, "image copy 77.webp"),
  },
];

async function uploadImages() {
  for (const image of images) {
    try {
      const result = await cloudinary.uploader.upload(image.path, {
        folder: "products/bikaneri-special",
        public_id: image.name,
        resource_type: "image",
      });

      console.log(`${image.name}:`);
      console.log(result.secure_url);
      console.log("--------------------------------");
    } catch (error) {
      console.error(`Failed to upload ${image.name}`);
      console.error(error);
    }
  }
}

uploadImages();