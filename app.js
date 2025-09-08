import express from 'express';
import dotenv from 'dotenv';
import chalk from 'chalk';
import path from 'path';
import { fileURLToPath } from 'url';
import engine from 'ejs-mate';
import methodOverride from 'method-override';

// Middleware
import { sessionUser, attachUserToLocals, sessionAdmin, attachAdminToLocals } from './middleware/session.js';
import { noCache } from './middleware/nocache.js';
import isAdmin from './middleware/isAdmin.js';
import { verifyAdmin } from './middleware/verifiAdmin.js';

// API
import ApiAuthRoutes from './routes/api/client/auth.route.js';
import authAdminRoutes from './routes/api/admin/authAdmin.route.js';
import adminNoteApiRoutes from './routes/api/admin/note.route.js';
import adminRoomApiRoutes from './routes/api/admin/room.route.js';
import adminTaskApiRoutes from './routes/api/admin/task.route.js';
import adminScheduleApiRoutes from './routes/api/admin/schedule.route.js';
import adminFileApiRoutes from './routes/api/admin/file.route.js';
import adminMessageApiRoutes from './routes/api/admin/message.route.js';

// Routes
import ClientAuthRoutes from './routes/web/client/auth.route.js';
import HomeRoutes from './routes/web/client/home.route.js';
import AdminRoutes from './routes/web/admin/admin.route.js';
import adminAuthRoutes from './routes/web/admin/auth.route.js';
import scheduleRoutes from './routes/web/admin/schedule.route.js';
import roomRoutes from './routes/web/admin/room.route.js';
import userRoutes from './routes/web/admin/user.route.js';
import noteRoutes from './routes/web/admin/note.route.js';
import taskRoutes from './routes/web/admin/task.route.js';
import messageRoutes from './routes/web/admin/message.route.js';
import fileRoutes from './routes/web/admin/file.route.js';

dotenv.config();


const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Set view engine
app.engine('ejs', engine);
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));

// Parse request body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(methodOverride('_method'));


app.use('/api/admin/auth',authAdminRoutes);
app.use('/admin', sessionAdmin, attachAdminToLocals, noCache);
app.use('/api/admin', verifyAdmin, sessionAdmin, attachAdminToLocals, adminNoteApiRoutes, adminRoomApiRoutes, adminTaskApiRoutes, adminScheduleApiRoutes, adminFileApiRoutes, adminMessageApiRoutes);
app.use('/', sessionUser, attachUserToLocals, noCache);

// Routes
app.use('/api/auth', ApiAuthRoutes);
app.use('/auth', ClientAuthRoutes);
app.use('/', HomeRoutes);

app.use('/admin/auth', adminAuthRoutes);
app.use('/admin/schedules', isAdmin, scheduleRoutes);
app.use('/admin/rooms', isAdmin, roomRoutes);
app.use('/admin/users', isAdmin, userRoutes);
app.use('/admin/notes', isAdmin, noteRoutes);
app.use('/admin/tasks',isAdmin, taskRoutes);
app.use('/admin/messages',isAdmin, messageRoutes);
app.use('/admin/files', isAdmin, fileRoutes);
app.use('/admin/dashboard', isAdmin, AdminRoutes);

// Global error handler
app.use((err, req, res, next) => {
  console.log(chalk.red('❌ Lỗi toàn cục:', err.message));
  res.status(500).send({ error: 'Đã có lỗi xảy ra phía server' });
});

export default app;
