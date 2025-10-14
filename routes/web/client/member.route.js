import express from "express";
import { showRoomMembers } from "../../../controllers/web/client/member.controller.js";
const router = express.Router();

router.get("/room/:id/members", showRoomMembers);

export default router;