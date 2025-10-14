import { validationResult } from 'express-validator';
import Room from '../../../models/Room.js';
import User from '../../../models/User.js';
import { v4 as uuidv4 } from 'uuid';

const getAllUsers = async () => {
    return await User.find({ role: 'user'}).select('_id username');
}

export const showRooms = async (req, res) => {
    try {
        
        const { search, memberCount, startDate, endDate, page = 1 } = req.query;
        const limit = 5; // Số phòng mỗi trang
        const skip = (page - 1) * limit;

        let query = {};

        if (search) {
            query.$or = [
                { name: { $regex: search, $options: 'i' } },
                { code: { $regex: search, $options: 'i' } }
            ];
        }

        if (memberCount) {
            if (memberCount === '0-5') {
                query.$expr = { $and: [{ $gte: [{ $size: "$members" }, 0] }, { $lte: [{ $size: "$members" }, 5] }] };
            } else if (memberCount === '6-10') {
                query.$expr = { $and: [{ $gte: [{ $size: "$members" }, 6] }, { $lte: [{ $size: "$members" }, 10] }] };
            } else if (memberCount === '>10') {
                query.$expr = { $gt: [{ $size: "$members" }, 10] };
            }
        }

        if (startDate || endDate) {
            query.createdAt = {};
            if (startDate) {
                query.createdAt.$gte = new Date(startDate);
            }
            if (endDate) {
                query.createdAt.$lte = new Date(new Date(endDate).setHours(23, 59, 59, 999));
            }
        }

        const totalRooms = await Room.countDocuments(query);
        const totalPages = Math.ceil(totalRooms / limit);

        const rooms = await Room.find(query)
            .populate({
                path: 'members.user',
                select: 'username'
            })
            .populate('admin', 'username')
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);

        rooms.forEach(room => {
            room.members = room.members.filter(member => member.user !== null);
        });

        const success = req.query.success;
        const error = req.query.error;

        res.render('admin/pages/room/manage-rooms', {
            rooms,
            path: req.path,
            success,
            error,
            search,
            memberCount,
            startDate,
            endDate,
            page: parseInt(page),
            totalPages,
            limit
        });
    } catch (err) {
        console.error('Lỗi khi tải danh sách phòng:', err);
        res.status(500).render('admin/pages/room/manage-rooms', {
            rooms: [],
            path: req.path,
            error: 'Lỗi khi tải danh sách phòng',
            success: null,
            search: '',
            memberCount: '',
            startDate: '',
            endDate: '',
            page: 1,
            totalPages: 1,
            limit: 10
        });
    }
}
export const showCreateForm = async (req, res) => {
    try {
        const users = await getAllUsers();
        res.render('admin/pages/room/form-create', {
            users,
            path: req.path,
        });
    } catch (error) {
        console.error('Lỗi khi hiển thị form tạo phòng');
        res.status(500).send('Lỗi khi hiển thị tạo phòng');
    }
}

export const createRoom = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            const users = await getAllUsers();
            return res.status(400).render('admin/pages/room/form-create', {
                users,
                path: req.path,
                error: errors.array()[0].msg,
                success: null
            });
        }

        const { name, code, description, members } = req.body;

        const existingRoom = await Room.findOne({ name });
        if (existingRoom) {
            const users = await getAllUsers();
            return res.status(400).render('admin/pages/room/form-create', {
                users,
                path: req.path,
                error: 'Tên phòng đã tồn tại',  
                success: null
            });
        }

        let roomCode = code || uuidv4().slice(0, 8);
        let codeExists = await Room.findOne({ code: roomCode });
        let attempts = 0;
        const maxAttempts = 10;

        while (codeExists && attempts < maxAttempts) {
            roomCode = uuidv4().slice(0, 8);    
            codeExists = await Room.findOne({ code: roomCode });
            attempts++;
        }

        if (codeExists) {
            const users = await getAllUsers();
            return res.status(400).render('admin/pages/room/form-create', {
                users,
                path: req.path,
                error: 'Không thể tạo mã phòng duy nhất, vui lòng thử lại',
                success: null
            });
        }

        let processedMembers = [];
        if (members && Array.isArray(members)) {
            const hostCount = members.filter(member => member.role === 'host').length;
            if (hostCount > 1) {
                const users = await getAllUsers();
                return res.status(400).render('admin/pages/room/form-create', {
                    users,
                    path: req.path,
                    error: 'Chỉ được phép có tối đa một thành viên với vai trò Host',
                    success: null
                });
            }

            const userIds = members.map(member => member.user).filter(Boolean);
            const validUsers = await User.find({ _id: { $in: userIds }, role: 'user' }).select('_id username');
            const validUserIds = validUsers.map(user => user._id.toString());

            processedMembers = members
                .filter(member => member.user && validUserIds.includes(member.user))
                .map(member => ({
                    user: member.user,
                    role: member.role || 'member'
                }));

            processedMembers = [...new Map(processedMembers.map(item => [item.user, item])).values()];
        }

        const adminId = req.user._id;
        const adminExists = await User.findById(adminId);
        if (!adminExists) {
            const users = await getAllUsers();
            return res.status(400).render('admin/pages/room/form-create', {
                users,
                path: req.path,
                error: 'Người dùng admin không tồn tại',
                success: null
            });                 
        }

        const newRoom = new Room({
            name,
            code: roomCode,
            description: description || '',
            admin: adminId,
            members: processedMembers,
            createdAt: Date.now()
        });

        await newRoom.save();

        res.redirect('/admin/rooms?success=Tạo phòng thành công!');
    } catch (error) {
        console.error('Lỗi khi tạo phòng:', error);
        const users = await getAllUsers();
        const rooms = await Room.find().populate('admin', 'username');
        return res.status(500).render('admin/pages/room/manage-room', {
            rooms,
            users,
            path: req.path,
            error: 'Đã có lỗi xảy ra khi tạo phòng',
            success: null
        });
    }
}

