// @ts-nocheck
import mongoose from "mongoose";

const connectDB = async () =>
{
	
	try
	{
		 const dbUrl = process.env.MONGO_URI || 'mongodb+srv://pageinnovations1234:2nmmLzjqh1233uA4@cluster0.zykhvjj.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0'
		const conn = await mongoose.connect(dbUrl, {
			// To avoid warnings in the console
			useNewUrlParser: true,
			useUnifiedTopology: true,
		});

		console.log(`MongoDB Connected: ${conn.connection.host}`);
	} catch (error) {
		console.error(`Error: ${error.message}`);
		process.exit(1);
	}
};

export default connectDB;
