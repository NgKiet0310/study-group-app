import express from "express";
const router = express.Router();
import { validateRoomUser } from "../../../middleware/validators/client/roomClientValidator.js";
import { showRoom, showCreateRoom, createRoomClient, leaveOrEndRoom, joinRoomByCode, showRoomMembers, showMeet } from "../../../controllers/web/client/room.controller.js";
import { checkRoomAccess } from "../../../middleware/checkRoom.js";

router.get("/room/:id", checkRoomAccess ,showRoom);
router.get("/create-room", showCreateRoom);
router.post("/create-room", validateRoomUser ,createRoomClient );
router.post("/room/:id/exit" , checkRoomAccess, leaveOrEndRoom);
router.post("/room/join", joinRoomByCode);
router.get("/room/:id/meet", showMeet);

export default router;