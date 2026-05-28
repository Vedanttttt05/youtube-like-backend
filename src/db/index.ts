import mongoose from "mongoose";
import { DB_NAME } from "../constants";

const connectDB = async () => {
    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URL}/${DB_NAME}`);
        console.log(`\n Connected to the database successfully to ${connectionInstance.
            connection.host}`);

    } catch (error) {
        console.error("Error connecting to the database", error);
        process.exit(1);
    }
}


export default connectDB;