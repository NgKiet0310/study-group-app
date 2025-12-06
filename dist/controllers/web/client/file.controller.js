import Room from "../../../models/Room.js";
import File from "../../../models/File.js";
import { formatDate } from "../../../helpers/dateHelper.js";
import { deletePhysicalFile, deleteMultipleFiles, determineFileType, formatFileSize } from "../../../helpers/fileHelper.js";
// Hiển thị danh sách file
export const showFileRoom = async (req, res) => {
    try {
        const roomId = req.params.id;
        const page = parseInt(req.query.page) || 1;
        const search = req.query.search || '';
        const limit = 12; // 12 files per page
        const skip = (page - 1) * limit;
        const room = await Room.findById(roomId).populate("admin members.user");
        if (!room) {
            return res.status(404).render("client/pages/404", { message: "Room not found" });
        }
        // Query tìm kiếm
        const query = { room: roomId };
        if (search) {
            query.fileName = { $regex: search, $options: 'i' };
        }
        const totalFiles = await File.countDocuments(query);
        const totalPages = Math.ceil(totalFiles / limit);
        const files = await File.find(query)
            .populate("uploadedBy", "username")
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        // Format files với thông tin bổ sung
        const formattedFiles = files.map(f => ({
            ...f.toObject(),
            fileSizeFormatted: formatFileSize(f.fileSize)
        }));
        // Lấy success/error message từ session
        const success = req.session.success;
        const error = req.session.error;
        delete req.session.success;
        delete req.session.error;
        res.render("client/pages/room/room", {
            room,
            activeTab: "files",
            user: req.session.user,
            files: formattedFiles,
            page,
            totalPages,
            search,
            success,
            error
        });
    }
    catch (err) {
        console.error("Error in showFileRoom:", err);
        res.status(500).render("client/pages/500", { message: "Server error" });
    }
};
// Upload file
export const uploadFile = async (req, res) => {
    try {
        const roomId = req.params.id;
        const userId = req.session.user._id;
        const room = await Room.findById(roomId);
        if (!room) {
            // Xóa file đã upload nếu room không tồn tại
            if (req.file && req.file.path) {
                await deletePhysicalFile(req.file.path);
            }
            return res.status(404).render("client/pages/404", { message: "Room not found" });
        }
        // Kiểm tra user có phải member của room không
        const isMember = room.admin._id.toString() === userId.toString() ||
            room.members?.some(m => m.user.toString() === userId.toString());
        if (!isMember) {
            // Xóa file đã upload nếu không phải member
            if (req.file && req.file.path) {
                await deletePhysicalFile(req.file.path);
            }
            req.session.error = 'Bạn không phải thành viên của room này';
            return res.redirect(`/room/${roomId}?tab=files`);
        }
        // Kiểm tra có file không
        if (!req.file) {
            req.session.error = 'Vui lòng chọn file để upload';
            return res.redirect(`/room/${roomId}?tab=files`);
        }
        // Xác định loại file sử dụng helper
        const fileType = determineFileType(req.file.originalname);
        // Tạo file mới trong database
        const newFile = new File({
            room: roomId,
            uploadedBy: userId,
            fileName: req.file.originalname,
            fileUrl: `/uploads/${req.file.filename}`, // Đường dẫn public để download
            fileType: fileType,
            fileSize: req.file.size
        });
        await newFile.save();
        req.session.success = 'Upload file thành công!';
        res.redirect(`/room/${roomId}?tab=files`);
    }
    catch (err) {
        console.error("Error in uploadFile:", err);
        // Xóa file đã upload nếu có lỗi
        if (req.file && req.file.path) {
            await deletePhysicalFile(req.file.path);
        }
        req.session.error = 'Có lỗi xảy ra khi upload file: ' + err.message;
        res.redirect(`/room/${req.params.id}?tab=files`);
    }
};
// Cập nhật file (chỉ đổi tên)
export const updateFile = async (req, res) => {
    try {
        const roomId = req.params.id;
        const fileId = req.params.fileId;
        const { fileName } = req.body;
        const room = await Room.findById(roomId).populate("admin members.user");
        if (!room) {
            return res.status(404).render("client/pages/404", { message: "Room not found" });
        }
        const file = await File.findById(fileId);
        if (!file || file.room.toString() !== roomId) {
            req.session.error = 'File không tồn tại';
            return res.redirect(`/room/${roomId}?tab=files`);
        }
        // Kiểm tra quyền (admin hoặc host)
        const userId = req.session.user._id;
        const isAdmin = room.admin._id.toString() === userId.toString();
        const isHost = room.members?.some(m => m.user._id.toString() === userId.toString() && m.role === 'host');
        if (!isAdmin && !isHost) {
            req.session.error = 'Bạn không có quyền sửa file';
            return res.redirect(`/room/${roomId}?tab=files`);
        }
        // Validate tên file
        if (!fileName || fileName.trim().length === 0) {
            req.session.error = 'Tên file không được để trống';
            return res.redirect(`/room/${roomId}?tab=files`);
        }
        if (fileName.trim().length > 200) {
            req.session.error = 'Tên file không được quá 200 ký tự';
            return res.redirect(`/room/${roomId}?tab=files`);
        }
        // Cập nhật tên file
        file.fileName = fileName.trim();
        await file.save();
        req.session.success = 'Cập nhật tên file thành công!';
        res.redirect(`/room/${roomId}?tab=files`);
    }
    catch (err) {
        console.error("Error in updateFile:", err);
        req.session.error = 'Có lỗi xảy ra khi cập nhật file: ' + err.message;
        res.redirect(`/room/${req.params.id}?tab=files`);
    }
};
// Xóa file
export const deleteFile = async (req, res) => {
    try {
        const roomId = req.params.id;
        const fileId = req.params.fileId;
        const room = await Room.findById(roomId).populate("admin members.user");
        if (!room) {
            return res.status(404).render("client/pages/404", { message: "Room not found" });
        }
        const file = await File.findById(fileId);
        if (!file || file.room.toString() !== roomId) {
            req.session.error = 'File không tồn tại';
            return res.redirect(`/room/${roomId}?tab=files`);
        }
        // Kiểm tra quyền (admin hoặc host)
        const userId = req.session.user._id;
        const isAdmin = room.admin._id.toString() === userId.toString();
        const isHost = room.members?.some(m => m.user._id.toString() === userId.toString() && m.role === 'host');
        if (!isAdmin && !isHost) {
            req.session.error = 'Bạn không có quyền xóa file';
            return res.redirect(`/room/${roomId}?tab=files`);
        }
        // Xóa file vật lý sử dụng helper
        const deleted = await deletePhysicalFile(file.fileUrl);
        if (!deleted) {
            console.warn('Physical file not found or failed to delete, but will remove from database');
        }
        // Xóa record trong database
        await File.findByIdAndDelete(fileId);
        req.session.success = 'Xóa file thành công!';
        res.redirect(`/room/${roomId}?tab=files`);
    }
    catch (err) {
        console.error("Error in deleteFile:", err);
        req.session.error = 'Có lỗi xảy ra khi xóa file: ' + err.message;
        res.redirect(`/room/${req.params.id}?tab=files`);
    }
};
// Helper function: Xóa tất cả file của room khi xóa room
export const deleteAllRoomFiles = async (roomId) => {
    try {
        const files = await File.find({ room: roomId });
        if (files.length === 0) {
            console.log(`No files to delete for room: ${roomId}`);
            return { success: true, deletedCount: 0 };
        }
        // Lấy danh sách đường dẫn file
        const filePaths = files.map(f => f.fileUrl);
        // Xóa tất cả file vật lý
        const deleteResult = await deleteMultipleFiles(filePaths);
        // Xóa tất cả records trong database
        const dbResult = await File.deleteMany({ room: roomId });
        console.log(`Room ${roomId}: Deleted ${deleteResult.success.length}/${deleteResult.total} physical files and ${dbResult.deletedCount} database records`);
        return {
            success: true,
            physicalFilesDeleted: deleteResult.success.length,
            physicalFilesFailed: deleteResult.failed.length,
            databaseRecordsDeleted: dbResult.deletedCount
        };
    }
    catch (err) {
        console.error('Error in deleteAllRoomFiles:', err);
        return {
            success: false,
            error: err.message
        };
    }
};
//# sourceMappingURL=file.controller.js.map