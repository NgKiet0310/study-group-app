import express from "express";
import { createNote, deleteNote, editNote, showCreateForm, showEditForm, showNoteDetail, showNotes } from "../../../controllers/web/admin/note.controller.js";
import { validateNote } from "../../../middleware/validators/noteValidator.js";
const router = express.Router();

router.get('/', showNotes);
router.get('/create', showCreateForm);
router.post('/create', createNote, validateNote);
router.get('/edit/:id',showEditForm);
router.post('/edit/:id', editNote, validateNote);
router.get('/detail/:id', showNoteDetail);
router.post('/delete/:id', deleteNote);
export default router;