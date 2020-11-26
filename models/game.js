const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Create a schema
const gameSchema = new Schema({

    date: { type: Date, default: Date.now },
    gameID: { type: String, required: true },
    participants: [{}],
    rounds : { type: Number },
    won: [{}]
    
  });
    
  // Create a model
  const Game = mongoose.model('games', gameSchema);
  
  // Export the model
  module.exports = Game;