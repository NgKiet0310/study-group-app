import Schedule from '../../../models/Schedule.js';
import Room from '../../../models/Room.js';
import User from '../../../models/User.js';

// Helper để lấy danh sách phòng và user
const getRoomsAndUsers = async () => {
  const rooms = await Room.find();
  const users = await User.find({ role: 'user' }).select('_id username');
  return { rooms, users };
};

// Helper validate input
const validateScheduleInput = ({ title, room, participants, startTime, endTime }) => {
  const errors = [];

  if (!title || title.trim() === '') errors.push('Tiêu đề không được để trống.');
  if (!room) errors.push('Vui lòng chọn phòng học.');
  if (!participants || participants.length === 0) errors.push('Phải có ít nhất 1 người tham gia.');
  if (!startTime || !endTime) errors.push('Phải chọn đầy đủ thời gian.');
  else if (Date.parse(startTime) >= Date.parse(endTime)) {
    errors.push('Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc.');
  }

  return errors;
};

// Helper check conflict
const checkScheduleConflict = async (room, startTime, endTime, excludeId = null) => {
  const query = {
    room,
    startTime: { $lt: new Date(endTime) },
    endTime: { $gt: new Date(startTime) }
  };

  if (excludeId) query._id = { $ne: excludeId };

  return await Schedule.findOne(query);
};

// Hiển thị danh sách lịch học
export const showSchedules = async (req, res) => {
  try {
    const schedules = await Schedule.find()
      .populate('room', 'name')
      .populate('createdBy', 'username')
      .populate('participants', 'username')
      .sort({ createdAt: -1 });

    res.render('admin/pages/schedule/manage-schedules', {
      schedules,
      path: req.path,
    });
  } catch (error) {
    console.error('Lỗi khi hiển thị danh sách lịch:', error);
    res.status(500).send('Đã xảy ra lỗi khi tải lịch');
  }
};

// Hiển thị form tạo
export const showCreateForm = async (req, res) => {
  try {
    const { rooms, users } = await getRoomsAndUsers();

    res.render('admin/pages/schedule/form-create', {
      rooms,
      admin: req.session.admin,
      path: req.path,
      users,
      error: null,
      formData: {}
    });
  } catch (error) {
    console.error('Lỗi khi hiển thị form tạo lịch:', error);
    res.status(500).send('Đã xảy ra lỗi khi tải form');
  }
};

// Xử lý tạo lịch
export const createSchedule = async (req, res) => {
  const { title, description, room, participants, startTime, endTime } = req.body;
  const { rooms, users } = await getRoomsAndUsers();

  try {
    if (!req.session.admin || !req.session.admin._id) {
      return res.status(401).render('admin/pages/schedule/form-create', {
        error: 'Phiên đăng nhập đã hết hạn.',
        formData: req.body,
        rooms,
        path: req.path,
        users,
        admin: null,
      });
    }

    const validationErrors = validateScheduleInput({ title, room, participants, startTime, endTime });

    if (validationErrors.length > 0) {
      return res.status(400).render('admin/pages/schedule/form-create', {
        error: validationErrors.join(' '),
        formData: req.body,
        rooms,
        path: req.path,
        users,
        admin: req.session.admin,
      });
    }

    const conflict = await checkScheduleConflict(room, startTime, endTime);
    if (conflict) {
      return res.status(400).render('admin/pages/schedule/form-create', {
        error: 'Phòng đã có lịch trong khung giờ này.',
        formData: req.body,
        rooms,
        path: req.path,
        users,
        admin: req.session.admin,
      });
    }

    const schedule = new Schedule({
      title,
      description,
      room,
      participants,
      startTime: new Date(startTime),
      endTime: new Date(endTime),
      createdBy: req.session.admin._id,
    });

    await schedule.save();
    res.redirect('/admin/schedules');

  } catch (error) {
    console.error('Lỗi tạo lịch học:', error);
    res.status(500).render('admin/pages/schedule/form-create', {
      error: 'Đã có lỗi xảy ra. Vui lòng thử lại.',
      formData: req.body,
      rooms,
      path: req.path,
      users,
      admin: req.session.admin,
    });
  }
};

export const showEditForm = async (req, res) => {
  try {
    const schedule = await Schedule.findById(req.params.id);
    const { rooms, users } = await getRoomsAndUsers();

    res.render('admin/pages/schedule/form-edit', {
      schedule,
      admin: req.session.admin,
      path: req.path,
      rooms,
      users,
      error: null,
    });
  } catch (error) {
    console.error('Lỗi khi hiển thị form sửa lịch:', error);
    res.status(500).send('Đã xảy ra lỗi khi tải form');
  }
};

export const updateSchedule = async (req, res) => {
  const { title, description, startTime, endTime, room, participants } = req.body;
  const scheduleId = req.params.id;

  try {
    const { rooms, users } = await getRoomsAndUsers();

    const schedule = await Schedule.findById(scheduleId);
    if (!schedule) return res.status(404).send('Không tìm thấy lịch học.');

    // Kiểm tra dữ liệu đầu vào
    if (!title || !startTime || !endTime || !room || !participants || participants.length === 0) {
      return res.status(400).render('admin/pages/schedule/form-edit', {
        error: 'Vui lòng điền đầy đủ thông tin bắt buộc.',
        schedule,
        rooms,
        users,
        path: req.path,
        admin: req.session.admin
      });
    }

    const start = new Date(startTime);
    const end = new Date(endTime);

    if (isNaN(start.getTime()) || isNaN(end.getTime()) || start >= end) {
      return res.status(400).render('admin/pages/schedule/form-edit', {
        error: 'Thời gian bắt đầu phải nhỏ hơn thời gian kết thúc và đúng định dạng.',
        schedule,
        rooms,
        users,
        path: req.path,
        admin: req.session.admin
      });
    }

    // Kiểm tra trùng lịch trong cùng phòng (trừ lịch hiện tại)
    const conflict = await Schedule.findOne({
      _id: { $ne: scheduleId },
      room,
      startTime: { $lt: end },
      endTime: { $gt: start }
    });

    if (conflict) {
      return res.status(400).render('admin/pages/schedule/form-edit', {
        error: 'Phòng này đã có lịch trùng thời gian. Vui lòng chọn thời gian khác.',
        schedule,
        rooms,
        users,
        path: req.path,
        admin: req.session.admin
      });
    }

    // Cập nhật lịch
    schedule.title = title;
    schedule.description = description;
    schedule.room = room;
    schedule.participants = Array.isArray(participants) ? participants : [participants];
    schedule.startTime = start;
    schedule.endTime = end;

    await schedule.save();
    res.redirect('/admin/schedules');

  } catch (error) {
    console.error('Lỗi cập nhật lịch học:', error);

    const schedule = await Schedule.findById(req.params.id);
    const { rooms, users } = await getRoomsAndUsers();

    res.status(500).render('admin/pages/schedule/form-edit', {
      error: 'Đã xảy ra lỗi nội bộ. Vui lòng thử lại sau.',
      schedule,
      rooms,
      users,
      path: req.path,
      admin: req.session.admin
    });
  }
};

export const deleteSchedule = async (req, res) => {
  try {
    const deleted = await Schedule.findByIdAndDelete(req.params.id);
    if (!deleted) return res.status(404).send('Không tìm thấy lịch cần xóa');

    res.redirect('/admin/schedules');
  } catch (error) {
    console.error('Lỗi khi xóa lịch:', error);
    res.status(500).send('Đã xảy ra lỗi khi xóa lịch');
  }
};
