const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create a schema
const questionSchema = new Schema({

    level: { type: String },
    sublevel: { type: String },
    category: { type: String },
    question: { type: String },
    option_1: { type: String },
    option_2: { type: String },
    option_2: { type: String },
    answer_ok: { type: String }
    
  });
  
  // Create a model
  const Question = mongoose.model('question', questionSchema);
  
  // Export the model
  module.exports = Question;