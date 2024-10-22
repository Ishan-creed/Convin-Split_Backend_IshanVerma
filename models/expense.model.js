import mongoose from "mongoose";

const expenses = new mongoose.Schema({

    description: {
        type: String,
        required: true,
        trim: true,
      },
      amount: {
        type: Number,
        required: true,
        min: 0.01,  // Ensure a minimum expense value
      },
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,  // Link the expense to the user who created it
      },
      
      created_at: { type: Date, default: Date.now } ,

      participants: [
        {
          user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
          amountOwed: { type: Number, required: true, min: 0 },  // Each participant's owed amount
          percentage: { type: Number, min: 0, max: 100 },  // Optional percentage field for percentage-based splits
        }
      ],
      splitMethod: {
        type: String,
        enum: ['equal', 'exact', 'percentage'],  // Defines the type of split
        required: true,
      },
    }, {
      timestamps: true


});


const Expense = mongoose.model('Expense', expenses);

export default Expense;