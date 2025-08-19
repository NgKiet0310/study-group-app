import { body } from 'express-validator';

export const validateTask = [

    body('title')
        .trim()
        .notEmpty()
        .withMessage('Tiêu đề nhiệm vụ không được để trống')
        .isLength({ min: 3, max: 200 })
        .withMessage('Tiêu đề nhiệm vụ phải từ 3-200 ký tự'),

    body('description')
        .optional()
        .trim()
        .isLength({ max: 1000 })
        .withMessage('Mô tả không được vượt quá 1000 ký tự'),

    // Kiểm tra room
    body('room')
        .trim()
        .notEmpty()
        .withMessage('Phòng không được để trống')
        .isMongoId()
        .withMessage('ID phòng không hợp lệ')
        .custom(async (roomId) => {
            const room = await Room.findById(roomId);
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
        .custom(async (userId, { req }) => {
            const roomId = req.body.room;
            if (!roomId) {
                throw new Error('Cần chọn phòng trước khi chọn người tạo');
            }

            const user = await User.findById(userId);
            if (!user) {
                throw new Error('Người tạo không tồn tại');
            }

            const room = await Room.findById(roomId).populate('members.user');
            if (!room) {
                throw new Error('Phòng không tồn tại');
            }

            let hasPermission = false;

            if (room.admin.equals(user._id)) {
                hasPermission = true;
            } 
            else {
                const memberRecord = room.members.find(member => 
                    member.user && member.user._id.equals(user._id) && member.role === 'host'
                );
                if (memberRecord) {
                    hasPermission = true;
                }
            }

            if (!hasPermission) {
                throw new Error('Người được chọn không có quyền tạo nhiệm vụ cho phòng này. Chỉ admin phòng và host phòng mới có quyền tạo task.');
            }

            return true;
        }),

    body('assignedTo')
        .optional()
        .custom(async (value, { req }) => {
            const roomId = req.body.room;
            if (!roomId) {
                throw new Error('Cần chọn phòng trước');
            }

            let assignedToArray = [];
            if (value) {
                assignedToArray = Array.isArray(value) ? value : [value];
                assignedToArray = assignedToArray.filter(id => id && id.trim());
            }

            if (assignedToArray.length === 0) {
                return true;
            }

            const room = await Room.findById(roomId).populate('members.user');
            if (!room) {
                throw new Error('Phòng không tồn tại');
            }

            const roomMemberIds = room.members.map(member => 
                member.user ? member.user._id.toString() : null
            ).filter(Boolean);

            for (const userId of assignedToArray) {
                if (!mongoose.Types.ObjectId.isValid(userId)) {
                    throw new Error(`ID người được giao "${userId}" không hợp lệ`);
                }

                const user = await User.findById(userId);
                if (!user) {
                    throw new Error(`Không tìm thấy người dùng với ID: ${userId}`);
                }
                if (!roomMemberIds.includes(userId)) {
                    throw new Error(`${user.username} không phải là thành viên của phòng này`);
                }
            }

            return true;
        }),


    body('status')
        .optional()
        .trim()
        .isIn(['pending', 'in-progress', 'completed'])
        .withMessage('Trạng thái không hợp lệ'),


    body('dueDate')
        .optional()
        .trim()
        .custom((value) => {
            if (!value) return true;

            const dueDate = new Date(value);
            if (isNaN(dueDate.getTime())) {
                throw new Error('Ngày hết hạn không đúng định dạng');
            }

            if (dueDate <= new Date()) {
                throw new Error('Ngày hết hạn phải là thời điểm trong tương lai');
            }

            return true;
        })
];