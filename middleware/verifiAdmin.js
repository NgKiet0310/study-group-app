import jwt from "jsonwebtoken";

export const verifyAdmin = (req, res, next) => {
  const authHeader = req.headers["authorization"];
  console.log("🔹 [verifyAdmin] URL:", req.originalUrl);
  console.log("🔹 [verifyAdmin] Authorization:", authHeader);

  if (!authHeader) return res.status(401).json({ message: "No token provided" });

  const [scheme, token] = authHeader.split(" ");
  if (!token || !/^Bearer$/i.test(scheme)) {
    return res.status(401).json({ message: "No or invalid token provided" });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) return res.status(403).json({ message: "Invalid or expired token" });

    if (decoded.role !== "admin") {
      return res.status(403).json({ message: "You are not an admin" });
    }

    req.user = decoded;
    next();
  });
};
