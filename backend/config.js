// Configuration file for the blog backend
// Copy this to .env and update with your actual values

module.exports = {
    // Server Configuration
    PORT: process.env.PORT || 5001,
    NODE_ENV: process.env.NODE_ENV || 'development',
    
    // MongoDB Configuration
    MONGODB_URI: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/blogapp',
    
    // JWT Configuration
    JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-this-in-production',
    
    // Frontend URL for CORS
    FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:3000',
    
    // Google OAuth Configuration
    GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || 'your-google-client-id-here',
    GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || 'your-google-client-secret-here'
};
