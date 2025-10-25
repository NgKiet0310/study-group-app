import express from "express";
import { showFilesRoom } from "../../../controllers/web/client/file.controller.js";
const router = express.Router();
import { checkRoomAccess } from "../../../middleware/checkRoom.js";

router.get("/room/:id/files", checkRoomAccess ,showFilesRoom);
export default router;