import { body } from "express-validator";
export const validateUser = [
    body('username')
        .trim()
        .notEmpty().withMessage('Tên người dùng không thể để trống')
        .custom((value) => {
        const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
        const phoneRegex = /^(\+84|0)(3[2-9]|5[6|8|9]|7[0|6-9]|8[1-6|8|9]|9[0-4|6-9])[0-9]{7}$/;
        if (!gmailRegex.test(value) && !phoneRegex.test(value)) {
            throw new Error('Tên người dùng phải là email Gmail hoặc số điện thoại Việt Nam');
        }
        return true;
    }),
    body('password')
        .if((value, { req }) => req.method === 'POST' && req.path.includes('/create'))
        .notEmpty()
        .withMessage('Mật khẩu không được để trống')
        .isLength({ min: 6 })
        .withMessage('Mật khẩu phải từ 6 ký tự trở lên'),
];
//# sourceMappingURL=uservalidator.js.map