export const showEditRoom = async (req, res) => {
    try {
        const roomId = req.params.id;
        const room = await Room.findById(roomId)
        .populate('admin','username')
        .populate('members.user','username');

        room.members = room.members.filter(m => m.user);

        if(!room){
            return res.redirect('/admin/rooms?error=Phòng không tồn tại');
        }

        const users = await getAllUsers();
        res.render('admin/pages/room/form-edit', {
            room,
            users,
            path: req.path,
            error: null,
            success: null
        })
    } catch (error) {
        console.error('Lỗi khi hiển thị form chỉnh sửa', error);
        res.redirect('/admin/rooms?error= Lỗi khi hiển thị form chỉnh sửa');
    }
}

export const editRoom = async( req, res ) => {
    try {
        const roomId = req.params.id;
        const room = await Room.findById(roomId);

        const errors = validationResult(req);
        if(!errors.isEmpty()) {
            const users = await getAllUsers();
            return res.status(500).render('admin/pages/room/form-edit', {
                room,
                users,
                path: req.path,
                error: errors.array()[0].msg,
                success: null
            });
        }

        const {name, code, description, members} = req.body;
        
        const existingRoom = await Room.findOne({ name, _id: {$ne: roomId}});
        if(existingRoom) {
            const users = await getAllUsers();
            return res.status(400).render('admin/pages/room/form-edit', {
                room,
                users,
                path: req.path,
                error: 'Tên phòng đã tồn tại',
                success: null
            })
        }

        let roomCode = code || room.code;
        const codeExists = await Room.findOne({ code: roomCode, _id: {$ne: roomId} });
        if(codeExists) {
            const users = await getAllUsers();
            return res.status(400).render('admin/pages/room/form-edit', {
                room,
                users,
                path: req.p,
                error: 'Mã phòng đã được sử dụng',
                success: null
            })
        }

        let processedMembers = [];
        if (members && Array.isArray(members)) {
            const hostCount = members.filter(member => member.role === 'host').length;
            if (hostCount > 2) {
                const users = await getAllUsers();
                return res.status(400).render('admin/pages/room/form-edit', {
                    room,
                    users,
                    path: req.path,
                    error: 'Chỉ được phép có tối đa một thành viên với vai trò Host',
                    success: null
                });
            }

            const userIds = members.map(member => member.user).filter(Boolean);
            const validUsers = await User.find({ _id: { $in: userIds }, role: 'user' }).select('_id username');
            const validUserIds = validUsers.map(user => user._id.toString());

            processedMembers = members
                .filter(member => member.user && validUserIds.includes(member.user))
                .map(member => ({
                    user: member.user,
                    role: member.role || 'member'
                }));

            processedMembers = [...new Map(processedMembers.map(item => [item.user, item])).values()];
        }

        
        await Room.findByIdAndUpdate(roomId, {
            name,
            code: roomCode,
            description: description || '',
            members: processedMembers,
            updatedAt: Date.now()
        });

        res.redirect('/admin/rooms?success=Cập nhật phòng thành công!');
    } catch (error) {
        console.error('Lỗi khi chỉnh sửa phòng:', error);
        const users = await getAllUsers();
        return res.status(500).render('admin/pages/room/form-edit', {
            room: await Room.findById(req.params.id),
            users,
            path: req.path,
            error: 'Đã có lỗi xảy ra khi chỉnh sửa phòng',
            success: null
        });
    }
};

export const showRoomDetail = async(req, res ) => {
    try {
        const roomId = req.params.id;
        const room = await Room.findById(roomId)
        .populate('admin','username')
        .populate('members.user','username');

        if (!room) {
            return res.redirect('/admin/rooms?error=Phòng không tồn tại');
        }

        res.render('admin/pages/room/room-detail', {
            room,
            path: req.path,
            error: null,
            success: null
        });
    } catch (error) {
        console.error('Lỗi khi hiển thị chi tiết phòng:', error);
        res.redirect('/admin/rooms?error=Lỗi khi hiển thị chi tiết phòng');
    }
}

export const deleteRoom = async (req, res) => {
    try {
        const roomId = req.params.id;
        const room = await Room.findById(roomId);

        if (!room) {
            return res.redirect('/admin/rooms?error=Phòng không tồn tại');
        }
 
        await Room.deleteOne({ _id: roomId });

        res.redirect('/admin/rooms?success=Xóa phòng thành công!');
    } catch (error) {
        console.error('Lỗi khi xóa phòng:', error);
        res.redirect('/admin/rooms?error=Đã có lỗi xảy ra khi xóa phòng');
    }
};


