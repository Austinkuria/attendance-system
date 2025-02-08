const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const routes = require("./routes/index");  // Import the combined routes
dotenv.config();
const app = express();
const userRoutes = require('./routes/userRoutes'); // Import user routes


// Middleware
app.use(express.json({ limit: "10mb" }));
// app.use(cors({
//     origin: ["http://localhost:5173", "https://attendance-system-w70n.onrender.com", "https://qr-attendance-system2.vercel.app"],
//     credentials: true
// }));
app.use(cors({ origin: "*", credentials: true }));


app.use(morgan("dev"));
app.use(helmet());

// Connect to MongoDB
const connectDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ MongoDB Connected");
    } catch (error) {
        console.error("❌ MongoDB Connection Error:", error.message);
        process.exit(1);
    }
};

// Add connection event handlers
mongoose.connection.on('error', err => {
    console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
    console.log('MongoDB disconnected');
});

connectDB();

// Register all routes from index.js
app.use('/api', routes);  // This handles all routes with /api prefix


app.get("/", (req, res) => {
    res.send("API is running...");
});

// Register all routes
app.use('/api/users', userRoutes); 

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
  
  // Handle 405 Method Not Allowed
  app.use((req, res, next) => {
    if (req.method !== "GET") {
      return res.status(405).json({
        success: false,
        message: `Method ${req.method} is not allowed on this route.`,
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
  
  // Handle 500 Internal Server Error
  app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).json({
      success: false,
      message: "Internal Server Error. Please try again later.",
    });
  });
  
const PORT = process.env.PORT || 5000; // Set a default port number
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
