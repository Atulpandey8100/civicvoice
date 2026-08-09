import mongoose from 'mongoose';

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI, { serverSelectionTimeoutMS: 5000 });
    console.log('MongoDB connected');
  } catch (err) {
    console.error('MongoDB connection failed. Is MongoDB running?', err.message);
    process.exit(1);
  }
};

export default connectDB;
