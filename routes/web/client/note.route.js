import express from 'express';
import { showNoteRoom } from '../../../controllers/web/client/note.controller.js';
const router = express.Router();
router.get("/room/:id/notes", showNoteRoom);
export default router;