import { body } from "express-validator";
export const validateRoom = [
    // Validate name
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Tên phòng không được để trống / Name cannot be empty')
        .isLength({ max: 100 })
        .withMessage('Tên phòng tối đa 100 ký tự / Name can be maximum 100 characters'),
    // Validate code
    body('code')
        .trim()
        .notEmpty()
        .withMessage('Mã phòng không được để trống')
        .isLength({ min: 6, max: 60 })
        .withMessage('Mã phòng phải từ 6 đến 60 ký tự')
        .matches(/^[a-zA-Z0-9_-]+$/)
        .withMessage('Mã phòng chỉ được chứa chữ, số, gạch ngang và gạch dưới'),
    // Validate description 
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Mô tả tối đa 500 ký tự'),
    // Validate members array
    body('members')
        .optional()
        .isArray()
        .withMessage('Danh sách thành viên phải là mảng'),
    // Validate từng member
    body('members.*.user')
        .optional()
        .isMongoId()
        .withMessage('ID thành viên không hợp lệ'),
    body('members.*.role')
        .optional()
        .isIn(['member', 'host'])
        .withMessage('Vai trò không hợp lệ'),
    // Custom check cho members
    body('members')
        .custom((members) => {
        if (!Array.isArray(members))
            return true;
        // chỉ lấy những object có user
        const validMembers = members.filter(m => m.user);
        const userIds = validMembers.map(m => m.user.toString());
        const hasDuplicate = new Set(userIds).size !== userIds.length;
        if (hasDuplicate) {
            throw new Error('Danh sách thành viên chứa ID trùng lặp');
        }
        // check phải có ít nhất 1 host
        const hasHost = validMembers.some(m => m.role === 'host');
        if (!hasHost) {
            throw new Error('Phòng phải có ít nhất 1 host');
        }
        return true;
    })
];
//# sourceMappingURL=roomValidator.js.map