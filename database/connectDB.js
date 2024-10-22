import mongoose from "mongoose"; // Import the mongoose library for MongoDB interactions

// Function to connect to the MongoDB database
const connectDB = async (DB_URL) => {
    try {
        // Attempt to connect to the MongoDB database using the provided URL
        await mongoose.connect(DB_URL);
        console.log('Connected to MongoDB'); // Log a success message if the connection is successful
    } catch (error) {
        // Handle any errors that occur during the connection attempt
        console.error('Connection error', error); // Log the error message for debugging
    }
};

export default connectDB; // Export the connectDB function for use in other modules
