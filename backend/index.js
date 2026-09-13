// server.js
import dotenv from "dotenv";
dotenv.config();
import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import uploadRoute from './routes/uploadRoute.js';
import analyzeRoute from './routes/analyzeRoute.js';
import { connectDb } from './config/db.js';
import authRoute  from "./routes/authRoute.js";
import chatRoute from "./routes/chatRoute.js";

const app = express();

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
const allowedOrigins = [
  "http://localhost:3000",
  "http://localhost:5173",
  "http://localhost:5174",
  process.env.FRONTEND_URL
].filter(Boolean);

// ✅ CORS configuration
app.use(
  cors({
    origin: (origin, callback) => {
      // allow requests with no origin (Postman, curl, mobile apps) or vercel deployments
      if (!origin || allowedOrigins.includes(origin) || origin.endsWith(".vercel.app")) {
        return callback(null, true);
      }
      return callback(new Error("Not allowed by CORS"));
    },
    credentials: true, // important if you use cookies / auth headers
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());


// dbs configaration
connectDb();

// Serve static files
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));
app.use('/reports', express.static(path.join(__dirname, 'reports')));

// Routes
app.use('/api/upload', uploadRoute);
app.use('/api/analyze', analyzeRoute);
app.use("/api/user" , authRoute )
app.use("/api/chat", chatRoute);

// Health check
app.get('/', (req, res) => {
  res.send('🌱 Plant AI Backend is running ✅');
});

// Start Server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Server running at http://localhost:${PORT}`);
});
