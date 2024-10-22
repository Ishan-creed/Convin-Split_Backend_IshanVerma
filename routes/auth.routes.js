import express from 'express'; // Import express to create the router
import { login, logout, register, checkAuth } from '../controller/auth.controller.js'; // Import authentication controller functions
import verifyToken from '../middleware/verifyToken.js'; // Import middleware to verify JWT token

const router = express.Router(); // Create an Express router instance

// Route to register a new user
router.post('/register', register); // Calls the register function from the controller

// Route for user login
router.post('/login', login); // Calls the login function from the controller

// Route for user logout
router.post('/logout', logout); // Calls the logout function from the controller

// Route to check user authentication status, using the verifyToken middleware
router.get('/check-auth', verifyToken, checkAuth); // Calls the checkAuth function if token is verified

export default router; // Export the router for use in other parts of the application
