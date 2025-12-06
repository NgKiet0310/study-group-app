import { body, validationResult } from "express-validator";

export const scheduleValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('Tiêu đề là bắt buộc')
    .isLength({ max: 200 }).withMessage('Tiêu đề tối đa 200 kí tự'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 1000 }).withMessage('Mô tả tối đa 1000 kí tự'),

  body('startTime')
    .notEmpty().withMessage('Thời gian bắt đầu là bắt buộc')
    .isISO8601().withMessage('Định dạng thời gian không hợp lệ')
    .custom(v => {
      const startTime = new Date(v);
      const now = new Date();
      if (startTime <= now) {
        throw new Error('Thời gian bắt đầu phải lớn hơn thời gian hiện tại');
      }
      return true;
    }),

  body('endTime')
    .optional({ checkFalsy: true })
    .isISO8601().withMessage('Định dạng thời gian không hợp lệ')
    .custom((v, { req }) => {
      if (!v) return true; // Nếu không có endTime thì bỏ qua
      
      const start = new Date(req.body.startTime); // Đã sửa lỗi từ startTome
      const end = new Date(v);
      
      if (end <= start) {
        throw new Error('Thời gian kết thúc phải sau thời gian bắt đầu');
      }
      return true;
    }),

  body('participants')
    .optional()
    .custom((value) => {
      // Chấp nhận cả string và array
      if (!value) return true;
      if (typeof value === 'string') return true;
      if (Array.isArray(value)) return true;
      throw new Error('Danh sách người tham gia không hợp lệ');
    }),
  
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      try {
        const Room = (await import("../../../models/Room.js")).default;
        const Schedule = (await import("../../../models/Schedule.js")).default;
        const { formatDate } = await import("../../../helpers/dateHelper.js");
        
        const roomId = req.params.id;
        const room = await Room.findById(roomId).populate("admin members.user");
        
        // Lấy schedules để hiển thị
        const schedules = await Schedule.find({ room: roomId })
          .populate("createdBy", "username")
          .sort({ createdAt: -1 })
          .limit(3);

        const now = new Date();
        const formattedSchedules = schedules.map((s) => {
          let status = "Comming soon";
          if (s.endTime && s.endTime < now) status = "Completed";
          else if (s.startTime <= now && (!s.endTime || s.endTime >= now)) status = "In progress";

          return {
            _id: s._id,
            title: s.title,
            description: s.description,
            startTime: formatDate(s.startTime),
            endTime: s.endTime ? formatDate(s.endTime) : null,
            createdAt: formatDate(s.createdAt),
            createdBy: s.createdBy ? s.createdBy.username : "Unknown",
            status,
          };
        });

        return res.status(400).render('client/pages/room/room', {
          room: room || {},
          user: req.session.user,
          activeTab: 'schedules',
          schedules: formattedSchedules,
          page: 1,
          totalPages: 1,
          search: '',
          error: errors.array().map(e => e.msg).join('. '),
          formData: req.body,
          showCreateModal: true
        });
      } catch (err) {
        console.error('Error in validator:', err);
        return res.status(500).render('client/pages/500', { message: 'Server error' });
      }
    }
    next();
  }
];