const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create a schema
const question_geografiaSchema = new Schema({

    level: { type: String },
    sublevel: { type: String },
    question: { type: String },
    option_1: { type: String },
    option_2: { type: String },
    option_3: { type: String },
    answer_ok: { type: String }
    
  });
  
  // Create a model
  const Question_geografia = mongoose.model('question_geografia', question_geografiaSchema);
  
  // Export the model
  module.exports = Question_geografia;