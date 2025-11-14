const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const cookieParser = require("cookie-parser");
const fs = require("fs");
const path = require("path");
const logger = require("./utils/logger");
const routes = require("./routes/index");
const errorHandler = require("./middleware/errorHandler");
const { setCsrfToken } = require("./middleware/csrfProtection");
const { apiLimiter } = require("./middleware/rateLimiter");
const cleanupExpiredTokens = require("./scripts/cleanupExpiredTokens");
const {
  sanitizeInput,
  preventParameterPollution,
  additionalSecurityHeaders,
  activityMonitor,
  enforceHTTPS
} = require("./middleware/securityMiddleware");

dotenv.config();
const app = express();

// Configure Express to trust proxy headers (important for rate limiting and IP detection)
app.set("trust proxy", 1);

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

// ===== SECURITY MIDDLEWARE =====

// Helmet - Enhanced Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'", "https://attendance-system-w70n.onrender.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      objectSrc: ["'none'"],
      mediaSrc: ["'self'"],
      frameSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"]
    }
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "cross-origin" },
  // Prevent clickjacking
  frameguard: { action: 'deny' },
  // Hide X-Powered-By header
  hidePoweredBy: true,
  // Strict HTTPS enforcement (HSTS)
  hsts: {
    maxAge: 31536000, // 1 year
    includeSubDomains: true,
    preload: true
  },
  // Prevent MIME type sniffing
  noSniff: true,
  // Enable XSS filter
  xssFilter: true,
  // Referrer policy
  referrerPolicy: { policy: 'strict-origin-when-cross-origin' }
}));

// Body parser middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Cookie parser - MUST be before CSRF middleware
app.use(cookieParser());

// CORS configuration - Allow specific origin with credentials
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:5174',
  'http://localhost:3000',
  'https://attendance-system123.vercel.app',
  'https://attendance-system-w70n.onrender.com',
  process.env.CLIENT_URL_DEV,
  process.env.CLIENT_URL_PROD,
  process.env.FRONTEND_URL
].filter(Boolean);

// Log allowed origins for debugging
console.log('Allowed CORS origins:', allowedOrigins);

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    // In development, allow all localhost origins
    if (process.env.NODE_ENV !== 'production' && origin.includes('localhost')) {
      return callback(null, true);
    }

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.error(`CORS blocked origin: ${origin}`);
      console.error('Allowed origins:', allowedOrigins);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true, // IMPORTANT: Allow cookies
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-XSRF-TOKEN", "X-CSRF-TOKEN"],
  exposedHeaders: ["X-Token-Refresh-Suggested"]
}));

// HTTP request logging
app.use(morgan("combined", { stream: logger.stream }));

// ===== ADDITIONAL SECURITY MIDDLEWARE =====

// Enforce HTTPS in production
app.use(enforceHTTPS);

// Additional security headers
app.use(additionalSecurityHeaders);

// Sanitize user input to prevent XSS
app.use(sanitizeInput);

// Prevent parameter pollution
app.use(preventParameterPollution);

// Monitor suspicious activity
app.use(activityMonitor);

// ===== END ADDITIONAL SECURITY =====


// Apply CSRF token generation to all routes
app.use(setCsrfToken);

// Apply rate limiting to all API routes
app.use("/api", apiLimiter);

// Serve static assets
app.use("/assets", express.static(path.join(__dirname, "public/assets")));

// ✅ MongoDB Connection with Retry Logic
const connectDB = async (retries = 5) => {
  try {
    console.log('Attempting to connect to MongoDB...');
    console.log('MONGO_URI exists:', !!process.env.MONGO_URI);

    await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 5000, // Timeout after 5s instead of 30s
      socketTimeoutMS: 45000,
    });

    logger.info("✅ MongoDB Connected Successfully");
    console.log('MongoDB connection state:', mongoose.connection.readyState); // 1 = connected

  } catch (error) {
    logger.error(`❌ MongoDB Connection Error: ${error.message}`);
    console.error('Full error:', error);

    if (retries > 0) {
      logger.warn(`⏳ Retrying MongoDB connection in 5 seconds... (${retries} retries left)`);
      await new Promise((resolve) => setTimeout(resolve, 5000));
      return connectDB(retries - 1);
    }

    logger.error('❌ Failed to connect to MongoDB after all retries');
    process.exit(1);
  }
};

// Connect to MongoDB before starting the server
connectDB();

// Handle MongoDB connection events
mongoose.connection.on("error", (err) => {
  logger.error("MongoDB connection error:", err);
});
mongoose.connection.on("disconnected", () => {
  logger.warn("MongoDB disconnected - attempting to reconnect...");
  connectDB();
});
mongoose.connection.on("connected", () => {
  logger.info("MongoDB connected");
});

// Middleware to check database connection
app.use((req, res, next) => {
  if (mongoose.connection.readyState !== 1) {
    console.error('Database not connected. Connection state:', mongoose.connection.readyState);
    return res.status(503).json({
      success: false,
      message: 'Database connection unavailable. Please try again in a moment.',
      connectionState: mongoose.connection.readyState
    });
  }
  next();
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

// Handle unsupported methods (405)
app.use((req, res) => {
  res.status(405).json({
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

// ✅ Graceful exit on fatal errors
process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception:", err);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", promise, "reason:", reason);
  process.exit(1);
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  logger.info(`Server running on port ${PORT}`);

  // Schedule token cleanup to run every 24 hours
  setInterval(async () => {
    try {
      logger.info('Running scheduled refresh token cleanup...');
      const stats = await cleanupExpiredTokens();
      logger.info(`Token cleanup completed. Deleted: ${stats.deleted}, Active: ${stats.active}`);
    } catch (error) {
      logger.error('Scheduled token cleanup failed:', error);
    }
  }, 24 * 60 * 60 * 1000); // Run every 24 hours

  // Run cleanup on startup (after a 10-second delay to allow other initializations)
  setTimeout(async () => {
    try {
      logger.info('Running initial refresh token cleanup...');
      const stats = await cleanupExpiredTokens();
      logger.info(`Initial cleanup completed. Deleted: ${stats.deleted}, Active: ${stats.active}`);
    } catch (error) {
      logger.error('Initial token cleanup failed:', error);
    }
  }, 10000);
});
