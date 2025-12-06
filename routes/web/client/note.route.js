import express from "express";
import { 
  showNoteRoom,
  createNote,
  updateNote,
  deleteNote,
  viewNote
} from "../../../controllers/web/client/note.controller.js";
import { noteValidator } from "../../../middleware/validators/client/noteClientValidator.js";
import { checkRoomAccess } from "../../../middleware/checkRoom.js";

const router = express.Router();

router.get("/room/:id/notes", checkRoomAccess, showNoteRoom);
router.post("/room/:id/notes", checkRoomAccess, noteValidator, createNote);
router.get("/room/:id/notes/:noteId/view", checkRoomAccess, viewNote);
router.post("/room/:id/notes/:noteId", checkRoomAccess, noteValidator, updateNote);
router.post("/room/:id/notes/:noteId/delete", checkRoomAccess, deleteNote);

export default router;