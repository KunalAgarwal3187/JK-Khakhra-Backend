import { Router } from "express";
import {
  createVideo,
  deleteVideo,
  listVideos,
  updateVideo,
  updateVideoShow,
} from "../../controllers/admin/videos.controller.js";
import {
  uploadVideoMiddleware,
  uploadVideoOptionalMiddleware,
} from "../../middleware/uploadVideo.js";

const router = Router();

router.get("/", listVideos);
// File is sent in payload; Cloudinary upload happens inside createVideo on Save
router.post("/", uploadVideoMiddleware, createVideo);
router.put("/:id", uploadVideoOptionalMiddleware, updateVideo);
router.patch("/:id/show", updateVideoShow);
router.delete("/:id", deleteVideo);

export default router;
