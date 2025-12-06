export default function authorize(role) {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).send({ error: "Unauthorized. Vui lòng đăng nhập." });
        }
        if (req.user.role !== role) {
            return res.status(403).send({ error: "Bạn không có quyền truy cập." });
        }
        next();
    };
}
//# sourceMappingURL=authorize.js.map