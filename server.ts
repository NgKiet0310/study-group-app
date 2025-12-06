import http from 'http'; 
import dotenv from 'dotenv';
import chalk from 'chalk'; 
import app, { sessionMiddleware } from './app.js'; 
import { connectDB } from './config/atlas.js'; 
import { Server as SocketServer } from 'socket.io'; 
import Message from './models/ts/Message.js';
import "./config/redis.js"; 
// import { connectRedis } from './config/redis.js';

dotenv.config();


const PORT: number = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

const server = http.createServer(app);

const io = new SocketServer(server, {
  cors: {
    origin: 'http://localhost:3000',
    methods: ["GET", "POST"],
    credentials: true
  }
});


io.use((socket, next) => {
  sessionMiddleware(socket.request as any, {} as any, next as any);
});


interface OnlineUser {
  socketId: string;
  username: string;
}

const onlineUsers: Record<string, Record<string, OnlineUser>> = {};


io.on('connection', (socket) => {
  const user = (socket.request as any).session?.user;
  
  if (!user) {
    console.log(chalk.red('❌ User không có session'));
    socket.disconnect(true);
    return;
  }

  console.log(chalk.green(`✅ Socket connected: ${user.username}`));

  socket.on('joinRoom', async (roomId: string) => {
    try {
      socket.join(roomId);
      
      if (!onlineUsers[roomId]) {
        onlineUsers[roomId] = {}; 
      }
      
      onlineUsers[roomId][user._id.toString()] = {
        socketId: socket.id,
        username: user.username
      };

      const userList = Object.entries(onlineUsers[roomId]).map(([id, data]) => ({
        id: id,
        username: data.username
      }));
      
      io.to(roomId).emit('onlineUsers', userList);

      const messages = await Message.find({ room: roomId })
        .sort({ createdAt: 1 })
        .limit(50)
        .populate('sender', 'username');

      const formattedMessages = messages.map((msg: any) => ({
        _id: msg._id,
        content: msg.content,
        createdAt: msg.createdAt,
        userId: msg.sender._id.toString(),
        user: msg.sender.username
      }));

      socket.emit('loadMessages', formattedMessages);
      
    } catch (error) {
      console.error(chalk.red('Error joining room:'), error);
    }
  });

  socket.on('chatMessage', async (data: { roomId: string; msg: string }) => {
    try {
      const { roomId, msg } = data;

      if (!msg || msg.trim().length === 0) {
        return; 
      }

      const newMsg = await Message.create({
        room: roomId,
        sender: user._id,
        content: msg.trim()
      });

      const populated = await newMsg.populate('sender', 'username');

      const formattedMsg = {
        _id: populated._id,
        content: populated.content,
        createdAt: populated.createdAt,
        userId: (populated.sender as any)._id.toString(),
        user: (populated.sender as any).username
      };

      io.to(roomId).emit('chatMessage', formattedMsg);
      
    } catch (error) {
      console.error(chalk.red('Error sending message:'), error);
    }
  });

  socket.on('typing', (data: { roomId: string; username: string }) => {
    socket.to(data.roomId).emit('userTyping', data.username);
  });

  socket.on('stopTyping', (data: { roomId: string }) => {
    socket.to(data.roomId).emit('userStoppedTyping');
  });

  socket.on('disconnect', () => {
    console.log(chalk.yellow('User disconnected:', user.username));

    Object.keys(onlineUsers).forEach(roomId => {
      const userId = user._id.toString();
      if (onlineUsers[roomId] && onlineUsers[roomId][userId]) {
        delete onlineUsers[roomId][userId];
  
        const userList = Object.entries(onlineUsers[roomId]).map(([id, data]) => ({
          id: id,
          username: data.username
        }));
        
        io.to(roomId).emit('onlineUsers', userList);
        
        if (Object.keys(onlineUsers[roomId]).length === 0) {
          delete onlineUsers[roomId];
        }
      }
    });
  });
});

(async () => {
  try {
    // await connectRedis();
    await connectDB();
    server.listen(PORT, '0.0.0.0', () => {
    console.log(chalk.yellow(`🚀 Server running at http://0.0.0.0:${PORT}/home`));
    });
  } catch (err) {
    console.error(chalk.red("❌ Lỗi khởi tạo server:"), err);
    process.exit(1);
  }
})();