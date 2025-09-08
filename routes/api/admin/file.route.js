import express from "express";
import { getFiles, getFileById, deleteFile } from "../../../controllers/api/admin/file.controller.ts";
const router = express.Router();

router.get('/files',getFiles);
router.get('/files/:id', getFileById);
router.delete('/files/:id',deleteFile);

export default router;