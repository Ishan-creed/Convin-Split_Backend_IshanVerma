import { Parser } from 'json2csv';

// Utility function to generate balance sheet as CSV
export const generateBalanceSheet = (userExpenses, allExpenses = [], userEmail) => {
  try {
    // Individual expenses for the specific user
    const individualData = userExpenses.map(expense => {
      const participant = expense.participants.find(p => p.user.email === userEmail);
      const amountOwed = participant ? participant.amountOwed : 0; // Get only the amount owed by the user

      return {
        description: expense.description || 'N/A',
        amount: expense.amount || 0,
        createdBy: expense.createdBy?.name || 'Unknown',
        participants: `You - Owed: ${amountOwed}`, // Show only the user's owed amount
        splitMethod: expense.splitMethod || 'N/A',
        created_at: expense.created_at || 'N/A',
      };
    });

    // Overall expenses for all users, if provided
    const overallData = Array.isArray(allExpenses) && allExpenses.length > 0
      ? allExpenses.map(expense => ({
          description: expense.description || 'N/A',
          amount: expense.amount || 0,
          createdBy: expense.createdBy?.name || 'Unknown',
          participants: Array.isArray(expense.participants)
            ? expense.participants.map(p => `${p.user?.name || 'Unknown'} (${p.user?.email || 'Unknown'}) - Owed: ${p.amountOwed || 0}`).join(', ')
            : 'No participants',
          splitMethod: expense.splitMethod || 'N/A',
          created_at: expense.created_at || 'N/A',
        }))
      : []; // If no allExpenses provided, leave it empty

    // Create the CSV parser
    const parser = new Parser();

    // Convert individual data to CSV
    const individualCSV = parser.parse(individualData);

    // Convert overall data to CSV, if available
    const overallCSV = overallData.length > 0 ? parser.parse(overallData) : '';

    // Combine individual and overall CSVs with appropriate spacing
    const combinedCSV = overallCSV
      ? `${individualCSV}\n\nOverall Expenses\n\n${overallCSV}`
      : individualCSV;

    return combinedCSV;
  } catch (error) {
    console.error("Error generating balance sheet:", error.message);
    throw error; // Rethrow error so it can be handled upstream if needed
  }
};
