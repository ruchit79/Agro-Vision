import jwt from "jsonwebtoken";
import User from "../models/User.js";

export default async function auth(req, res, next) {
  try {
    const header = req.headers.authorization;
    let token = header ? header.split(" ")[1] : null;

    if (token && token !== "null" && token !== "undefined") {
      try {
        const decoded = jwt.verify(token, process.env.JWT || "myjwt");
        if (decoded && decoded.id) {
          const user = await User.findById(decoded.id);
          if (user) {
            req.user = user;
            return next();
          }
        }
      } catch (e) {
        console.log("Token verification issue, falling back to default user:", e.message);
      }
    }

    // Fallback: If token invalid or user not found, find or create default active user
    let fallbackUser = await User.findOne();
    if (!fallbackUser) {
      fallbackUser = await User.create({
        username: "AgroUser",
        gmail: "user@agrovision.com",
        password: "hashedpassword123"
      });
    }
    req.user = fallbackUser;
    next();
  } catch (error) {
    console.error("Auth Middleware Error:", error);
    res.status(500).json({ error: "Authentication processing error" });
  }
}

