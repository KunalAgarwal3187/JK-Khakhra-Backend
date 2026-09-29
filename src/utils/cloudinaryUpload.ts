import { Readable } from "node:stream";
import cloudinary from "../config/cloudinary.js";

export type CloudinaryUploadResult = {
  url: string;
  publicId: string;
};

/**
 * Upload an in-memory file buffer to Cloudinary and return the public URL.
 */
export const uploadBufferToCloudinary = (
  buffer: Buffer,
  options: {
    folder: string;
    originalName?: string;
  }
): Promise<CloudinaryUploadResult> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder,
        resource_type: "image",
        overwrite: false,
        unique_filename: true,
        use_filename: Boolean(options.originalName),
        filename_override: options.originalName
          ? options.originalName.replace(/\.[^.]+$/, "")
          : undefined,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary upload failed"));
          return;
        }
        resolve({
          url: result.secure_url,
          publicId: result.public_id,
        });
      }
    );

    Readable.from(buffer).pipe(uploadStream);
  });
};
