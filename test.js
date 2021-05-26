/*var x = 10
var y = 5
x += 5;

console.log(x);



function scaryClown() {
  return new Promise(resolve => {
    setTimeout(() => {
      resolve('🤡');
    }, 2000);
  });
}

async function msg() {
  const msg = await scaryClown();
  console.log("4");
  console.log('Message:', msg);
}

console.log("1");
msg();
console.log("2");
msg();
console.log("3")
*/

/*
var object = {
    "1234": {
        "userID": "1234",
        "name": "A",
        "turn" : 1
    },
    "5678":{
        "userID": "5678",
        "name": "B",
        "turn" : 2
    }
}
console.log("Original");
console.log(object);
console.log("---------------------------------");

var newArrayUsers = Object.entries(object);
newArrayUsers.sort(function (a, b) {
  if (a[1].turn > b[1].turn) {
    return 1;
  }
  if (a[1].turn < b[1].turn) {
    return -1;
  }
  // a must be equal to b
  return 0;
});
console.log("Ordenados");
console.log(newArrayDataOfOjbect);

for (let index = 0; index < newArrayDataOfOjbect.length; index++) {
 newArrayDataOfOjbect[index][1].turn = index+1; 
}

console.log("turno cambiado");
console.log(newArrayDataOfOjbect);

console.log("Turno final")
for (let index = 0; index < newArrayDataOfOjbect.length; index++) {
   
  if (newArrayDataOfOjbect[index][1].turn === 1) {
    newArrayDataOfOjbect[index][1].turn = newArrayDataOfOjbect.length;
  }else{
    newArrayDataOfOjbect[index][1].turn =newArrayDataOfOjbect[index][1].turn - 1;
  }
   
 }
 console.log(newArrayDataOfOjbect);


console.log("Como objeto");
const way = newArrayDataOfOjbect.reduce((acc, record) => ({
  ...acc,
  [record[0]]: record[1],
}), {});
console.log(way);


const User = require('./controllers/users')


var users =  {
   "vigb6FBAydO6rU3UAAAC": {
    "name": "asd",
    "level": "Virtuoso",
    "userID": "5c37bb108ebeb209c8d67d5d",
    "socketID": "vigb6FBAydO6rU3UAAAC",
    "books": 1000,
    "turn": 1,
    "bet": 200,
    "left": false,
    "answer": "option_2",
    "won": false,
    "timeResponse": "2563"
    },
    "12345FBAydO6rU3UAAAC": {
      "name": "asd",
      "level": "Virtuoso",
      "userID": "5c37bb108ebeb209c8d67d5d",
      "socketID": "vigb6FBAydO6rU3UAAAC",
      "books": 1000,
      "turn": 1,
      "bet": 200,
      "left": false,
      "answer": "option_2",
      "won": false,
      "timeResponse": "2563"
    }
  }

    console.log(Object.keys(users));

    */

    const redis = require("redis");
    const redisClient = redis.createClient();

    redisClient.on('connect', function () {
      console.log('Conectado a Redis Server');
      redisClient.smembers("loggedUsers", (err, object) => {
        if(err) {
          console.error(err);
        } else {
          console.log("Users");
          console.log(object);
          
        }
      });

      redisClient.hgetall("rooms", (err, object) => {
        if(err) {
          console.error(err);
        } else {
          console.log("Rooms");
          console.log(object);
        }
      });

      redisClient.hgetall("games", (err, object) => {
        if(err) {
          console.error(err);
        } else {
          console.log("games");
          console.log(object);
        }
      });

      redisClient.quit();

      /*
      redisClient.sadd('list', 'nuevo1');
      redisClient.sadd('list', 'nuevo2');
      redisClient.sadd('list', 'nuevo3');

      redisClient.srem('list', 'nuevo*');
      
      redisClient.sscan('list', '0', 'match', 'nuevo*', function(err, reply){
        console.log(reply);
      })
      */
    });

    /*
    const redisClientsu = redis.createClient();

    redisClientsu.config("set", "notify-keyspace-events", "KEA", function(err, reply){
      console.log(reply);
    })

    redisClientsu.on("pmessage", function (pattern, channel, message) {
      console.log("("+  pattern +")" + " client received message on " + channel + ": " + message);
      switch (channel) {
          // blah blah blah
          // ...
      }
    });
    redisClientsu.psubscribe("__key*__:*")
    */    



   

    
