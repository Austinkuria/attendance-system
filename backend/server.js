const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const routes = require("./routes/index");  // Import the combined routes
const fs = require("fs");
const path = require("path");
const logger = require("./utils/logger");

// Import routes
const authRoutes = require("./routes/auth.routes");
const userRoutes = require("./routes/user.routes");
const unitRoutes = require("./routes/unit.routes");
const courseRoutes = require("./routes/course.routes");
const departmentRoutes = require("./routes/department.routes");
const sessionRoutes = require("./routes/session.routes");
const attendanceRoutes = require("./routes/attendance.routes");
const feedbackRoutes = require("./routes/feedback.routes");
const systemFeedbackRoutes = require('./routes/systemFeedback.routes');

dotenv.config();
const app = express();

// Configure Express to trust proxy headers
app.set('trust proxy', true);

// Define the upload directory path
const uploadDir = path.join(__dirname, "uploads");

// Check if the directory exists, if not, create it
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
  logger.info("Uploads folder created successfully!");
} else {
  logger.debug("Uploads folder already exists.");
}

// Make sure directory for assets exists to store logo
const publicAssetsDir = path.join(__dirname, "public/assets");
if (!fs.existsSync(publicAssetsDir)) {
  fs.mkdirSync(publicAssetsDir, { recursive: true });
  logger.info("Public assets folder created successfully!");
} else {
  logger.debug("Public assets folder already exists.");
}

// Middleware
app.use(express.json({ limit: "10mb" }));

// Add CORS logging and validation middleware
app.use((req, res, next) => {
  const origin = req.headers.origin;
  logger.debug(`Incoming request from origin: ${origin || 'undefined'}`);

  // Validate origin if present
  if (origin && ![
    "https://attendance-system123.vercel.app",
    "http://localhost:5173",
    "https://attendance-system-w70n.onrender.com"
  ].includes(origin)) {
    return res.status(403).json({
      success: false,
      message: "Origin not allowed"
    });
  }

  next();
});

// Update CORS configuration to ensure it accepts POST requests
app.use(cors({
  origin: [
    "https://attendance-system123.vercel.app",
    "http://localhost:5173",
    "https://attendance-system-w70n.onrender.com"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "Cache-Control"],
  credentials: true,
  exposedHeaders: ["Content-Length", "Authorization"]
}));

// Ensure OPTIONS requests are handled correctly for preflight
app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", req.headers.origin || "*");
  res.header("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.header("Access-Control-Allow-Headers", "Content-Type, Authorization, Cache-Control");
  res.header("Access-Control-Allow-Credentials", "true");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204); // No Content for preflight
  }
  next();
});

// Use morgan with our winston logger for HTTP request logging
app.use(morgan("combined", { stream: logger.stream }));
app.use(helmet());

// Make sure you have this line to serve static assets
app.use('/assets', express.static(path.join(__dirname, 'public/assets')));

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    logger.info("MongoDB Connected");
  } catch (error) {
    logger.error("MongoDB Connection Error:", error);
    process.exit(1);
  }
};

// Add connection event handlers
mongoose.connection.on('error', err => {
  logger.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  logger.warn('MongoDB disconnected');
});

connectDB();

// Add this before the routes are mounted
app.use('/api/attendance/export-all-sessions', express.json({ limit: '50mb' }));
app.use('/api/attendance/export-all-sessions', express.urlencoded({ limit: '50mb', extended: true }));

// Register all routes from index.js
app.use('/api', routes);  // This handles all routes with /api prefix

app.get("/", (req, res) => {
  res.send("API is running...");
});

// Example protected route for 401
app.use("/api/protected", (req, res) => {
  res.status(401).json({
    success: false,
    message: "Unauthorized. Please log in.",
  });
});

// 403: Forbidden access
app.use("/api/admin", (req, res) => {
  res.status(403).json({
    success: false,
    message: "You do not have permission to access this page.",
  });
});

// IMPORTANT: Modify the route handler for 405 errors
// Only apply to routes that aren't registered
const registeredRoutes = express.Router();

// Now apply the 405 handler ONLY to paths that weren't matched by any route
app.use((req, res, next) => {
  if (!req.route) {
    return res.status(405).json({
      success: false,
      message: `Method ${req.method} is not allowed on route ${req.path}`,
    });
  }
  next();
});

// Handle 404 Not Found
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

// Import error handler
const errorHandler = require('./middleware/errorHandler');

// Handle 500 Internal Server Error
app.use(errorHandler);

const PORT = process.env.PORT || 5000; // Set a default port number
app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
