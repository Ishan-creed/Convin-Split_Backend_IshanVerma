import Expense from '../models/expense.model.js'; // Import the Expense model
import User from '../models/user.model.js'; // Import the User model
import { findUserByEmail } from '../utils/helper.js'; // Import utility function to find user by email
import { generateBalanceSheet } from '../utils/balanceSheet.js'; // Import utility function to generate balance sheet

// Create a new expense

export const createExpense = async (req, res) => {
  try {
    const { description, amount, participants, splitMethod } = req.body; // Extract data from request body
    const createdBy = req.userId; // Get the user ID from the request

    // Check for authorization
    if (!createdBy) {
      return res.status(401).json({ message: 'Unauthorized - No user ID found' });
    }

    // Validate required fields
    if (!description || !amount || !splitMethod || !Array.isArray(participants) || participants.length === 0) {
      return res.status(400).json({ message: 'Missing required fields or participants is not an array' });
    }

    // Convert participants (by email) to ObjectId and ensure all users exist
    const processedParticipants = await Promise.all(
      participants.map(async (participant) => {
        const { email } = participant;
        const user = await findUserByEmail(email); // Find user by email

        if (!user) {
          throw new Error(`User with email ${email} doesn't exist. Please create an account first.`);
        }

        return {
          user: user._id, // Store user ObjectId
          email: user.email,
          fullUser: user, // Keep the full user object for later use
        };
      })
    );

    let totalAmount = amount; // Total amount for the expense

    // Split logic based on the specified method
    if (splitMethod === 'equal') {
      const splitAmount = (totalAmount / processedParticipants.length).toFixed(2);
      processedParticipants.forEach((p) => {
        p.amountOwed = splitAmount; // Assign equal amount owed to each participant
      });
    } else if (splitMethod === 'exact') {
      const exactAmounts = participants.map(p => p.amountOwed);
      const totalOwed = exactAmounts.reduce((acc, curr) => acc + parseFloat(curr), 0);

      // Validate that exact amounts match total amount
      if (totalOwed !== totalAmount) {
        return res.status(400).json({ message: `Exact amounts must add up to the total amount: ${totalAmount}` });
      }

      // Assign the exact amounts owed
      processedParticipants.forEach((p, index) => {
        p.amountOwed = participants[index].amountOwed;
      });
    } else if (splitMethod === 'percentage') {
      const percentages = participants.map(p => {
        const percentage = parseInt(p.percentage, 10); // Extract the percentage value
        if (isNaN(percentage) || percentage < 0 || percentage > 100) {
          throw new Error(`Invalid percentage for ${p.email}. Must be an integer between 0 and 100.`);
        }
        return percentage;
      });
    
      const totalPercentage = percentages.reduce((acc, curr) => acc + curr, 0);
      // Validate that percentages add up to 100
      if (totalPercentage !== 100) {
        return res.status(400).json({ message: 'Percentages must add up to 100%' });
      }
    
      // Assign the amount owed and percentage to each participant
      processedParticipants.forEach((p, index) => {
        const percentage = percentages[index];
        p.amountOwed = ((totalAmount * percentage) / 100).toFixed(2);
        p.percentage = percentage; // Store the percentage here
      });
    }
  
    // Create the new expense
    const expense = new Expense({
      description,
      amount: totalAmount,
      participants: processedParticipants.map(p => ({
        user: p.user,
        amountOwed: p.amountOwed,
        percentage: p.percentage || null, // Include percentage if applicable
      })),
      splitMethod,
      createdBy,
    });

    await expense.save(); // Save the expense to the database

    // Update users' expenses field with the new expense ID
    const participantIds = processedParticipants.map(p => p.user);
    await User.updateMany(
      { _id: { $in: participantIds } },
      { $push: { expenses: expense._id } } // Push expense ID to the user's expenses array
    );

    const fullParticipants = processedParticipants.map(p => ({
      name: p.fullUser.name,
      email: p.fullUser.email,
      mobile: p.fullUser.mobile,
      amountOwed: p.amountOwed,
      percentage: p.percentage,
    }));

    return res.status(201).json({
      message: 'Expense created successfully',
      expense: {
        description,
        amount: totalAmount,
        splitMethod,
        createdBy,
        participants: fullParticipants, // Include participant details in response
      },
    });
  } catch (error) {
    console.error("Error creating expense:", error); // Log any errors
    return res.status(400).json({ message: error.message });
  }
};

