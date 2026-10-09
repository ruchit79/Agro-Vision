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
  'https://agrovision-frontend-seven.vercel.app',
  'http://localhost:3000',
  // add other trusted origins as needed
];

app.use(cors({
  origin: (origin, callback) => {
    // allow requests with no origin like mobile apps or curl
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    const msg = 'The CORS policy for this site does not allow access from the specified Origin.';
    return callback(new Error(msg), false);
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Handle preflight OPTIONS requests for all routes



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
