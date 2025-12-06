import File from '../../../models/File.js';
import Room from '../../../models/Room.js';
export const showFiles = async (req, res) => {
    const { search, room, fileType, page = 1 } = req.query;
    const limit = 10;
    const skip = (page - 1) * limit;
    try {
        let query = {};
        if (search)
            query.fileName = { $regex: search, $options: 'i' };
        if (room)
            query.room = room;
        if (fileType)
            query.fileType = fileType;
        const totalFiles = await File.countDocuments(query);
        const files = await File.find(query)
            .populate('room', 'name')
            .populate('uploadedBy', 'username')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        const rooms = await Room.find().select('name');
        const fileTypes = ['pdf', 'image', 'doc', 'other'];
        const error = rooms.length === 0 ? 'Không có phòng nào khả dụng' : null;
        res.render('admin/pages/file/manage-files', {
            files, rooms, fileTypes, path: req.path, error, success: req.query.success,
            search, room, fileType, page: parseInt(page), totalPages: Math.ceil(totalFiles / limit), limit
        });
    }
    catch (err) {
        console.error('Lỗi danh sách file:', err);
        res.render('admin/pages/file/manage-files', {
            files: [], rooms: [], fileTypes: [], path: req.path, error: 'Lỗi tải danh sách file',
            search: '', room: '', fileType: '', page: 1, totalPages: 1, limit
        });
    }
};
export const showFileDetail = async (req, res) => {
    try {
        const file = await File.findById(req.params.id)
            .populate('room', 'name')
            .populate('uploadedBy', 'username');
        if (!file)
            return res.redirect('/admin/files?error=File không tồn tại');
        res.render('admin/pages/file/file-detail', {
            file, path: req.path, error: null
        });
    }
    catch (err) {
        console.error('Lỗi chi tiết file:', err);
        res.redirect('/admin/files?error=Lỗi tải chi tiết file');
    }
};
export const deleteFile = async (req, res) => {
    try {
        const fileId = req.params.id;
        const file = await File.findById(fileId);
        if (!file) {
            return res.redirect('/admin/files?error=File không tồn tại');
        }
        await File.deleteOne({ _id: fileId });
        res.redirect('/admin/files?success=Xóa file thành công');
    }
    catch (error) {
        console.error('Lỗi xảy ra khi xóa file');
        res.redirect('/admin/files?error=Đã có lỗi xảy ra khi xóa file');
    }
};
//# sourceMappingURL=file.controller.js.map