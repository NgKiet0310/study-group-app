import express from "express";
import { getMessages, getMessageById, deleteMessage } from "../../../controllers/api/admin/message.controller.ts";
const router = express.Router();

router.get('/messages', getMessages);
router.get('/messages/:id',getMessageById);
router.delete('/messages/:id',deleteMessage);

export default router;