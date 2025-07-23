import mongoose from 'mongoose';
import dotenv from 'dotenv';

// Import models
import User from '../models/User.js';
import Room from '../models/Room.js';
import Message from '../models/Message.js';
import Task from '../models/Task.js';
import Note from '../models/Note.js';
import Schedule from '../models/Schedule.js';
import File from '../models/File.js';

console.log("🚀 Đang chạy seed.js...");

dotenv.config();

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/study-group-app';

async function seedDatabase() {
  try {
    await mongoose.connect(MONGO_URL);
    console.log('✅ Đã kết nối MongoDB');

    // Xóa dữ liệu cũ nếu cần
    await Promise.all([
      User.deleteMany({}),
      Room.deleteMany({}),
      Message.deleteMany({}),
      Task.deleteMany({}),
      Note.deleteMany({}),
      Schedule.deleteMany({}),
      File.deleteMany({})
    ]);


    const user = await User.create({
      username: 'kietnguyen',
      email: 'kiet@example.com',
      password: '123456', 
      role: "user"
    });
     const user2 = await User.create({
      username: 'admin',
      email: 'admin@gmail.com',
      password: '123456', 
      role: 'admin'
    });

  
    const room = await Room.create({
      name: 'Phòng học Backend',
      description: 'Phòng học backend đầu tiên',
      code: 'ABC123',
      admin: user._id,
      members: [
        {
          user: user._id,
          role: 'host'
        }
      ]
    });


    await Message.create({
      content: 'Xin chào cả lớp!',
      sender: user._id,
      room: room._id
    });


    await Task.create({
      title: 'Hoàn thành tính năng đăng nhập',
      description: 'Sử dụng JWT để xác thực người dùng',
      assignedTo: [user._id],
      createdBy: user._id,
      room: room._id,
      status: 'pending',
      dueDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000) // 3 ngày sau
    });


    await Note.create({
      title: 'Lưu ý khi học MongoDB',
      content: 'Phải hiểu rõ cách sử dụng Schema và Index',
      createdBy: user._id,
      room: room._id,
      isPublic: true
    });


    await Schedule.create({
      title: 'Buổi học Socket.IO',
      description: 'Realtime communication',
      startTime: new Date(),
      endTime: new Date(Date.now() + 2 * 60 * 60 * 1000), // sau 2 tiếng
      room: room._id,
      createdBy: user._id,
      participants: [user._id]
    });


    await File.create({
      fileName: 'baitap-nodejs.pdf',
      fileUrl: 'https://example.com/baitap-nodejs.pdf',
      fileType: 'pdf',
      fileSize: 2048,
      uploadedBy: user._id,
      room: room._id
    });

    console.log('🎉 Seed dữ liệu thành công!');
    process.exit(0);
  } catch (err) {
    console.error('❌ Seed thất bại:', err.message);
    process.exit(1);
  }
}

seedDatabase();
