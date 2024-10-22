// Import required modules
import express from 'express'; // Express framework
import bodyParser from 'body-parser'; // Middleware for parsing request bodies
import mongoose from 'mongoose'; // MongoDB object modeling
import dotenv from 'dotenv'; // Load environment variables
import cors from 'cors'; // Enable Cross-Origin Resource Sharing
import connectDB from './database/connectDB.js'; // Database connection function
import authRoutes from './routes/auth.routes.js'; // Authentication routes
import expenseRoutes from './routes/expense.routes.js'; // Expense routes

// Load environment variables from .env file
dotenv.config();

// Create an Express application
export const app = express();
// Define the port, defaulting to 5000 if not specified
const port = process.env.PORT || 5000;

// Middleware setup
app.use(cors()); // Enable CORS
app.use(express.json()); // Parse JSON requests
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded data

// Define application routes
app.use('/api/auth', authRoutes); // Auth routes
app.use('/api/expense', expenseRoutes); // Expense management routes

// Start the server and connect to the database
app.listen(port, async () => {
    await connectDB(process.env.MONGODB_URI); // Connect to MongoDB
    console.log(`Server is listening on port ${port}`); // Log server start
});
