import mongoose from "mongoose";

async function connectDB() {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log("MongoDB is Connected");
    } catch (error) {
        console.error("MongoDB is Disconnected:", error.message);
        process.exit(1);
    }
}

export default connectDB;
