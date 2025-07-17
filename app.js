// app.js
import express from "express";
import dotenv from "dotenv";
import chalk from "chalk";
import { fileURLToPath } from "url";
import path from "path";
import engine from "ejs-mate";

// Middlewares
import isAuthenticated from "./middleware/isAuthenticated.js";
// Route
import ClientAuthRoutes from "./routes/web/client/auth.route.js";
import HomeRoutes from "./routes/web/client/home.route.js";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

// View setup
app.engine("ejs", engine);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

// Route client
app.use("/auth", ClientAuthRoutes);
app.use("/client", isAuthenticated, HomeRoutes);


// Error Handler
app.use((err, req, res, next) => {
  console.log(chalk.red("❌ Global error:", err.message));
  res.status(500).send({ error: "Something went wrong" });
});

export default app;
