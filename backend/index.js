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
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));

// Express pre-flight handler for all routes
app.options('*', cors());


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
