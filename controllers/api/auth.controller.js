// authController.js
import jwt from "jsonwebtoken";
import User from "../../models/User.js";
import logger from "../../utils/logger.js";


const generateAccessToken = (user) => jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
const generateRefreshToken = (user) => jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "7d" });

export const register = async (req, res, next) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) 
      return res.status(400).json({ error: "Username or password required" });

    const exists = await User.findOne({ username });
    if (exists) return res.status(409).json({ error: "Username already exists" });

    if(!/^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d@$!%*#?&]{6,}$/.test(password)) {
      return res.status(400).json({ error: "Password must be at least 6 characters, include at least 1 letter and 1 number" });
    }

    const user = new User({ username, password });
    await user.save();
    logger.info(`[REGISTER] User created: ${username}`);
    res.status(201).json({ message: "User registered successfully" });
  } catch (err) {
    logger.error("[REGISTER]", err.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) return res.status(401).json({ error: "Invalid username or password" });

    const isMatch = await user.comparePassword(password);
    if (!isMatch) return res.status(401).json({ error: "Invalid username or password" });

    const accessToken = generateAccessToken(user._id);
    const refreshToken = generateRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    logger.info(`[LOGIN] ${username} logged in successfully`);

    res.status(200).json({ accessToken, refreshToken });
  } catch (error) {
    console.error("❌ Error:", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(401).json({ error: "Refresh token required" });

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== refreshToken)
      return res.status(403).json({ error: "Invalid refresh token" });

    const accessToken = generateAccessToken(user._id);
    res.json({ accessToken });
  } catch (err) {
    logger.error("[REFRESH]", err.message);
    res.status(403).json({ error: "Token expired or invalid" });
  }
};

export const logout = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) return res.status(400).json({ error: "Refresh token required" });

    const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
    await User.findByIdAndUpdate(decoded.id, { refreshToken: null });

    res.status(200).json({ message: "Logout successful" });
  } catch (err) {
    logger.error("[LOGOUT]", err.message);
    res.status(403).json({ error: "Invalid or expired refresh token" });
  }
};
