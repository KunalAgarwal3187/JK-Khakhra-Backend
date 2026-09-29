import { Router } from "express";
import {
  blockUser,
  getUserById,
  listUsers,
  unblockUser,
} from "../../controllers/admin/users.controller.js";

const router = Router();

router.get("/", listUsers);
router.get("/:id", getUserById);
router.patch("/:id/block", blockUser);
router.patch("/:id/unblock", unblockUser);

export default router;
