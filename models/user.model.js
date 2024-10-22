import mongoose from "mongoose";

// Email validation regex
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,  // Removes leading/trailing whitespaces
    minlength: 2,
  },

  email: {
    type: String,
    required: true,
    unique: true, // Ensure the email is unique in the database
    trim: true,
    lowercase: true, // Converts email to lowercase before saving
    validate: {
      validator: function (email) {
        return emailRegex.test(email); // Validates email format
      },
      message: (props) => `${props.value} is not a valid email!`,
    },
  },

  password: {
    type: String,
    required: true,
    minlength: 6, // Minimum password length of 6 characters
  },

  mobile: {
    type: String,
    required: true,
    match: [/^\d{10}$/, "Please enter a valid 10-digit mobile number"], // Mobile number validation
  },

  expenses: [
    {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Expense',  // Reference to the Expense schema
    }
  ],

}, {
  timestamps: true // Adds createdAt and updatedAt fields automatically
});

// Index on email to ensure efficient querying
userSchema.index({ email: 1 }, { unique: true });

const User = mongoose.model('User', userSchema);

export default User;
