import express from "express";
const router = express.Router();
import { showRoom, showCreateRoom } from "../../../controllers/web/client/room.controller.js";

router.get("/room/:id", showRoom);
router.get("/create-room", showCreateRoom);

export default router;