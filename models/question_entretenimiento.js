const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create a schema
const question_entretenimientoSchema = new Schema({

    level: { type: String },
    sublevel: { type: String },
    question: { type: String },
    option_1: { type: String },
    option_2: { type: String },
    option_3: { type: String },
    answer_ok: { type: String }
    
  });
  
  // Create a model
  const Question_entretenimiento = mongoose.model('question_entretenimiento', question_entretenimientoSchema);
  
  // Export the model
  module.exports = Question_entretenimiento;