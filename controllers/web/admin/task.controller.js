import Task from "../../../models/Task.js";
import Room from "../../../models/Room.js";
import User from "../../../models/User.js";
import { validationResult } from "express-validator";

export const showTasks = async(req, res) => {
    const {search, room, status, assignedTo, dueDate, page = 1 } = req.query;
    const limit = 5;
    const skip = (page - 1) * limit;
    
    try {
        let query = {};
        
        if(search) {
            query.title = { $regex: search, $options: 'i'};
        }
        if(room) {
            query.room = room;
        }
        if(status) {
            query.status = status;
        }
        if(assignedTo) {
            query.assignedTo = assignedTo;
        }
        if(dueDate) {
            const startOfDay = new Date(dueDate);
            startOfDay.setHours(0,0,0,0);
            const endOfDay = new Date(dueDate);
            endOfDay.setHours(23,59,59,999);
            query.dueDate = {$gte: startOfDay, $lte: endOfDay};
        }

        const totalTasks = await Task.countDocuments(query);
        const totalPages = Math.ceil(totalTasks / limit);

        const tasks = await Task.find(query)
            .populate('room','name')
            .populate('createdBy','username')
            .populate('assignedTo','username')
            .sort({ createdAt: -1})
            .skip(skip)
            .limit(limit);

        const rooms = await Room.find().select('name').sort({ name: 1 });
        const users = await User.find().select('username').sort({ username: 1 });

        res.render('admin/pages/task/manage-tasks',{
            tasks,
            rooms,
            users,
            path: req.path,
            success: req.query.success || null,
            error: req.query.error || null,
            search,
            room,
            status,
            assignedTo,
            dueDate,
            page: parseInt(page),
            totalPages,
            limit
        });
    } catch (err) {
        console.error('Lỗi khi hiển thị task:', err);
        res.status(500).render('admin/pages/task/manage-tasks',{
            tasks: [],
            rooms: [],
            users: [],
            path: req.path,
            success: null,
            error: 'Lỗi khi tải danh sách nhiệm vụ',
            search: '',
            room: '',
            status: '',
            assignedTo: '',
            dueDate: '',
            page: 1,
            totalPages: 1,
            limit: 5
        });
    }
}


export const showCreateForm = async (req, res) => {
    try {
        const rooms = await Room.find()
            .populate('admin', 'username role')
            .populate('members.user', 'username role')
            .sort({ name: 1 });

        const roomManagers = {};

        const roomMembers = {};

        rooms.forEach(room => {
            roomManagers[room._id] = [];
            
            if (room.admin) {
                roomManagers[room._id].push({
                    _id: room.admin._id,
                    username: room.admin.username,
                    role: 'admin' 
                });
            }

            room.members.forEach(member => {
                if (member.user && member.role === 'host') {
                    roomManagers[room._id].push({
                        _id: member.user._id,
                        username: member.user.username,
                        role: 'host'
                    });
                }
            });

            roomMembers[room._id] = room.members
                .filter(member => member.user && member.role === 'member')
                .map(member => ({
                    _id: member.user._id,
                    username: member.user.username
                }));
        });

        res.render('admin/pages/task/form-create', {
            rooms,
            roomManagers,
            roomMembers,  
            path: req.path,
            error: null,
            success: null,
            formData: null
        });
        
    } catch (error) {
        console.error('Lỗi khi hiển thị form tạo nhiệm vụ:', error);
        res.render('admin/pages/task/form-create', {
            rooms: [],
            roomManagers: {},
            roomMembers: {},
            path: req.path,
            error: 'Lỗi khi hiển thị form tạo nhiệm vụ',
            success: null,
            formData: null
        });
    }
};


