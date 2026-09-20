const mongoose = require('mongoose');

async function connectDatabase() {
  const primaryUri = process.env.MONGO_URI;
  if (primaryUri) {
    try {
      console.log('Connecting to primary MongoDB cluster...');
      await mongoose.connect(primaryUri, {
        serverSelectionTimeoutMS: 4000,
        connectTimeoutMS: 4000
      });
      console.log('MongoDB connected successfully (Primary)');
      return;
    } catch (error) {
      console.warn(`Primary MongoDB connection failed: ${error.message}`);
    }
  }

  // Attempt local MongoDB instance fallback
  const localUri = 'mongodb://127.0.0.1:27017/ours';
  if (primaryUri !== localUri) {
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

  // Fallback to MongoMemoryServer
  try {
    console.log('Initializing MongoMemoryServer in-memory database fallback...');
    const { MongoMemoryServer } = require('mongodb-memory-server');
    const mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    console.log(`MongoDB connected successfully (In-Memory Database at ${mongoUri})`);
  } catch (memErr) {
    console.error('All MongoDB connection attempts failed:', memErr.message);
    throw memErr;
  }
}

module.exports = connectDatabase;

