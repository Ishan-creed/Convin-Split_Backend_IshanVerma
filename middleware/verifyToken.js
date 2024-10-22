import jwt from 'jsonwebtoken'; // Import the jsonwebtoken library for token verification

const verifyToken = (req, res, next) => {
  try {
    // Extract the authorization header from the request
    const authHeader = req.headers.authorization;

    // Check if the authorization header is provided
    if (!authHeader) {
      return res.status(401).json({ success: false, message: 'Unauthorized - No token provided' });
    }

    // Bearer token format: 'Bearer <token>'
    const token = authHeader.split(' ')[1]; // Split the header and extract the token

    // Check if the token is present
    if (!token) {
      return res.status(401).json({ success: false, message: 'Unauthorized - Invalid token format' });
    }

    // Verify the token using the secret key
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if the token verification was successful
    if (!decoded) {
      return res.status(401).json({ success: false, message: 'Unauthorized - Invalid token' });
    }

    // If verification is successful, attach the user ID to the request object
    req.userId = decoded.userId;

    // Proceed to the next middleware or route handler
    next();
  } catch (error) {
    console.error(error); // Log the error for debugging
    res.status(400).json({ success: false, message: error.message }); // Send a response with the error message
  }
};

export default verifyToken; // Export the middleware function for use in routes
