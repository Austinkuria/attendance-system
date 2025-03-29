const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const fs = require("fs");
const path = require("path");
const logger = require("./utils/logger");
const routes = require("./routes/index"); // Import the combined routes
const errorHandler = require("./middleware/errorHandler");

dotenv.config();
const app = express();

// Configure Express to trust proxy headers
app.set("trust proxy", true);

// Define the upload directory path
const uploadDir = path.join(__dirname, "uploads");
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  logger.info("Uploads folder created successfully!");
} else {
  logger.debug("Uploads folder already exists.");
}

// Ensure the public assets folder exists (for storing logos, etc.)
const publicAssetsDir = path.join(__dirname, "public/assets");
if (!fs.existsSync(publicAssetsDir)) {
  fs.mkdirSync(publicAssetsDir, { recursive: true });
  logger.info("Public assets folder created successfully!");
} else {
  logger.debug("Public assets folder already exists.");
}

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(helmet());

// Load allowed CORS origins from environment variables
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",")
  : [
      "https://attendance-system123.vercel.app",
      "http://localhost:5173",
      "https://attendance-system-w70n.onrender.com",
       /\.vercel\.app$/,
    ];

// CORS middleware with dynamic origin validation
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      logger.warn(`Blocked CORS request from origin: ${origin}`);
      return callback(null, false); // Instead of throwing an error
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));

// Ensure OPTIONS requests are handled correctly (for CORS preflight)
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204); // No Content for preflight
  }
  next();
});

// Morgan HTTP logging integrated with Winston logger
app.use(morgan("combined", { stream: logger.stream }));

// Serve static assets
app.use("/assets", express.static(path.join(__dirname, "public/assets")));

// MongoDB Connection with Retry Logic
const connectDB = async (retries = 5) => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info("MongoDB Connected");
  } catch (error) {
    logger.error(`MongoDB Connection Error: ${error.message}`);
    if (retries > 0) {
      logger.warn(`Retrying MongoDB connection in 5 seconds... (${retries} retries left)`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
      return connectDB(retries - 1);
    }
    process.exit(1);
  }
};
connectDB();

// Add connection event handlers for debugging
mongoose.connection.on("error", (err) => {
  logger.error("MongoDB connection error:", err);
});
mongoose.connection.on("disconnected", () => {
  logger.warn("MongoDB disconnected");
});

// Register all API routes
app.use("/api", routes);

// Root API route
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Protected and Admin routes for testing
app.use("/api/protected", (req, res) => {
  res.status(401).json({
    success: false,
    message: "Unauthorized. Please log in.",
  });
});
app.use("/api/admin", (req, res) => {
  res.status(403).json({
    success: false,
    message: "You do not have permission to access this page.",
  });
});

// Middleware to handle 405 Method Not Allowed
app.use((req, res, next) => {
  return res.status(405).json({
    success: false,
    message: `Method ${req.method} is not allowed on ${req.originalUrl}`,
  });
});

// 404 Not Found handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Centralized error handling middleware
app.use(errorHandler);

// Graceful exit on fatal errors
process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));