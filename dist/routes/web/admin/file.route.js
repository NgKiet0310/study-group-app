import express from "express";
import { deleteFile, showFileDetail, showFiles } from "../../../controllers/web/admin/file.controller.js";
const router = express.Router();
router.get('/', showFiles);
router.get('/detail/:id', showFileDetail);
router.post('/delete/:id', deleteFile);
export default router;
//# sourceMappingURL=file.route.js.map