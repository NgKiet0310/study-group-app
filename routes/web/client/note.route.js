import express from 'express';
import { showNoteRoom } from '../../../controllers/web/client/note.controller.js';
const router = express.Router();
import { checkRoomAccess } from "../../../middleware/checkRoom.js";

router.get("/room/:id/notes", checkRoomAccess ,showNoteRoom);
export default router;