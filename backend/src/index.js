// src/index.js
require("dotenv").config();

// Import necessary modules
const express = require("express"); // Express.js framework for building web applications
const cors = require("cors"); // CORS middleware to allow cross-origin requests from the frontend
const mongoose = require("mongoose"); // Mongoose for MongoDB object modeling
const session = require("express-session");
const MongoStore = require("connect-mongo");
const config = require("../config");
const helmet = require("helmet"); // Security middleware
const postsRouter = require("./routes/posts"); // Import the posts routes
const authRouter = require("./routes/auth"); // Import the auth routes
const commentsRouter = require("./routes/comments"); // Import the comments routes
const adminRouter = require("./routes/admin"); // Import the admin routes
const dbConfig = require("./config/db"); // Import the database configuration
const { apiLimiter } = require("./middleware/rateLimit"); // Import rate limiting

// Initialize the Express application
const app = express();
// Define the port for the server to listen on.
const PORT = process.env.PORT || 5001;

// Security middleware
app.use(helmet());

// CORS configuration
app.use(
  cors({
    origin: config.FRONTEND_URL,
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Apply rate limiting to all routes
app.use(apiLimiter);

// Session (needed for some auth flows)
app.use(
  session({
    secret: config.JWT_SECRET,
    resave: false,
    saveUninitialized: false,
    store: new MongoStore({
      mongoUrl: process.env.MONGODB_URI,
      collection: "sessions",
    }),
    cookie: {
    secure: process.env.NODE_ENV === "production", 
    httpOnly: true,
    maxAge: 1000 * 60 * 60 * 24, 
  }
}));

// Connect to MongoDB
dbConfig();

// API Routes
app.use("/api/posts", postsRouter);
app.use("/api/auth", authRouter);
app.use("/api/comments", commentsRouter);
app.use("/api/admin", adminRouter);

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({ status: "OK", timestamp: new Date().toISOString() });
});

// Root route
app.get("/", (req, res) => {
    res.send("🚀 Blog API is running. Use /api/posts, /api/auth, etc.");
  });

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ message: "Something went wrong!" });
});

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  console.log(`Environment: ${process.env.NODE_ENV || "development"}`);
});
