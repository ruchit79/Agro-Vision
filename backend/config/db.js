import mongoose from "mongoose"; // ✅ fix typo: "moongoose" → "mongoose"

export const connectDb = async () => {
  try {
    if (!process.env.MONGO_URL) {
      throw new Error("MONGO_URL is not defined in .env file");
    }

    const conn = await mongoose.connect(process.env.MONGO_URL);

    console.log(`✅ MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error("❌ Error connecting to MongoDB:");
    console.error(error.message);
    process.exit(1); // stop server if DB fails
  }
};
