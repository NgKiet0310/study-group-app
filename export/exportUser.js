import mongoose from "mongoose";
import dotenv from 'dotenv';
import fs from 'fs';
import { Parser } from 'json2csv';
import User from "../models/User.js";

dotenv.config();
await mongoose.connect(process.env.MONGO_URL);

const users = await User.find({}, "username role createdAt").lean();
const format = process.argv[2] || "json";
const file = format === "csv" ? "users.csv" : "users.json";

if(format === "csv"){
    const parser = new Parser({ fields: ["username", "role", "createdAt"]});
    const csv = parser.parse(users);
    fs.writeFileSync(file, csv);
}else{
    fs.writeFileSync(file, JSON.stringify(users, null, 2));
}

console.log(`✅ Exported to ${file}`);
process.exit();

