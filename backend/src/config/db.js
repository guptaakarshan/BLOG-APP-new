const mongoose = require('mongoose');

const connectDB = async () => {
    try {
        const mongoUri =
            process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/blogapp';
        await mongoose.connect(mongoUri, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
        });
        console.log('MongoDB connected successfully');
    } catch (error) {
        console.error('MongoDB connection failed:', error.message);
        // Fallback to in-memory MongoDB for development
        try {
            const { MongoMemoryServer } = require('mongodb-memory-server');
            const memoryServer = await MongoMemoryServer.create();
            const uri = memoryServer.getUri('blogapp');
            await mongoose.connect(uri, {
                useNewUrlParser: true,
                useUnifiedTopology: true,
            });
            console.log('Connected to in-memory MongoDB instance');
        } catch (memError) {
            console.error('In-memory MongoDB startup failed:', memError.message);
            process.exit(1);
        }
    }
};

module.exports = connectDB;