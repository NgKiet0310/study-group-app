import { body } from 'express-validator';
// Validator cho route /profile/update-profile
export const updateProfileValidator = [
    // 1. Validation cho tên người dùng mới
    body('newUsername')
        .optional() // Cho phép trường này rỗng nếu chỉ cập nhật mật khẩu
        .trim() // Loại bỏ khoảng trắng đầu/cuối
        .notEmpty().withMessage('Tên người dùng không thể để trống')
        .custom((value) => {
        // 2. Regex để kiểm tra email Gmail hoặc số điện thoại Việt Nam
        const gmailRegex = /^[a-zA-Z0-9._%+-]+@gmail\.com$/;
        const phoneRegex = /^(\+84|0)(3[2-9]|5[6|8|9]|7[0|6-9]|8[1-6|8|9]|9[0-4|6-9])[0-9]{7}$/;
        if (!gmailRegex.test(value) && !phoneRegex.test(value)) {
            throw new Error('Tên người dùng phải là email Gmail hoặc số điện thoại Việt Nam');
        }
        return true;
    }),
    // 3. Validation cho mật khẩu hiện tại
    body('currentPassword')
        .if(body('newPassword').exists()) // Chỉ kiểm tra nếu newPassword được gửi
        .notEmpty()
        .withMessage('Mật khẩu hiện tại không được để trống'),
    // 4. Validation cho mật khẩu mới
    body('newPassword')
        .optional() // Cho phép trường này rỗng nếu chỉ cập nhật tên người dùng
        .if(body('newPassword').exists()) // Chỉ kiểm tra nếu trường này có giá trị
        .notEmpty()
        .withMessage('Mật khẩu mới không được để trống')
        .isLength({ min: 6 })
        .withMessage('Mật khẩu mới phải từ 6 ký tự trở lên'),
    // 5. Validation cho xác nhận mật khẩu
    body('confirmPassword')
        .if(body('newPassword').exists()) // Chỉ kiểm tra nếu newPassword được gửi
        .notEmpty()
        .withMessage('Xác nhận mật khẩu không được để trống')
        .custom((value, { req }) => {
        if (value !== req.body.newPassword) {
            throw new Error('Xác nhận mật khẩu không khớp');
        }
        return true;
    }),
    // 6. Kiểm tra ít nhất một trường được cung cấp
    body()
        .custom((value, { req }) => {
        if (!req.body.newUsername && !req.body.newPassword) {
            throw new Error('Vui lòng cung cấp ít nhất tên người dùng hoặc mật khẩu để cập nhật');
        }
        return true;
    })
];
//# sourceMappingURL=profileValidator.js.map