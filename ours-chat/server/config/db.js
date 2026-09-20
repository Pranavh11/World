const mongoose = require('mongoose');

async function connectDatabase() {
  const uri = process.env.MONGODB_URI || process.env.MONGO_URI;

  const isProduction = process.env.NODE_ENV && process.env.NODE_ENV.trim().toLowerCase() === 'production';

  if (isProduction) {
    if (!uri) {
      console.error('FATAL: MONGODB_URI (or MONGO_URI) environment variable is missing.');
      throw new Error('MONGODB_URI or MONGO_URI environment variable must be set in production.');
    }

    console.log('Connecting to MongoDB Atlas cluster (Production)...');
    try {
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 10000,
        connectTimeoutMS: 10000
      });
      console.log('MongoDB connected successfully (Production)');
      return;
    } catch (error) {
      console.error('Production MongoDB connection failed:', error.message);
      if (error.message && (error.message.toLowerCase().includes('bad auth') || error.message.toLowerCase().includes('authentication failed'))) {
        console.error('HINT: MongoDB Atlas Authentication failed. Please check your username and password in MONGODB_URI / MONGO_URI in Render settings. If your password contains special characters (@, :, /, #), ensure they are URL-encoded (e.g. @ becomes %40).');
      }
      throw error;
    }
  }

  // Development mode connection logic
  if (uri) {
    try {
      console.log('Connecting to primary MongoDB cluster...');
      await mongoose.connect(uri, {
        serverSelectionTimeoutMS: 5000,
        connectTimeoutMS: 5000
      });
      console.log('MongoDB connected successfully (Primary)');
      return;
    } catch (error) {
      console.warn(`Primary MongoDB connection failed: ${error.message}`);
    }
  }

  // Fallback to local MongoDB instance
  const localUri = 'mongodb://127.0.0.1:27017/ours';
  if (uri !== localUri) {
    try {
      console.log('Attempting local MongoDB connection (127.0.0.1:27017)...');
      await mongoose.connect(localUri, {
        serverSelectionTimeoutMS: 3000,
        connectTimeoutMS: 3000
      });
      console.log('MongoDB connected successfully (Local instance)');
      return;
    } catch (err) {
      console.warn('Local MongoDB instance not available.');
    }
  }

  // Optional in-memory fallback for local development only
  try {
    console.log('Initializing MongoMemoryServer in-memory database fallback...');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    console.log(`MongoDB connected successfully (In-Memory Database at ${mongoUri})`);
    return;
  } catch (memErr) {
    if (memErr.code === 'MODULE_NOT_FOUND') {
      console.warn('MongoMemoryServer package is not installed.');
    } else {
      console.warn('MongoMemoryServer fallback failed:', memErr.message);
    }
  }

  throw new Error('All MongoDB connection attempts failed. Please set MONGODB_URI or MONGO_URI.');
}

module.exports = connectDatabase;


