import File from '../../../models/File.js';
import Message from '../../../models/Message.js';
import Room from '../../../models/Room.js';
import User from '../../../models/User.js';
import moment from 'moment';

export const showDashboard = async (req, res) => {
  try {
    const { room, startDate, endDate } = req.query;
    const query = {};
    if (room) query.room = room;
    if (startDate && endDate) {
      query.createdAt = { $gte: new Date(startDate), $lte: new Date(endDate) };
    }

    // Tổng quan hệ thống
    const totalRooms = await Room.countDocuments();
    const totalUsers = await User.countDocuments({ role: 'user'});
    const totalFiles = await File.countDocuments(query);
    const totalMessages = await Message.countDocuments(query);

    // Thống kê file
    const fileByType = await File.aggregate([
      { $match: query },
      { $group: { _id: '$fileType', count: { $sum: 1 } } }
    ]);
    const recentFiles = await File.find(query)
      .populate('room', 'name')
      .populate('uploadedBy', 'username')
      .sort({ createdAt: -1 })
      .limit(5);
    const avgFileSize = await File.aggregate([
      { $match: query },
      { $group: { _id: null, avgSize: { $avg: '$fileSize' } } }
    ]);

    // Thống kê tin nhắn
    const messageByRoom = await Message.aggregate([
      { $match: query },
      { $group: { _id: '$room', count: { $sum: 1 } } },
      { $lookup: { from: 'rooms', localField: '_id', foreignField: '_id', as: 'room' } },
      { $unwind: '$room' },
      { $project: { _id: 0, roomName: '$room.name', count: 1 } }
    ]);
    const recentMessages = await Message.find(query)
      .populate('room', 'name')
      .populate('sender', 'username')
      .sort({ createdAt: -1 })
      .limit(5);
    const topSenders = await Message.aggregate([
      { $match: query },
      { $group: { _id: '$sender', count: { $sum: 1 } } },
      { $lookup: { from: 'users', localField: '_id', foreignField: '_id', as: 'sender' } },
      { $unwind: '$sender' },
      { $sort: { count: -1 } },
      { $limit: 5 },
      { $project: { _id: 0, username: '$sender.username', count: 1 } }
    ]);

    // Thống kê theo ngày (7 ngày gần nhất)
    const start = moment().subtract(6, 'days').startOf('day').toDate();
    const end = moment().endOf('day').toDate();
    const filesByDay = await File.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end }, ...query } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);
    const messagesByDay = await Message.aggregate([
      { $match: { createdAt: { $gte: start, $lte: end }, ...query } },
      { $group: { _id: { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } }, count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    // Lấy tất cả phòng
    const rooms = await Room.find().select('name');

    res.render('admin/pages/dashboard', {
      totalRooms, totalUsers, totalFiles, totalMessages,
      fileByType, recentFiles, avgFileSize: avgFileSize[0]?.avgSize || 0,
      messageByRoom, recentMessages, topSenders,
      filesByDay, messagesByDay, rooms,
       admin: req.session.admin,
      path: req.path, error: null, room, startDate, endDate
    });
  } catch (err) {
    console.error('Lỗi dashboard:', err);
    res.render('admin/pages/dashboard', {
      totalRooms: 0, totalUsers: 0, totalFiles: 0, totalMessages: 0,
      fileByType: [], recentFiles: [], avgFileSize: 0,
      messageByRoom: [], recentMessages: [], topSenders: [],
      filesByDay: [], messagesByDay: [], rooms: [],
      path: req.path, error: 'Lỗi tải dữ liệu dashboard',
      room: '', startDate: '', endDate: ''
    });
  }
};