
var redisClient;


module.exports = {
    setClient : function(inClient) { redisClient = inClient; },

    saveUserLogged : function (user) {
        console.log(user.id);
        redisClient.hmset("loggedUsers", [user.id, user.local.name]);
    }

}