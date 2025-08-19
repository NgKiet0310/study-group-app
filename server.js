import http from 'http';
import dotenv from 'dotenv';
import chalk from 'chalk';
import app from './app.js';
import { connectDB } from './config/db.js';

dotenv.config();

const PORT = process.env.PORT || 3000;

const server = http.createServer(app);

connectDB().then(() => {
  server.listen(PORT, () => {
    console.log(chalk.yellow(`🚀 Server đang chạy tại http://localhost:${PORT}/auth/login`));
  });
});
