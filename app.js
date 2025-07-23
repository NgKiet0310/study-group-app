// app.js
import express from "express";
import dotenv from "dotenv";
import chalk from "chalk";
import { fileURLToPath } from "url";
import path from "path";
import engine from "ejs-mate";
import session from "express-session";

// Middlewares
import isAuthenticated from "./middleware/isAuthenticated.js";
// Route
import ClientAuthRoutes from "./routes/web/client/auth.route.js";
import HomeRoutes from "./routes/web/client/home.route.js";
import ApiAuthRoutes from "./routes/api/auth.route.js";
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(
  session({
    secret: process.env.SESSION_SECRET || "your-secret-key",
    resave: false,
    saveUninitialized: false,
    cookie: {
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 24,
    },
  })
);
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// View setup
app.engine("ejs", engine);
app.set("view engine", "ejs");
app.set("views", path.join(__dirname, "views"));
app.use(express.static(path.join(__dirname, "public")));
app.use(express.urlencoded({ extended: true }));

// Route client
app.use("/auth", ClientAuthRoutes);
app.use("/client", isAuthenticated, HomeRoutes);

// Route Api
app.use(express.json());
app.use(express.urlencoded({ extended: true}));
app.use("/api/auth", ApiAuthRoutes);


app.use((err, req, res, next) => {
  console.log(chalk.red("❌ Global error:", err.message));
  res.status(500).send({ error: "Something went wrong" });
});

export default app;