export const createTask = async (req, res) => {
    try {

        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            throw new Error(errors.array()[0].msg);
        }

        const { title, description, room, createdBy, assignedTo, status, dueDate } = req.body;


        const assignedToArray = assignedTo
            ? (Array.isArray(assignedTo) ? assignedTo : [assignedTo]).filter(id => id && id.trim())
            : [];


        const newTask = new Task({
            title: title.trim(),
            description: description ? description.trim() : undefined,
            room,
            createdBy,
            assignedTo: assignedToArray,
            status: status || 'pending',
            dueDate: dueDate ? new Date(dueDate) : undefined
        });

        await newTask.save();
        
        console.log('Tạo task thành công:', newTask._id);
        return res.redirect('/admin/tasks?success=Tạo nhiệm vụ thành công!');
        
    } catch (error) {
        console.error('❌ Lỗi khi tạo nhiệm vụ:', error);

        try {

            const rooms = await Room.find()
                .populate('admin', 'username role')
                .populate('members.user', 'username role')
                .sort({ name: 1 });

            const roomManagers = {};
            const roomMembers = {};

            rooms.forEach(room => {
                roomManagers[room._id] = [];

                if (room.admin) {
                    roomManagers[room._id].push({
                        _id: room.admin._id,
                        username: room.admin.username,
                        role: 'admin'
                    });
                }

                room.members.forEach(member => {
                    if (member.user && member.role === 'host') {
                        roomManagers[room._id].push({
                            _id: member.user._id,
                            username: member.user.username,
                            role: 'host'
                        });
                    }
                });

                roomMembers[room._id] = room.members
                    .filter(member => member.user && member.role === 'member')
                    .map(member => ({
                        _id: member.user._id,
                        username: member.user.username
                    }));
            });

            const systemAdmins = await User.find({ role: 'admin' })
                .select('username')
                .sort({ username: 1 });

            return res.status(400).render('admin/pages/task/form-create', {
                rooms,
                roomManagers,
                roomMembers,
                path: req.path,
                error: error.message || 'Đã có lỗi xảy ra khi tạo nhiệm vụ',
                success: null,
                formData: req.body
            });
        } catch (renderError) {
            console.error('❌ Lỗi khi render form:', renderError);
            return res.status(500).render('admin/pages/task/form-create', {
                rooms: [],
                roomManagers: {},
                roomMembers: {},
                path: req.path,
                error: 'Đã có lỗi xảy ra khi tạo nhiệm vụ',
                success: null,
                formData: req.body
            });
        }
    }
};

// Hiển thị form chỉnh sửa nhiệm vụ
export const showEditForm = async (req, res) => {
    try {
        const taskId = req.params.id;
        const task = await Task.findById(taskId)
            .populate('room', 'name')
            .populate('createdBy', 'username')
            .populate('assignedTo', 'username');

        if (!task) {
            return res.redirect('/admin/tasks?error=Nhiệm vụ không tồn tại');
        }

        const rooms = await Room.find()
            .populate('admin', 'username role')
            .populate('members.user', 'username role')
            .sort({ name: 1 });

        const roomManagers = {};
        const roomMembers = {};

        rooms.forEach(room => {
            roomManagers[room._id] = [];
            if (room.admin) {
                roomManagers[room._id].push({
                    _id: room.admin._id,
                    username: room.admin.username,
                    role: 'admin'
                });
            }
            room.members.forEach(member => {
                if (member.user && member.role === 'host') {
                    roomManagers[room._id].push({
                        _id: member.user._id,
                        username: member.user.username,
                        role: 'host'
                    });
                }
            });
            roomMembers[room._id] = room.members
                .filter(member => member.user && member.role === 'member')
                .map(member => ({
                    _id: member.user._id,
                    username: member.user.username
                }));
        });

        res.render('admin/pages/task/form-edit', {
            task,
            rooms,
            roomManagers,
            roomMembers,
            path: req.path,
            error: null,
            success: null,
            formData: null,
            originalTask: {
                _id: task._id,
                title: task.title,
                description: task.description || '',
                room: task.room._id.toString(),
                createdBy: task.createdBy._id.toString(),
                assignedTo: task.assignedTo.map(user => user._id.toString()),
                status: task.status,
                dueDate: task.dueDate ? task.dueDate.toISOString().slice(0, 16) : ''
            }
        });
    } catch (error) {
        console.error('Lỗi khi hiển thị form chỉnh sửa nhiệm vụ:', error);
        res.redirect('/admin/tasks?error=Lỗi khi hiển thị form chỉnh sửa nhiệm vụ');
    }
};

