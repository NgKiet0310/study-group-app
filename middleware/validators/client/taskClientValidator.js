import { body, validationResult } from "express-validator";

export const taskValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('Tiêu đề là bắt buộc')
    .isLength({ max: 200 }).withMessage('Tiêu đề tối đa 200 kí tự'),
  
  body('description')
    .optional()
    .trim()
    .isLength({ max: 2000 }).withMessage('Mô tả tối đa 2000 kí tự'),

  body('dueDate')
    .notEmpty().withMessage('Ngày hết hạn là bắt buộc')
    .isISO8601().withMessage('Định dạng ngày không hợp lệ')
    .custom((value, { req }) => {
      const dueDate = new Date(value);
      const now = new Date();
      
      // Cho phép cập nhật task quá hạn (khi đang sửa)
      if (req.params.taskId) {
        return true;
      }
      
      // Khi tạo mới, phải lớn hơn thời gian hiện tại
      if (dueDate <= now) {
        throw new Error('Ngày hết hạn phải lớn hơn thời gian hiện tại');
      }
      return true;
    }),

  body('status')
    .optional()
    .isIn(['Pending', 'In progress', 'Completed']).withMessage('Trạng thái không hợp lệ'),

  body('assignedTo')
    .optional()
    .custom((value) => {
      if (!value) return true;
      if (typeof value === 'string') return true;
      throw new Error('Người được giao không hợp lệ');
    }),
  
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      try {
        const Room = (await import("../../../models/Room.js")).default;
        const Task = (await import("../../../models/Task.js")).default;
        const { formatDate } = await import("../../../helpers/dateHelper.js");
        
        const roomId = req.params.id;
        const room = await Room.findById(roomId).populate("admin members.user");
        
        // Lấy tasks để hiển thị
        const page = parseInt(req.query.page) || 1;
        const search = req.query.search || '';
        const limit = 6;
        const skip = (page - 1) * limit;

        const query = { room: roomId };
        if (search) {
          query.title = { $regex: search, $options: 'i' };
        }

        const totalTasks = await Task.countDocuments(query);
        const totalPages = Math.ceil(totalTasks / limit);

        const tasks = await Task.find(query)
          .populate("createdBy", "username")
          .populate("assignedTo", "username")
          .sort({ createdAt: -1 })
          .skip(skip)
          .limit(limit);

        const now = new Date();
        const formattedTasks = tasks.map((t) => {
          let statusText = t.status;
          if (t.status !== 'Completed' && new Date(t.dueDate) < now) {
            statusText = 'Overdue';
          }

          return {
            _id: t._id,
            title: t.title,
            description: t.description || '',
            dueDate: t.dueDate ? t.dueDate.toISOString().slice(0, 16) : '',
            dueDateDisplay: t.dueDate ? formatDate(t.dueDate, { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" }) : "Không có hạn",
            status: t.status,
            statusText,
            createdAt: formatDate(t.createdAt),
            createdBy: t.createdBy?.username || "Unknown",
            assignedTo: t.assignedTo?.username || "Chưa giao",
            assignedToId: t.assignedTo?._id || null
          };
        });

        return res.status(400).render('client/pages/room/room', {
          room: room || {},
          user: req.session.user,
          activeTab: 'tasks',
          tasks: formattedTasks,
          page,
          totalPages,
          search,
          error: errors.array().map(e => e.msg).join('. '),
          formData: req.body,
          showCreateTaskModal: !req.params.taskId 
        });
      } catch (err) {
        console.error('Error in validator:', err);
        return res.status(500).render('client/pages/500', { message: 'Server error' });
      }
    }
    next();
  }
];