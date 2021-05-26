const redis = require('redis')
const logger = require('../configuration/logger')(__filename);


const redisClient = redis.createClient();

redisClient.on('connect', function () {
    logger.info('Conectado a Redis Server');
  });
  

module.exports = {

    saveUserLogged : function (user) {
        redisClient.sadd('loggedUsers', user.id)
    },

    removeUserLogged : function (userID) {
        redisClient.srem('loggedUsers', userID)
    },

    saveRoom : async function(room){
        let key = "id:" + room.id
        let value = "level:" + room.level
        redisClient.hmset("rooms", [key, value])
    },

    saveGame : function(game){
        let key = "id:" + game.id
        let value = "level:" + game.level
        redisClient.hmset("games", [key, value]);
    }

}