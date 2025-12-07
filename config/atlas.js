import { MongoClient } from "mongodb";
import chalk from "chalk";

if (process.env.NODE_ENV !== "production") {
  await import("dotenv/config");
}

const url = process.env.MONGO_URL;

if (!url) {
  throw new Error("❌ Chưa đặt MONGO_URL trong biến môi trường!");
}

let client;
let db;

export async function connectDB() {
  if (db) return db;

  let retries = 5;

  while (retries) {
    try {
      client = new MongoClient(url, {
        serverSelectionTimeoutMS: 30000, // 30 giây đợi MongoDB Atlas trả lời
        connectTimeoutMS: 30000,        // timeout connect
        socketTimeoutMS: 45000          // tránh timeout khi query lớn
      });

      await client.connect();
      console.log(chalk.blue("✅ Kết nối MongoDB Atlas thành công!"));

      db = client.db();
      return db;

    } catch (err) {
      console.log(chalk.yellow(`⏳ Kết nối MongoDB thất bại – thử lại (${5 - retries + 1}/5)...`));

      retries--;

      if (!retries) {
        console.error(chalk.red("❌ Kết nối MongoDB Atlas thất bại sau 5 lần thử:", err));
        throw err;
      }

      // đợi 3s rồi thử lại
      await new Promise((res) => setTimeout(res, 3000));
    }
  }
}

export function getDB() {
  if (!db) {
    throw new Error("❌ Chưa connect MongoDB. Hãy gọi connectDB() trước!");
  }
  return db;
}
