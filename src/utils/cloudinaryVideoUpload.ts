import { Readable } from "node:stream";
import cloudinary from "../config/cloudinary.js";

export type CloudinaryVideoUploadResult = {
  url: string;
  publicId: string;
};

/**
 * Upload an in-memory video buffer to Cloudinary (resource_type: video).
 * Call this only on Save — never on client-side file pick.
 */
export const uploadVideoBufferToCloudinary = (
  buffer: Buffer,
  options: {
    folder?: string;
    originalName?: string;
  } = {}
): Promise<CloudinaryVideoUploadResult> => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: options.folder ?? "videos/snack-shorts",
        resource_type: "video",
        overwrite: false,
        unique_filename: true,
        use_filename: Boolean(options.originalName),
        filename_override: options.originalName
          ? options.originalName.replace(/\.[^.]+$/, "")
          : undefined,
      },
      (error, result) => {
        if (error || !result) {
          reject(error ?? new Error("Cloudinary video upload failed"));
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

export const deleteCloudinaryVideo = async (publicId: string) => {
  try {
    await cloudinary.uploader.destroy(publicId, { resource_type: "video" });
  } catch (error) {
    console.error("Failed to delete Cloudinary video:", publicId, error);
  }
};
