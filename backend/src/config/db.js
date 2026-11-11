import mongoose from "mongoose";

const connectDB = async () => {
  if (!process.env.MONGO_URI) throw new Error("MONGO_URI is missing in backend/.env");
  await mongoose.connect(process.env.MONGO_URI);
  console.log("MongoDB Atlas connected successfully");
};

export default connectDB;
