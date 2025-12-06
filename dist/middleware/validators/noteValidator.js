import { body } from 'express-validator';
export const validateNote = [
    body('title')
        .trim()
        .notEmpty()
        .withMessage('Tiêu đề ghi chú không được để trống')
        .isLength({ max: 200 })
        .withMessage('Tiêu đề ghi chú không được vượt quá 200 ký tự'),
    body('content')
        .trim()
        .notEmpty()
        .withMessage('Nội dung ghi chú không được để trống')
        .isLength({ max: 5000 })
        .withMessage('Nội dung ghi chú không được vượt quá 5000 ký tự'),
    body('room')
        .trim()
        .notEmpty()
        .withMessage('Phòng không được để trống')
        .isMongoId()
        .withMessage('ID phòng không hợp lệ')
        .custom(async (value) => {
        // Kiểm tra phòng có tồn tại không
        const room = await Room.findById(value);
        if (!room) {
            throw new Error('Phòng không tồn tại');
        }
        return true;
    }),
    body('createdBy')
        .trim()
        .notEmpty()
        .withMessage('Người tạo không được để trống')
        .isMongoId()
        .withMessage('ID người tạo không hợp lệ')
        .custom(async (value) => {
        // Kiểm tra người dùng có tồn tại không
        const user = await User.findById(value);
        if (!user) {
            throw new Error('Người tạo không tồn tại');
        }
        return true;
    }),
    body('isPublic')
        .optional()
        .isBoolean()
        .withMessage('Trạng thái công khai phải là boolean')
];
//# sourceMappingURL=noteValidator.js.map