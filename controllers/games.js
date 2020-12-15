const Game = require('../models/game');
const logger = require('../configuration/logger')(__filename);

module.exports = {

  newGame: async function () {
    const newGame = new Game;
    newGame.save((err, game) => {
      // Check if error occured
      return game._id;
    })
  },
  saveGame: async function (id, users) {
    game = new Game({
      'gameID': id,
      'participants': users
    })
    game.save((err, appt) => {
      if (err) { logger.error(err); }
      console.log("Mongo save ");
      logger.info("Mongodb inserted action was ok.");
    });


  },
  gameUpdate: async function (id, won, rounds) {

    let winner = {
      "userID": won.userID,
      "username": won.name,
      "prize": won.books
    }
    game = {
      'rounds': rounds,
      'won': winner
    }
    Game.findOneAndUpdate({ 'gameID': id }, game, function (error) {
      if (error) { logger.error(error) }
      logger.debug("Mongodb object updated succesfully")
    })
  }

}