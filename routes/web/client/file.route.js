import express from "express";
import { showFilesRoom } from "../../../controllers/web/client/file.controller.js";
const router = express.Router();

router.get("/room/:id/files", showFilesRoom);
export default router;