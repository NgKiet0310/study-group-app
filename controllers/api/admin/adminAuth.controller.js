import jwt from 'jsonwebtoken';
import  User  from '../../../models/User.js';
import logger from '../../../utils/logger.js';


const generateAccessToken = (admin) => {
   return jwt.sign({id: admin._id, role: admin.role}, process.env.JWT_SECRET, {expiresIn: "1h"});
}

const generateRefreshToken = (admin) => {
    return jwt.sign({id: admin._id, role: admin.role}, process.env.JWT_SECRET, {expiresIn: "7h"});
}

export const login = async (req, res) => {
  try {
    const { username, password } = req.body;
    const admin = await User.findOne({ username });
    if (!admin) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    if (admin.role !== "admin") {
      return res.status(403).json({ error: "Access denied: Admins only" });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({ error: "Invalid username or password" });
    }

    const accessToken = generateAccessToken(admin);
    const refreshToken = generateRefreshToken(admin);
    admin.refreshToken = refreshToken;
    await admin.save();

    logger.info(`[ADMIN LOGIN]: ${username} logged in successfully`);
    res.status(200).json({ accessToken, refreshToken });
  } catch (error) {
    logger.error("[ADMIN LOGIN]", error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};

export const refresh = async(req, res) => {
    try {
        const {refreshToken} = req.body;
        if(!refreshToken) {
            return res.status(401).json({ error: "Refresh token required"});
        }
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        const admin = await User.findById(decoded.id);
        if(!admin || admin.role !== "admin" || admin.refreshToken !== refreshToken){
            return res.status(403).json({error: "Invalid refresh token"});
        }
        const accessToken = generateAccessToken(admin);
        return res.status(200).json({accessToken});
    } catch (error) {
        logger.error("[ADMIN REFRESH]", error.message);
        return res.status(403).json({error: "Token expired or invalid"});
    }
}

export const logout = async(req, res) => {
    try {
        const {refreshToken} = req.body;
        if(!refreshToken){
            return res.status(401).json({error: "Refresh token required"});
        }
        const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
        const admin = await User.findById(decoded.id);
        if(admin && admin.role === "admin" && admin.refreshToken === refreshToken){
            admin.refreshToken = null;
            await admin.save();
        }
        return res.status(200).json({ message: "Logout successfully"});
    } catch (error) {
        logger.error("[ADMIN LOGOUT]",error.message);
        return res.status(403).json({error: "Invalid or expired refresh token"});
    }
}