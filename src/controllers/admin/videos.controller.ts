import { Request, Response } from "express";
import { Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../../lib/prisma.js";
import {
  deleteCloudinaryVideo,
  uploadVideoBufferToCloudinary,
} from "../../utils/cloudinaryVideoUpload.js";

/** Homepage Snack Shorts cards — hard cap */
export const MAX_SHOW_VIDEOS = 6;

export const MAX_SHOW_MESSAGE =
  "At max 6 videos can be selected. First unselect any video to show this video.";

const VIDEO_SELECT = {
  id: true,
  videoUrl: true,
  publicId: true,
  displayOrder: true,
  isActive: true,
  isShow: true,
  createdAt: true,
  updatedAt: true,
} as const;

const parseBool = (value: unknown, fallback = false): boolean => {
  if (value === undefined || value === null || value === "") return fallback;
  if (typeof value === "boolean") return value;
  if (typeof value === "string") {
    const v = value.toLowerCase().trim();
    if (v === "true" || v === "1") return true;
    if (v === "false" || v === "0") return false;
  }
  return fallback;
};

const parseOptionalInt = (value: unknown): number | undefined => {
  if (value === undefined || value === null || value === "") return undefined;
  const n = Number(value);
  return Number.isInteger(n) ? n : undefined;
};

/**
 * Ensure enabling isShow won't exceed 6.
 * excludeId = video being updated (so its current true doesn't count against itself wrongly... 
 * actually we count others with isShow true).
 */
const assertCanEnableIsShow = async (excludeId?: number) => {
  const count = await prisma.video.count({
    where: {
      isShow: true,
      ...(excludeId ? { id: { not: excludeId } } : {}),
    },
  });

  if (count >= MAX_SHOW_VIDEOS) {
    return false;
  }
  return true;
};

export const listVideos = async (req: Request, res: Response) => {
  try {
    const status =
      typeof req.query.status === "string" ? req.query.status.toLowerCase() : "";
    const show =
      typeof req.query.isShow === "string"
        ? req.query.isShow.toLowerCase()
        : "";

    const started = performance.now();
    const videos = await prisma.video.findMany({
      select: VIDEO_SELECT,
      orderBy: [{ displayOrder: "asc" }, { id: "asc" }],
    });
    console.log(
      `[admin/videos] db=${Math.round(performance.now() - started)}ms rows=${videos.length}`
    );

    const showCount = videos.reduce((n, v) => n + (v.isShow ? 1 : 0), 0);

    const items = videos.filter((v) => {
      if (status === "active" && !v.isActive) return false;
      if (status === "inactive" && v.isActive) return false;
      if ((show === "true" || show === "1") && !v.isShow) return false;
      if ((show === "false" || show === "0") && v.isShow) return false;
      return true;
    });

    return res.status(200).json({
      success: true,
      data: {
        items,
        showCount,
        maxShow: MAX_SHOW_VIDEOS,
      },
    });
  } catch (error) {
    console.error("Error listing videos:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Create video — file arrives in multipart payload.
 * Cloudinary upload happens HERE on Save only (not on file pick).
 */
export const createVideo = async (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Video file is required. Select a video and click Save.",
      });
    }

    const isShow = parseBool(req.body?.isShow, false);
    const isActive = parseBool(req.body?.isActive, true);
    let displayOrder = parseOptionalInt(req.body?.displayOrder);

    if (isShow) {
      const canShow = await assertCanEnableIsShow();
      if (!canShow) {
        return res.status(400).json({
          success: false,
          message: MAX_SHOW_MESSAGE,
        });
      }
    }

    if (displayOrder === undefined) {
      const max = await prisma.video.aggregate({ _max: { displayOrder: true } });
      displayOrder = (max._max.displayOrder ?? -1) + 1;
    }

    // Upload to Cloudinary only after validation passes
    const uploaded = await uploadVideoBufferToCloudinary(req.file.buffer, {
      folder: "videos/snack-shorts",
      originalName: req.file.originalname,
    });

    const video = await prisma.video.create({
      data: {
        videoUrl: uploaded.url,
        publicId: uploaded.publicId,
        displayOrder,
        isActive,
        isShow,
      },
      select: VIDEO_SELECT,
    });

    return res.status(201).json({
      success: true,
      data: video,
      message: "Video saved successfully",
    });
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return res.status(409).json({
        success: false,
        message: "A video with this public id already exists",
      });
    }
    console.error("Error creating video:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to save video. Please try again.",
    });
  }
};

