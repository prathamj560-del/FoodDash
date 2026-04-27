import mongoose from "mongoose";

async function dbConnect() {
    try {
        const MONGO_URI = process.env.MONGO_URI; 
        if (!MONGO_URI) {
            throw new Error("MONGO_URI is not defined in environment variables");
        }
        await mongoose.connect(MONGO_URI);
        console.log("Db connected")
    } catch (error) {
        console.log("DB Error", error)
    }
}

export default dbConnect;
