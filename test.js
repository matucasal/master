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

var a = "10"
var b = 1
console.log(a+b);