/**
 * Update video metadata; optional new video file in payload.
 * If a new file is sent, upload to Cloudinary on Save, then replace DB URL.
 */
export const updateVideo = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        success: false,
        message: "Valid video id is required",
      });
    }

    const existing = await prisma.video.findUnique({
      where: { id },
      select: VIDEO_SELECT,
    });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    const hasIsShow = req.body?.isShow !== undefined && req.body?.isShow !== "";
    const hasIsActive =
      req.body?.isActive !== undefined && req.body?.isActive !== "";
    const displayOrder = parseOptionalInt(req.body?.displayOrder);

    const nextIsShow = hasIsShow
      ? parseBool(req.body.isShow, existing.isShow)
      : existing.isShow;

    if (nextIsShow && !existing.isShow) {
      const canShow = await assertCanEnableIsShow(id);
      if (!canShow) {
        return res.status(400).json({
          success: false,
          message: MAX_SHOW_MESSAGE,
        });
      }
    }

    let videoUrl = existing.videoUrl;
    let publicId = existing.publicId;

    if (req.file) {
      const uploaded = await uploadVideoBufferToCloudinary(req.file.buffer, {
        folder: "videos/snack-shorts",
        originalName: req.file.originalname,
      });
      videoUrl = uploaded.url;
      publicId = uploaded.publicId;
      // Best-effort cleanup of previous Cloudinary asset
      if (existing.publicId !== publicId) {
        await deleteCloudinaryVideo(existing.publicId);
      }
    }

    const video = await prisma.video.update({
      where: { id },
      data: {
        videoUrl,
        publicId,
        ...(displayOrder !== undefined && { displayOrder }),
        ...(hasIsActive && { isActive: parseBool(req.body.isActive, true) }),
        ...(hasIsShow && { isShow: nextIsShow }),
      },
      select: VIDEO_SELECT,
    });

    return res.status(200).json({
      success: true,
      data: video,
      message: "Video updated successfully",
    });
  } catch (error) {
    console.error("Error updating video:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to update video. Please try again.",
    });
  }
};

export const updateVideoShow = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        success: false,
        message: "Valid video id is required",
      });
    }

    if (typeof req.body?.isShow !== "boolean") {
      return res.status(400).json({
        success: false,
        message: "isShow (boolean) is required",
      });
    }

    const existing = await prisma.video.findUnique({
      where: { id },
      select: { id: true, isShow: true },
    });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    if (req.body.isShow && !existing.isShow) {
      const canShow = await assertCanEnableIsShow(id);
      if (!canShow) {
        return res.status(400).json({
          success: false,
          message: MAX_SHOW_MESSAGE,
        });
      }
    }

    const video = await prisma.video.update({
      where: { id },
      data: { isShow: req.body.isShow },
      select: VIDEO_SELECT,
    });

    return res.status(200).json({
      success: true,
      data: video,
      message: req.body.isShow
        ? "Video marked to show on homepage"
        : "Video hidden from homepage",
    });
  } catch (error) {
    console.error("Error updating video show flag:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

export const deleteVideo = async (req: Request, res: Response) => {
  try {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id < 1) {
      return res.status(400).json({
        success: false,
        message: "Valid video id is required",
      });
    }

    const existing = await prisma.video.findUnique({
      where: { id },
      select: { id: true, publicId: true },
    });
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Video not found",
      });
    }

    await prisma.video.delete({ where: { id } });
    await deleteCloudinaryVideo(existing.publicId);

    return res.status(200).json({
      success: true,
      message: "Video deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting video:", error);
    return res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};
