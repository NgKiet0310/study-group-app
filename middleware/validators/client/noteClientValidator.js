import { body, validationResult } from "express-validator";

export const noteValidator = [
  body('title')
    .trim()
    .notEmpty().withMessage('Tiêu đề là bắt buộc')
    .isLength({ max: 200 }).withMessage('Tiêu đề tối đa 200 kí tự'),
  
  body('content')
    .trim()
    .notEmpty().withMessage('Nội dung là bắt buộc')
    .isLength({ max: 5000 }).withMessage('Nội dung tối đa 5000 kí tự'),

  body('isPublic')
    .optional()
    .isBoolean().withMessage('Trạng thái công khai không hợp lệ'),
  
  async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      try {
        const Room = (await import("../../../models/Room.js")).default;
        const Note = (await import("../../../models/Note.js")).default;
        const { formatDate } = await import("../../../helpers/dateHelper.js");
        
        const roomId = req.params.id;
        const room = await Room.findById(roomId).populate("admin members.user");
        
        // Lấy notes để hiển thị
        const notes = await Note.find({ room: roomId })
          .populate("createdBy", "username")
          .sort({ createdAt: -1 })
          .limit(6);

        const formattedNotes = notes.map((n) => ({
          _id: n._id,
          title: n.title,
          content: n.content,
          isPublic: n.isPublic,
          createdAt: formatDate(n.createdAt),
          createdBy: n.createdBy ? n.createdBy.username : "Unknown",
        }));

        return res.status(400).render('client/pages/room/room', {
          room: room || {},
          user: req.session.user,
          activeTab: 'notes',
          notes: formattedNotes,
          page: 1,
          totalPages: 1,
          search: '',
          error: errors.array().map(e => e.msg).join('. '),
          formData: req.body,
          showCreateNoteModal: true
        });
      } catch (err) {
        console.error('Error in validator:', err);
        return res.status(500).render('client/pages/500', { message: 'Server error' });
      }
    }
    next();
  }
];