const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create a schema
const categorySchema = new Schema({

    categoryName: { type: String}
    
  });
  
  // Create a model
  const Category = mongoose.model('categories', categorySchema);
  
  // Export the model
  module.exports = Category;