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

// Hiển thị danh sách notes
router.get("/room/:id/notes", checkRoomAccess, showNoteRoom);

// Tạo note mới
router.post("/room/:id/notes", checkRoomAccess, noteValidator, createNote);

// Xem chi tiết note (optional - nếu muốn có trang riêng)
router.get("/room/:id/notes/:noteId/view", checkRoomAccess, viewNote);

// Cập nhật note (dùng POST với form)
router.post("/room/:id/notes/:noteId", checkRoomAccess, noteValidator, updateNote);

// Xóa note
router.post("/room/:id/notes/:noteId/delete", checkRoomAccess, deleteNote);

export default router;