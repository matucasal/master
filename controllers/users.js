const JWT = require('jsonwebtoken');
const User = require('../models/user');
const { JWT_SECRET } = require('../configuration');
const logger = require('../configuration/logger')(__filename);
const fs = require('fs');
const path = require("path");
const { userInfo } = require('os');
const redisController = require('./redisController');


signToken = user => {
  return JWT.sign({
    iss: 'MasterGame',
    sub: user.id,
    iat: new Date().getTime(), // current time
    exp: new Date().setDate(new Date().getDate() + 1) // current time + 1 day ahead
  }, JWT_SECRET);
}


module.exports = {

  signUp: async (req, res, next) => {
    
    const { email, password, name } = req.body;
    // Check if there is a user with the same email
    const foundUser = await User.findOne({ "local.email": email });
    if (foundUser) { 
      return res.status(403).json({ error: 'Email is already in use'});
    }

    // Create a new user
    const newUser = new User({ 
      method: 'local',
      local: {
        email: email, 
        password: password,
        name : name
      },
      books: 10000,
      level: "Neofito"
    });


    await newUser.save(function(err,user) {

      if(user){
        // Generate the token
        const token = signToken(newUser);
        // Respond with token
        res.status(200).json({ "userID": user.id ,"token": token});
        logger.notice("New user signup");
      }else{
        console.log("err", err)
        res.status(409).send("something wrong");
      }

      
    })

    
  },

  signIn: async (req, res, next) => {
    // Generate token
    const token = signToken(req.user);
    res.setHeader('Content-Type', 'application/json');
    res.status(200);
    res.send(JSON.stringify({ name: req.user.local.name, mail: req.user.local.mail, token: token, level: req.user.level, userID: req.user.id, avatar: req.user.avatar, animations: req.user.animations }, null, 3));
    logger.notice(req.user.local.name + " is logged in");
    redisController.saveUserLogged(req.user);
  },

  googleOAuth: async (req, res, next) => {
    // Generate token
    const token = signToken(req.user);
    res.status(200).json({ token });
  },

  facebookOAuth: async (req, res, next) => {
    // Generate token
    const token = signToken(req.user);
    req.user.token = token;
    res.status(200).json( {user: req.user, token: token} );
  },

  secret: async (req, res, next) => {
    console.log('I managed to get here!');
    res.json({ secret: "resource" });
  },

  getAvatar: async (req, res, next) => {
    var nameImage = req.params.id;
    fs.readFile(path.resolve(__dirname, '../resources/images/avatars/' + nameImage), function (err, content) {
      if (err) {
          res.writeHead(400, {'Content-type':'text/html'})
          console.log(err);
          res.end("No such image");    
      } else {
          //specify the content type in the response will be an image
          res.writeHead(200,{'Content-type':'image/png'});
          res.end(content);
      }
  });

  },

  updateBooks: async (user) => {
    User.findOneAndUpdate({ _id: user.userID }, { $inc: { books: -user.books }}, {new: true},function(err, response) {
      if (err) {
        console.log(err);
      }else{

      }
    })
  },

  updateGameWin: async (user) => {
    User.findOneAndUpdate({ _id: user.userID }, { $inc: { books: user.books, gamesWon: +1, gamesPlayed: +1  }}, {new: true},function(err, response) {
      if (err) {
        console.log(err);
      }
    })
  },
  
  updateGameLoose: async (userID, books) => {

    User.findOneAndUpdate({ _id: userID }, { $inc: { gamesPlayed: +1, gamesLost: +1, books: -books }}, {new: true},function(err, response) {
      if (err) {
        console.log(err);
      }
    })
  },





}

