import express from "express";
import { createNote, deleteNote, getNoteById, getNotes, updateNote } from "../../../controllers/api/admin/note.controller.js";
const router = express.Router();

router.get('/notes',getNotes);
router.post('/notes', createNote);
router.get('/notes/:id',getNoteById);
router.put('/notes/:id', updateNote);
router.delete('/notes/:id', deleteNote);
export default router;