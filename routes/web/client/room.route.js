import express from "express";
const router = express.Router();
import { validateRoomUser } from "../../../middleware/validators/client/roomClientValidator.js";
import { showRoom, showCreateRoom, createRoomClient, leaveOrEndRoom, joinRoomByCode, showRoomMembers } from "../../../controllers/web/client/room.controller.js";

router.get("/room/:id", showRoom);
router.get("/create-room", showCreateRoom);
router.post("/create-room", validateRoomUser ,createRoomClient );
router.post("/room/:id/exit", leaveOrEndRoom);
router.post("/room/join", joinRoomByCode);
export default router;