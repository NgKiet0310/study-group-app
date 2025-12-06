import { MongoClient } from "mongodb";
import chalk from "chalk";

const url = process.env.MONGO_URL;

if (!url) {
  throw new Error("❌ Chưa đặt MONGO_URL trong biến môi trường!");
}

const client = new MongoClient(url);
let db; 
export async function connectDB() {
  if (db) return db; 
  try {
    await client.connect(); 
    console.log(chalk.blue("✅ Kết nối MongoDB Atlas thành công!"));
    db = client.db(); 
    return db;
  } catch (err) {
    console.error(chalk.red("❌ Lỗi kết nối MongoDB Atlas:", err));
    throw err;
  }
}

export function getDB() {
  if (!db) throw new Error("❌ Chưa connect MongoDB. Hãy gọi connectDB() trước!");
  return db;
}
