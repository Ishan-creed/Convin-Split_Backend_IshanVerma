import User from "../models/user.model.js"; // Import the User model for database operations
import bcrypt from 'bcrypt'; // Import bcrypt for password hashing
import generateTokenAndSetCookie from "../utils/generateToken.js"; // Import utility to generate token and set cookie

// User registration
export const register = async (req, res) => {
    try {
        // Extract user details from the request body
        const { name, email, password, confirmPassword, mobile } = req.body;

        // Check for required fields
        if (
            !name.trim() === '' ||
            !email.trim() === '' ||
            !password.trim() === '' ||
            !confirmPassword.trim() === '' ||
            !mobile.trim() === ''
        ) {
            return res
                .status(400)
                .json({ success: false, message: 'All fields are required' });
        }

        // Ensure passwords match
        if (password !== confirmPassword) {
            return res
                .status(400)
                .json({ success: false, message: "Passwords don't match" });
        }

        // Check if user already exists
        const userAlreadyExists = await User.findOne({ email });
        if (userAlreadyExists) {
            return res
                .status(400)
                .json({ success: false, message: 'Username Already Taken' });
        }

        // Hash the user's password
        const salt = await bcrypt.genSalt(10); // Generate salt
        const hashedPassword = await bcrypt.hash(password, salt); // Hash password with salt

        // Create a new user instance
        const user = new User({
            name,
            email,
            password: hashedPassword, // Store hashed password
            mobile
        });

        // Generate a token and set it in a cookie
        generateTokenAndSetCookie(user._id, res);

        // Save the new user to the database
        await user.save();

        // Respond with success message and user details (excluding password)
        res.status(200).json({
            success: true,
            message: 'Account created successfully',
            user: {
                ...user._doc, // Spread the user document
                password: undefined, // Exclude the password from the response
            },
        });

    } catch (error) {
        console.error(error); // Log error
        res.status(500).json({ success: false, message: error.message }); // Respond with error message
    }
}

// User login
export const login = async (req, res) => {
    try {
        // Extract email and password from request body
        const { email, password } = req.body;

        // Find user by email
        const user = await User.findOne({ email });
        // Check if password is correct
        const isPasswordCorrect = await bcrypt.compare(password, user?.password || '');

        // Handle invalid credentials
        if (!user || !isPasswordCorrect) {
            return res
                .status(400)
                .json({ success: false, message: 'Invalid credentials' });
        }

        // Generate a token and set it in a cookie
        const token = generateTokenAndSetCookie(user._id, res);

        // Respond with success message and user details (excluding password)
        return res.status(200).json({
            success: true,
            message: 'User logged in successfully',
            token: token, // Include the token in the response
            user: {
                ...user._doc,
                password: undefined // Exclude the password from the response
            }
        });

    } catch (error) {
        console.error(error); // Log error
        res.status(500).json({ success: false, message: error.message }); // Respond with error message
    }
}

// User logout
export const logout = async (req, res) => {
    try {
        res.clearCookie('token'); // Clear the authentication cookie
        res.status(200).json({
            success: true,
            message: 'Logged out successfully' // Respond with success message
        });
    } catch (error) {
        console.log(error); // Log error
        res.status(500).json({ success: false, message: error.message }); // Respond with error message
    }
}

// Check user authentication status
export const checkAuth = async (req, res) => {
    try {
        // Find user by ID and exclude password field
        const user = await User.findById(req.userId).select('-password');

        // Handle user not found case
        if (!user) {
            return res
                .status(400)
                .json({ success: false, message: 'User not found' });
        }

        // Respond with success message and user details
        res.status(200).json({
            success: true,
            user, // Include user details in the response
        });
    } catch (error) {
        console.log(error); // Log error
        res.status(500).json({ success: false, message: error.message }); // Respond with error message
    }
};
