import { validationResult } from 'express-validator';
import Schedule from '../../../models/Schedule.js';
import Room from '../../../models/Room.js';
import User from '../../../models/User.js';
const getRoomsAndUsers = async () => {
    const rooms = await Room.find();
    const users = await User.find({ role: 'user' }).select('_id username');
    return { rooms, users };
};
// Hiển thị danh sách lịch học với tìm kiếm và phân trang
export const showSchedules = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;
        // Lấy tham số tìm kiếm và lọc
        const { search, room, startDate, endDate, status } = req.query;
        // Xây dựng query
        let query = {};
        // Tìm kiếm theo tiêu đề
        if (search) {
            query.title = { $regex: search, $options: 'i' };
        }
        // Lọc theo phòng
        if (room) {
            query.room = room;
        }
        // Lọc theo ngày
        if (startDate || endDate) {
            query.startTime = {};
            if (startDate) {
                query.startTime.$gte = new Date(startDate);
            }
            if (endDate) {
                const end = new Date(endDate);
                end.setDate(end.getDate() + 1); // Bao gồm cả ngày endDate
                query.startTime.$lt = end;
            }
        }
        // Lọc theo trạng thái
        if (status) {
            const now = new Date();
            if (status === 'upcoming') {
                query.startTime = { ...query.startTime, $gt: now };
            }
            else if (status === 'ongoing') {
                query.startTime = { ...query.startTime, $lte: now };
                query.endTime = { $gt: now };
            }
            else if (status === 'completed') {
                query.endTime = { $lt: now };
            }
        }
        const totalSchedules = await Schedule.countDocuments(query);
        const totalPages = Math.ceil(totalSchedules / limit);
        const schedules = await Schedule.find(query)
            .populate('room', 'name code')
            .populate('createdBy', 'username')
            .populate('participants', 'username')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        // Lấy danh sách phòng cho filter
        const rooms = await Room.find().select('_id name');
        const success = req.query.success;
        const error = req.query.error;
        res.render('admin/pages/schedule/manage-schedules', {
            schedules,
            rooms,
            path: req.path,
            admin: req.session.admin,
            page,
            totalPages,
            totalSchedules,
            limit,
            search: search || '',
            room: room || '',
            startDate: startDate || '',
            endDate: endDate || '',
            status: status || '',
            success,
            error
        });
    }
    catch (error) {
        console.error('Lỗi khi hiển thị danh sách lịch:', error);
        res.status(500).send('Đã xảy ra lỗi khi tải danh sách lịch');
    }
};
// Hiển thị chi tiết lịch học
export const showScheduleDetail = async (req, res) => {
    try {
        const schedule = await Schedule.findById(req.params.id)
            .populate('room', 'name code description')
            .populate('createdBy', 'username email')
            .populate('participants', 'username email');
        if (!schedule) {
            return res.status(404).send('Không tìm thấy lịch học');
        }
        // Xác định trạng thái lịch học
        const now = new Date();
        let scheduleStatus = '';
        if (schedule.startTime > now) {
            scheduleStatus = 'upcoming'; // Sắp diễn ra
        }
        else if (schedule.startTime <= now && schedule.endTime > now) {
            scheduleStatus = 'ongoing'; // Đang diễn ra
        }
        else {
            scheduleStatus = 'completed'; // Đã hoàn thành
        }
        res.render('admin/pages/schedule/schedule-detail', {
            schedule,
            scheduleStatus,
            path: req.path,
            admin: req.session.admin,
        });
    }
    catch (error) {
        console.error('Lỗi khi hiển thị chi tiết lịch:', error);
        res.status(500).send('Đã xảy ra lỗi khi tải chi tiết lịch');
    }
};
// Hiển thị form tạo lịch
export const showCreateForm = async (req, res) => {
    try {
        const { rooms, users } = await getRoomsAndUsers();
        res.render('admin/pages/schedule/form-create', {
            rooms,
            users,
            admin: req.session.admin,
            path: req.path,
            error: null,
            success: null,
            formData: {}
        });
    }
    catch (error) {
        console.error('Lỗi khi hiển thị form tạo lịch:', error);
        res.status(500).send('Đã xảy ra lỗi khi tải form');
    }
};
// Xử lý tạo lịch (với validation)
export const createSchedule = async (req, res) => {
    try {
        // Kiểm tra kết quả validation
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const { rooms, users } = await getRoomsAndUsers();
            return res.status(400).render('admin/pages/schedule/form-create', {
                error: errors.array().map(err => err.msg).join('. '),
                formData: req.body,
                rooms,
                users,
                path: req.path,
                admin: req.session.admin,
                success: null,
            });
        }
        if (!req.session.admin || !req.session.admin._id) {
            const { rooms, users } = await getRoomsAndUsers();
            return res.status(401).render('admin/pages/schedule/form-create', {
                error: 'Phiên đăng nhập đã hết hạn.',
                formData: req.body,
                rooms,
                users,
                path: req.path,
                admin: null,
                success: null,
            });
        }
        const { title, description, room, participants, startTime, endTime } = req.body;
        const schedule = new Schedule({
            title: title.trim(),
            description: description?.trim() || '',
            room,
            participants: Array.isArray(participants) ? participants : [participants],
            startTime: new Date(startTime),
            endTime: new Date(endTime),
            createdBy: req.session.admin._id,
        });
        await schedule.save();
        res.redirect('/admin/schedules?success=Thêm lịch học thành công');
    }
    catch (error) {
        console.error('Lỗi tạo lịch học:', error);
        const { rooms, users } = await getRoomsAndUsers();
        res.status(500).render('admin/pages/schedule/form-create', {
            error: 'Đã có lỗi xảy ra. Vui lòng thử lại.',
            formData: req.body,
            rooms,
            users,
            path: req.path,
            admin: req.session.admin,
            success: null,
        });
    }
};
// Hiển thị form sửa lịch
export const showEditForm = async (req, res) => {
    try {
        const schedule = await Schedule.findById(req.params.id);
        if (!schedule) {
            return res.status(404).send('Không tìm thấy lịch học');
        }
        const { rooms, users } = await getRoomsAndUsers();
        res.render('admin/pages/schedule/form-edit', {
            schedule,
            rooms,
            users,
            admin: req.session.admin,
            path: req.path,
            error: null,
            success: null,
        });
    }
    catch (error) {
        console.error('Lỗi khi hiển thị form sửa lịch:', error);
        res.status(500).send('Đã xảy ra lỗi khi tải form');
    }
};
// Xử lý cập nhật lịch (với validation)
export const updateSchedule = async (req, res) => {
    const scheduleId = req.params.id;
    try {
        // Kiểm tra kết quả validation
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const schedule = await Schedule.findById(scheduleId);
            const { rooms, users } = await getRoomsAndUsers();
            return res.status(400).render('admin/pages/schedule/form-edit', {
                error: errors.array().map(err => err.msg).join('. '),
                schedule,
                rooms,
                users,
                path: req.path,
                admin: req.session.admin,
                success: null,
            });
        }
        const { title, description, room, participants, startTime, endTime } = req.body;
        const schedule = await Schedule.findById(scheduleId);
        if (!schedule) {
            return res.status(404).send('Không tìm thấy lịch học.');
        }
        // Cập nhật thông tin
        schedule.title = title.trim();
        schedule.description = description?.trim() || '';
        schedule.room = room;
        schedule.participants = Array.isArray(participants) ? participants : [participants];
        schedule.startTime = new Date(startTime);
        schedule.endTime = new Date(endTime);
        await schedule.save();
        res.redirect('/admin/schedules?success=Cập nhật lịch học thành công');
    }
    catch (error) {
        console.error('Lỗi cập nhật lịch học:', error);
        const schedule = await Schedule.findById(scheduleId);
        const { rooms, users } = await getRoomsAndUsers();
        res.status(500).render('admin/pages/schedule/form-edit', {
            error: 'Đã xảy ra lỗi nội bộ. Vui lòng thử lại sau.',
            schedule,
            rooms,
            users,
            path: req.path,
            admin: req.session.admin,
            success: null,
        });
    }
};
// Xóa lịch học
export const deleteSchedule = async (req, res) => {
    try {
        const deleted = await Schedule.findByIdAndDelete(req.params.id);
        if (!deleted) {
            return res.status(404).send('Không tìm thấy lịch cần xóa');
        }
        res.redirect('/admin/schedules');
    }
    catch (error) {
        console.error('Lỗi khi xóa lịch:', error);
        res.status(500).send('Đã xảy ra lỗi khi xóa lịch');
    }
};
//# sourceMappingURL=schedule.controller.js.map