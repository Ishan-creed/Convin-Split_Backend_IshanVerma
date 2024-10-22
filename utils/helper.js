import User from '../models/user.model.js';

// Utility function to find a user by email
export const findUserByEmail = async (email) => {
  return await User.findOne({ email });
  
};


