import mongoose from 'mongoose';
import dotenv from 'dotenv';
import chalk from 'chalk';

dotenv.config();

const MONGO_URL = process.env.MONGO_URL || 'mongodb://localhost:27017/study-group-app';

export const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URL);
    console.log(chalk.blue('✅ Connect MongoDB Successfully!'));
  } catch (error) {
    console.error(chalk.red('❌ Kết nối MongoDB thất bại:'), error.message);
    process.exit(1);
  }
};
