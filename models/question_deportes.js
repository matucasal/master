const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create a schema
const question_deportesSchema = new Schema({

    level: { type: String },
    sublevel: { type: String },
    question: { type: String },
    option_1: { type: String },
    option_2: { type: String },
    option_3: { type: String },
    answer_ok: { type: String }
    
  });
  
  // Create a model
  const Question_deportes = mongoose.model('question_deportes', question_deportesSchema);
  
  // Export the model
  module.exports = Question_deportes;