// Retrieve individual user expenses by email
export const getUserExpenses = async (req, res) => {
  try {
    const { email } = req.body; // Extract email from request body

    // Find user by email
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    console.log("User ID:", user._id); // Log the user ID

    // Find expenses where the user is a participant
    const userExpenses = await Expense.find({ 'participants.user': user._id })
      .select('description amount participants createdBy splitMethod createdAt') // Select relevant fields
      .populate('participants.user', 'name email mobile') // Populate participant details
      .populate('createdBy', 'name email') // Populate creator details
      .lean();

    console.log("User Expenses:", userExpenses); // Log the retrieved expenses

    if (userExpenses.length === 0) {
      return res.status(404).json({ message: 'No expenses found for this user.' });
    }

    // Filter out the relevant details for the given user
    const filteredExpenses = userExpenses.map(expense => {
      console.log("Expense Participants:", expense.participants); // Log participants for each expense

      // Find the participant matching the user
      const participant = expense.participants.find(p => p.user._id.toString() === user._id.toString());

      // Prepare participant names for the response
      const participantNames = expense.participants.map(p => p.user.name); // Get names of all participants

      if (!participant) return null; // If the participant is not found, skip this expense

      return {
        description: expense.description,
        amountOwed: participant.amountOwed,
        percentage: expense.splitMethod === 'percentage' ? participant.percentage : undefined, // Include percentage if applicable
        date: expense.createdAt, // Include the date of the expense
        participants: participantNames, // Include names of all participants
      };
    }).filter(exp => exp !== null); // Remove any null entries

    console.log("Filtered Expenses:", filteredExpenses); // Log the filtered expenses

    return res.status(200).json({
      message: 'User expenses retrieved successfully',
      expenses: filteredExpenses, // Return filtered expenses
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to retrieve user expenses.' });
  }
};

// Retrieve overall expenses with pagination
export const getAllExpenses = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query; // Get pagination parameters

    const expenses = await Expense.find()
      .skip((page - 1) * limit) // Skip to the correct page
      .limit(parseInt(limit)) // Limit the number of results
      .select('description amount participants createdBy splitMethod') // Select relevant fields
      .populate('participants.user', 'name email mobile') // Populate participant details
      .populate('createdBy', 'name email') // Populate creator details
      .lean();

    if (expenses.length === 0) {
      return res.status(404).json({ message: 'No expenses found.' });
    }

    return res.status(200).json({
      message: 'All expenses retrieved successfully',
      expenses, // Return all retrieved expenses
    });
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to retrieve expenses.' });
  }
};

// Download the balance sheet for a user
export const downloadBalanceSheet = async (req, res) => {
  try {
    const { email } = req.body;

    // Find the user by email
    const user = await findUserByEmail(email);
    if (!user) {
      return res.status(404).json({ message: 'User not found.' });
    }

    // Find all expenses involving this user
    const userExpenses = await Expense.find({ 'participants.user': user._id })
      .populate('participants.user', 'name email mobile')
      .populate('createdBy', 'name email');

    if (userExpenses.length === 0) {
      return res.status(404).json({ message: 'No expenses found for this user.' });
    }

    // Find all expenses for all users
    const allExpenses = await Expense.find()
      .populate('participants.user', 'name email mobile')
      .populate('createdBy', 'name email');

    // Generate balance sheet in CSV format
    const balanceSheetCSV = generateBalanceSheet(userExpenses, allExpenses, user.email);

    // Set headers to prompt file download
    res.setHeader('Content-Disposition', `attachment; filename=user-${user.name}-balance-sheet.csv`);
    res.setHeader('Content-Type', 'text/csv');
    res.status(200).send(balanceSheetCSV);
  } catch (error) {
    console.error(error);
    return res.status(500).json({ message: 'Failed to download balance sheet.', error: error });
  }
};
