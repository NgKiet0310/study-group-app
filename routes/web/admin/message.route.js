import express from "express";
import { deleteMessage, showMessageDetail, showMessages } from "../../../controllers/web/admin/message.controller.js";
const router = express.Router();

router.get('/',showMessages);
router.get('/detail/:id', showMessageDetail);
router.post('/delete/:id', deleteMessage);
export default router;