export const editTask = async (req, res) => {
  try {
    const taskId = req.params.id; 
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      throw new Error(errors.array()[0].msg);
    }

    const { title, description, room, createdBy, assignedTo, status, dueDate } = req.body;

    const task = await Task.findById(taskId);
    if (!task) {
      throw new Error('Nhiệm vụ không tồn tại');
    }

    if (task.status === 'completed' && status !== 'completed') {
      throw new Error('Nhiệm vụ đã hoàn thành không thể thay đổi trạng thái');
    }
    if (task.status === 'in-progress' && status === 'pending') {
      throw new Error('Không thể chuyển từ "Đang thực hiện" về "Chờ xử lý"');
    }

    const sanitizedTitle = title.trim();
    const sanitizedDescription = description ? description.trim() : undefined;

    const assignedToArray = assignedTo
      ? (Array.isArray(assignedTo) ? assignedTo : [assignedTo]).filter((id) => id && id.trim())
      : [];

    const updateData = {
      title: sanitizedTitle,
      description: sanitizedDescription,
      room,
      createdBy,
      assignedTo: assignedToArray,
      status: status || 'pending',
      dueDate: dueDate ? new Date(dueDate) : undefined,
      updatedAt: new Date(),
    };

    const updatedTask = await Task.findByIdAndUpdate(taskId, updateData, { new: true });

    console.log('Cập nhật task thành công:', updatedTask._id);
    return res.redirect('/admin/tasks?success=Cập nhật nhiệm vụ thành công!');
  } catch (error) {
    console.error('Lỗi khi cập nhật nhiệm vụ:', error);

    const task = await Task.findById(taskId)
      .populate('room', 'name')
      .populate('createdBy', 'username')
      .populate('assignedTo', 'username');

    const rooms = await Room.find()
      .populate('admin', 'username role')
      .populate('members.user', 'username role')
      .sort({ name: 1 });

    const roomManagers = {};
    const roomMembers = {};

    rooms.forEach((room) => {
      roomManagers[room._id] = [];
      if (room.admin) {
        roomManagers[room._id].push({
          _id: room.admin._id,
          username: room.admin.username,
          role: 'admin',
        });
      }
      room.members.forEach((member) => {
        if (member.user && member.role === 'host') {
          roomManagers[room._id].push({
            _id: member.user._id,
            username: member.user.username,
            role: 'host',
          });
        }
      });
      roomMembers[room._id] = room.members
        .filter((member) => member.user && member.role === 'member')
        .map((member) => ({
          _id: member.user._id,
          username: member.user.username,
        }));
    });

    return res.status(400).render('admin/pages/task/form-edit', {
      task,
      rooms,
      roomManagers,
      roomMembers,
      path: req.path,
      error: error.message || 'Đã có lỗi xảy ra khi cập nhật nhiệm vụ',
      success: null,
      formData: {
        ...req.body,
        title: req.body.title || '',
        description: req.body.description || '',
      },
      originalTask: {
        _id: task._id,
        title: task.title,
        description: task.description || '',
        room: task.room._id.toString(),
        createdBy: task.createdBy._id.toString(),
        assignedTo: task.assignedTo.map((user) => user._id.toString()),
        status: task.status,
        dueDate: task.dueDate ? task.dueDate.toISOString().slice(0, 16) : '',
      },
    });
  }
};

export const showDetailTask = async (req, res) => {
    try {
        const taskId = req.params.id;
        
        // Tìm task và populate các thông tin liên quan
        const task = await Task.findById(taskId)
            .populate('room', 'name description')
            .populate('createdBy', 'username email role')
            .populate('assignedTo', 'username email role');

        if (!task) {
            return res.redirect('/admin/tasks?error=Nhiệm vụ không tồn tại');
        }

        // Tính toán thông tin bổ sung
        const isOverdue = task.dueDate && new Date() > new Date(task.dueDate) && task.status !== 'completed';
        const daysRemaining = task.dueDate ? Math.ceil((new Date(task.dueDate) - new Date()) / (1000 * 60 * 60 * 24)) : null;

        // Lấy thông tin về room members để hiển thị context
        const roomInfo = await Room.findById(task.room._id)
            .populate('admin', 'username')
            .populate('members.user', 'username role');

        res.render('admin/pages/task/task-detail', {
            task,
            roomInfo,
            isOverdue,
            daysRemaining,
            path: req.path,
            success: req.query.success || null,
            error: req.query.error || null
        });

    } catch (error) {
        console.error('Lỗi khi hiển thị chi tiết nhiệm vụ:', error);
        res.redirect('/admin/tasks?error=Lỗi khi tải thông tin nhiệm vụ');
    }
};

export const deleteTask = async (req, res) => {
    try {
        const taskId = req.params.id;
        const task = await Task.findById(taskId);
        if(!task){
            return res.redirect('/admin/tasks?error=Nhiệm vụ không tồn tại');
        }
        await Task.deleteOne({ _id: taskId});
        res.redirect('/admin/tasks?success=Xóa nhiệm vụ thành công');
    } catch (error) {
        console.error('Xóa nhiệm vụ không thành công', error);
        res.redirect('/admin/tasks?error=Đã có lỗi xảy ra khi xóa nhiệm vụ');
    }
};