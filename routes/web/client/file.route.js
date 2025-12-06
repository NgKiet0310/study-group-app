import express from "express";
import multer from "multer";
import path from "path";
import { 
  showFileRoom, 
  uploadFile, 
  updateFile, 
  deleteFile 
} from "../../../controllers/web/client/file.controller.js";
import { checkRoomAccess } from "../../../middleware/checkRoom.js";

const router = express.Router();

// Cấu hình Multer để upload file
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/'); // Thư mục lưu file
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname);
  }
});

// Giới hạn kích thước và loại file
const fileFilter = (req, file, cb) => {
  // Chỉ chấp nhận các loại file cụ thể
  const allowedTypes = /jpeg|jpg|png|gif|pdf|doc|docx|txt|xlsx|xls|ppt|pptx|zip|rar/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('Chỉ chấp nhận file ảnh, PDF, Word, Excel, PowerPoint, Text, và nén!'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // Giới hạn 10MB
  },
  fileFilter: fileFilter
});

// Routes
router.get("/room/:id/files", checkRoomAccess, showFileRoom);
router.post("/room/:id/files", checkRoomAccess, upload.single('file'), uploadFile);
router.post("/room/:id/files/:fileId", checkRoomAccess, updateFile);
router.post("/room/:id/files/:fileId/delete", checkRoomAccess, deleteFile);

export default router;