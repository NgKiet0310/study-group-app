// app.js
import express from "express";
import dotenv from "dotenv";
import chalk from "chalk";
import path from "path";
import { fileURLToPath } from "url";
import engine from "ejs-mate";

// Gọi chung session
import {
  sessionUser,
  attachUserToLocals,
  sessionAdmin,
  attachAdminToLocals,
} from "./middleware/session.js";
import { noCache } from './middleware/nocache.js';

// Middleware khác
import isAdmin from "./middleware/isAdmin.js";

// Routes
import ClientAuthRoutes from "./routes/web/client/auth.route.js";
import HomeRoutes from "./routes/web/client/home.route.js";
import ApiAuthRoutes from "./routes/api/auth.route.js";
import AdminRoutes from "./routes/web/admin/admin.route.js";
import adminAuthRoute from "./routes/web/admin/auth.route.js";
import scheduleRoute from "./routes/web/admin/schedule.route.js";



// Config .env
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// View engine setup
app.engine("ejs", engine);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));


// Middleware xử lý body
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session setup cho từng namespace
app.use("/admin", sessionAdmin, attachAdminToLocals, noCache);
app.use("/", sessionUser, attachUserToLocals, noCache);

// Routes
app.use("/api/auth", ApiAuthRoutes);
app.use("/auth", ClientAuthRoutes);
app.use("/", HomeRoutes);
app.use("/admin/auth", adminAuthRoute);
app.use("/admin", isAdmin, AdminRoutes);
app.use('/admin/schedules', scheduleRoute);

// Global error handler
app.use((err, req, res, next) => {
  console.log(chalk.red("❌ Global error:", err.message));
  res.status(500).send({ error: "Something went wrong" });
});

export default app;
