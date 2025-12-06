import { body } from "express-validator";
export const validateRoomUser = [
    body('name')
        .trim()
        .notEmpty()
        .withMessage('Tên phòng không được để trống')
        .isLength({ max: 100 })
        .withMessage('Tên phòng tối đa 100 ký tự')
        .matches(/^[A-Za-zÀ-ỹ0-9\s]+$/u)
        .withMessage('Tên phòng chỉ được chứa chữ, số và khoảng trắng'),
    body('description')
        .optional()
        .trim()
        .isLength({ max: 500 })
        .withMessage('Mô tả tối đa 500 ký tự'),
];
//# sourceMappingURL=roomClientValidator.js.map