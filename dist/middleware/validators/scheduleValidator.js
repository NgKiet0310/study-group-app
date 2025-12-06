import { body } from 'express-validator';
import Room from '../../models/Room.js';
import User from '../../models/User.js';
import Schedule from '../../models/Schedule.js';
export const validateScheduleCreate = [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Tiêu đề lịch học không được để trống')
        .isLength({ min: 3, max: 200 })
        .withMessage('Tiêu đề phải có từ 3-200 ký tự'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Mô tả không được vượt quá 1000 ký tự'),
    body('room')
        .trim()
        .notEmpty()
        .withMessage('Vui lòng chọn phòng học')
        .isMongoId()
        .withMessage('ID phòng không hợp lệ')
        .custom(async (value) => {
        const room = await Room.findById(value);
        if (!room) {
            throw new Error('Phòng học không tồn tại');
        }
        return true;
    }),
    body('participants')
        .isArray({ min: 1 })
        .withMessage('Phải có ít nhất 1 người tham gia')
        .custom(async (value) => {
        // Kiểm tra từng participant có tồn tại không
        for (const participantId of value) {
            if (!participantId.match(/^[0-9a-fA-F]{24}$/)) {
                throw new Error('ID người tham gia không hợp lệ');
            }
            const user = await User.findById(participantId);
            if (!user) {
                throw new Error(`Người tham gia với ID ${participantId} không tồn tại`);
            }
        }
        return true;
    }),
    body('startTime')
        .notEmpty()
        .withMessage('Thời gian bắt đầu không được để trống')
        .isISO8601()
        .withMessage('Định dạng thời gian bắt đầu không hợp lệ')
        .custom((value) => {
        const startTime = new Date(value);
        if (startTime <= new Date()) {
            throw new Error('Thời gian bắt đầu phải lớn hơn thời gian hiện tại');
        }
        return true;
    }),
    body('endTime')
        .notEmpty()
        .withMessage('Thời gian kết thúc không được để trống')
        .isISO8601()
        .withMessage('Định dạng thời gian kết thúc không hợp lệ')
        .custom((value, { req }) => {
        const startTime = new Date(req.body.startTime);
        const endTime = new Date(value);
        if (endTime <= startTime) {
            throw new Error('Thời gian kết thúc phải lớn hơn thời gian bắt đầu');
        }
        // Kiểm tra khoảng cách tối thiểu (15 phút)
        const timeDiff = (endTime - startTime) / (1000 * 60);
        if (timeDiff < 15) {
            throw new Error('Thời lượng lịch học phải ít nhất 15 phút');
        }
        // Kiểm tra thời lượng tối đa (8 tiếng)
        if (timeDiff > 480) {
            throw new Error('Thời lượng lịch học không được quá 8 tiếng');
        }
        return true;
    })
        .custom(async (value, { req }) => {
        const { room, startTime } = req.body;
        if (room && startTime) {
            const conflict = await Schedule.findOne({
                room,
                startTime: { $lt: new Date(value) },
                endTime: { $gt: new Date(startTime) }
            });
            if (conflict) {
                throw new Error('Phòng đã có lịch học trong khung giờ này');
            }
        }
        return true;
    })
        .custom(async (value, { req }) => {
        // Kiểm tra trung lịch trong cùng phòng
        const { room, startTime } = req.body;
        if (room && startTime) {
            const conflict = await Schedule.findOne({
                room,
                startTime: { $lt: new Date(value) },
                endTime: { $gt: new Date(startTime) }
            });
            if (conflict) {
                throw new Error('Phòng đã có lịch học trong khung giờ này');
            }
        }
        return true;
    })
];
export const validateScheduleUpdate = [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Tiêu đề lịch học không được để trống')
        .isLength({ min: 3, max: 200 })
        .withMessage('Tiêu đề phải có từ 3-200 ký tự'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Mô tả không được vượt quá 1000 ký tự'),
    body('room')
        .trim()
        .notEmpty()
        .withMessage('Vui lòng chọn phòng học')
        .isMongoId()
        .withMessage('ID phòng không hợp lệ')
        .custom(async (value) => {
        const room = await Room.findById(value);
        if (!room) {
            throw new Error('Phòng học không tồn tại');
        }
        return true;
    }),
    body('participants')
        .isArray({ min: 1 })
        .withMessage('Phải có ít nhất 1 người tham gia')
        .custom(async (value) => {
        for (const participantId of value) {
            if (!participantId.match(/^[0-9a-fA-F]{24}$/)) {
                throw new Error('ID người tham gia không hợp lệ');
            }
            const user = await User.findById(participantId);
            if (!user) {
                throw new Error(`Người tham gia với ID ${participantId} không tồn tại`);
            }
        }
        return true;
    }),
    body('startTime')
        .notEmpty()
        .withMessage('Thời gian bắt đầu không được để trống')
        .isISO8601()
        .withMessage('Định dạng thời gian bắt đầu không hợp lệ'),
    body('endTime')
        .notEmpty()
        .withMessage('Thời gian kết thúc không được để trống')
        .isISO8601()
        .withMessage('Định dạng thời gian kết thúc không hợp lệ')
        .custom((value, { req }) => {
        const startTime = new Date(req.body.startTime);
        const endTime = new Date(value);
        if (endTime <= startTime) {
            throw new Error('Thời gian kết thúc phải lớn hơn thời gian bắt đầu');
        }
        const timeDiff = (endTime - startTime) / (1000 * 60);
        if (timeDiff < 15) {
            throw new Error('Thời lượng lịch học phải ít nhất 15 phút');
        }
        if (timeDiff > 480) {
            throw new Error('Thời lượng lịch học không được quá 8 tiếng');
        }
        return true;
    })
        .custom(async (value, { req }) => {
        // Kiểm tra trung lịch (trừ lịch hiện tại)
        const { room, startTime } = req.body;
        const scheduleId = req.params.id;
        if (room && startTime) {
            const conflict = await Schedule.findOne({
                _id: { $ne: scheduleId },
                room,
                startTime: { $lt: new Date(value) },
                endTime: { $gt: new Date(startTime) }
            });
            if (conflict) {
                throw new Error('Phòng đã có lịch học trong khung giờ này');
            }
        }
        return true;
    })
];
//# sourceMappingURL=scheduleValidator.js.map