const express = require("express");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");
const routes = require("./routes/index");  // Import the combined routes
dotenv.config();
const app = express();

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

const PORT = process.env.PORT || 5000; // Set a default port number
app.listen(PORT, () => console.log(`🚀 Server running on port ${PORT}`));
