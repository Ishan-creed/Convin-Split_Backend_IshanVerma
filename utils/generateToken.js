import jwt from 'jsonwebtoken'; // Import the jsonwebtoken library for creating and verifying tokens

// Function to generate a JWT token and set it as a cookie in the response
const generateTokenAndSetCookie = (userId, res) => {
  // Create a token with the user ID as payload, using the secret key and setting an expiration time of 15 days
  const token = jwt.sign({ userId }, process.env.JWT_SECRET, {
    expiresIn: '15d', // Token will expire in 15 days
  });

  // Set the token as a cookie in the response with specified options
  res.cookie('token', token, {
    maxAge: 15 * 24 * 60 * 60 * 1000, // Cookie will expire in 15 days
    sameSite: 'Strict', // Cookie will only be sent in a first-party context (no cross-origin requests)
  });

  return token; // Return the generated token for further use if needed
};

export default generateTokenAndSetCookie; // Export the function for use in other modules
