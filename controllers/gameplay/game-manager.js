const Category = require('../../models/category');
const Question = require('../../controllers/questions');
const logger = require('../../configuration/logger')(__filename);
const User = require('../users');
const Game = require('../games');
const { func } = require('joi');
const { response } = require('express');

var gamePlaying = {};
var categories = [];

Category.find({}, {
    "_id": 0,
    "categoryName": 1
  }, function(error, res){
    categories = res.map(a => a.categoryName);
})


function newGame(game){
    gamePlaying[game.id] = game;
}

function getGame(id){
    return gamePlaying[id];
}

function delUserGame(gameID, socketID){
    let userID =  gamePlaying[gameID].users[socketID].userID;
    if (gamePlaying[gameID].rounds[gamePlaying[gameID].rounds.length -1].state == "betting" && gamePlaying[gameID].rounds[gamePlaying[gameID].rounds.length -1].users[socketID].turn != gamePlaying[gameID].rounds[gamePlaying[gameID].rounds.length -1].nextTurn) {
        gamePlaying[gameID].rounds[gamePlaying[gameID].rounds.length -1].usersInRound -= 1;
        delete gamePlaying[gameID].users[socketID];
        delete gamePlaying[gameID].rounds[gamePlaying[gameID].rounds.length -1].users[socketID];
        return userID;
    }
    if (gamePlaying[gameID].rounds[gamePlaying[gameID].rounds.length -1].state == "betting" && gamePlaying[gameID].rounds[gamePlaying[gameID].rounds.length -1].users[socketID].turn == gamePlaying[gameID].rounds[gamePlaying[gameID].rounds.length -1].nextTurn) {
        newBet({'value': 50, 'roomID': gameID, 'userID': userID, 'left': true, 'socket': socketID, 'pairing': false});
        delete gamePlaying[gameID].users[socketID];
        //delete gamePlaying[gameID].rounds[gamePlaying[gameID].rounds.length -1].users[socketID];
        return userID;
    }
    if (gamePlaying[gameID].rounds[gamePlaying[gameID].rounds.length -1].state == "pairing") {
        newBet({'value': 50, 'roomID': gameID, 'userID': userID, 'left': true, 'socket': socketID, 'pairing': true});
        delete gamePlaying[gameID].users[socketID];
        return userID;
    }
    if (gamePlaying[gameID].rounds[gamePlaying[gameID].rounds.length -1].state == "answering") {
        newAnswer({"socketID": socketID, "userID": userID, "answer": "", "timeResponse": 8000});
        delete gamePlaying[gameID].users[socketID];
        delete gamePlaying[gameID].rounds[gamePlaying[gameID].rounds.length -1].users[socketID];
        return userID;
    }

}

function startGame(roomID){
    //Elijo categoría
    gamePlaying[roomID].rounds = [];
    let users = gamePlaying[roomID].users;
    updatebooks(users);
    users = Object.assign({}, ...users.map(user => ({[user.socketID]: user})));
    gamePlaying[roomID].users = [];
    gamePlaying[roomID].users = users;
    return createRound(users, roomID, true); 
}

function updatebooks(users){
    users.forEach(usr => {
        User.updateBooks(usr);
    });
}


function getQuestion(roomID, callback){
    Question.getQuestion(gamePlaying[roomID].rounds[gamePlaying[roomID].rounds.length -1].category, 1, function(result){
        if(result){
            let quest = result;
            let question = {};
            question.id = quest._id;
            question.question = quest.question;
            question.answers = [];
            question.answers.push(quest.option_1);
            question.answers.push(quest.option_2);
            question.answers.push(quest.option_3);
            question.answerCorrect = quest.answer_ok;
            gamePlaying[roomID].rounds[gamePlaying[roomID].rounds.length -1].questionID = quest.id;
            gamePlaying[roomID].rounds[gamePlaying[roomID].rounds.length -1].answer_ok = quest.answer_ok;
            callback(question)
        }else{
            console.log("error question");
        }  
    })
    
}

/**
 * @param {{value: number , roomID: string, userID: string, left: boolean, socket: string, pairing: boolean}} data
 */
function newBet(data){
    console.log(data);
    let response = {};
    response.finished = false

    if(data.left == true){
        gamePlaying[data.roomID].rounds[gamePlaying[data.roomID].rounds.length -1].prize += parseInt(data.bet);
        gamePlaying[data.roomID].rounds[gamePlaying[data.roomID].rounds.length -1].betCount += 1;
        gamePlaying[data.roomID].rounds[gamePlaying[data.roomID].rounds.length -1].nextTurn += 1;
        gamePlaying[data.roomID].users[data.socket].books -= parseInt(data.bet);
        delete gamePlaying[data.roomID].rounds[gamePlaying[data.roomID].rounds.length -1].users[data.socket];
    }else{
        gamePlaying[data.roomID].rounds[gamePlaying[data.roomID].rounds.length -1].betCount += 1;
        gamePlaying[data.roomID].rounds[gamePlaying[data.roomID].rounds.length -1].nextTurn += 1; 
        gamePlaying[data.roomID].rounds[gamePlaying[data.roomID].rounds.length -1].users[data.socket].bet = parseInt(data.bet);
        gamePlaying[data.roomID].rounds[gamePlaying[data.roomID].rounds.length -1].prize += parseInt(data.bet);
    }

    if(data.pairing){
        let pairing = checkPairing(gamePlaying[data.roomID].rounds[gamePlaying[data.roomID].rounds.length -1].users);
        
        if(!pairing){
            response.finished = true;
            return response;
        }else{
            response.nextUser = pairing;
            return response;
        }
    }   
    
    if(gamePlaying[data.roomID].rounds[gamePlaying[data.roomID].rounds.length -1].betCount == gamePlaying[data.roomID].rounds[gamePlaying[data.roomID].rounds.length -1].usersInRound){
        
        let pairing = checkPairing(gamePlaying[data.roomID].rounds[gamePlaying[data.roomID].rounds.length -1].users);
        if(!pairing){
            response.finished = true;
            return response;
        }else{
            response.nextUser = pairing;
            return response;
        }   
    }
    return response;
}

function newAnswer(answer, roomID){
    logger.info("Respuesta recibida " + answer.userID);
    gamePlaying[roomID].rounds[gamePlaying[roomID].rounds.length -1].state = "Answering";
    let response = {};
    gamePlaying[roomID].rounds[gamePlaying[roomID].rounds.length -1].users[answer.socketID].answer = answer.answer;
    gamePlaying[roomID].rounds[gamePlaying[roomID].rounds.length -1].users[answer.socketID].timeResponse = answer.timeResponse;
    gamePlaying[roomID].rounds[gamePlaying[roomID].rounds.length -1].answersCount++;
    
    //Verifico si todos respondieron
    if (gamePlaying[roomID].rounds[gamePlaying[roomID].rounds.length -1].answersCount == Object.keys(gamePlaying[roomID].rounds[gamePlaying[roomID].rounds.length -1].users).length) {
        //Opcion correcta
        console.log("Respondieron todos")
        let res_ok = gamePlaying[roomID].rounds[gamePlaying[roomID].rounds.length -1].answer_ok;
        let winner;
        //verificar quien ganó, emitir respuesta y recalcular libros para cada user.
        let userList = gamePlaying[roomID].rounds[gamePlaying[roomID].rounds.length -1].users;

        Object.keys(userList).forEach(function(key) {
            console.log("Respuesta: " + userList[key].answer)
            if (userList[key].answer == res_ok) {
                if (winner === undefined) {
                    winner = userList[key];
                }else{
                    if (userList[key].timeResponse < winner.timeResponse) {
                        winner = userList[key];
                    }
                }
            }
        });


        //Si no hay ganador, entra al IF
        if (winner === undefined) {
            let jackpot = 0;
            console.log("----No hubo ningún ganador en esta ronda----");

            Object.keys(userList).forEach(function(key) {
                
                gamePlaying[roomID].rounds[gamePlaying[roomID].rounds.length -1].users[userList[key].socketID].books -= parseInt(userList[userList[key].socketID].bet);
                gamePlaying[roomID].users[userList[key].socketID].books -= parseInt(userList[userList[key].socketID].bet);
                jackpot += parseInt(userList[userList[key].socketID].bet);
                if (gamePlaying[roomID].users[userList[key].socketID].books <= 0){
                    //Game over para el player
                    response.usersGameOver.push(gamePlaying[roomID].users[userList[key].socketID]);
                    delete gamePlaying[roomID].users[userList[key].socketID];
                    User.updateGameLoose(userList[userList[key].socketID].userID, gamePlaying[roomID].books);  
                }

            });
            gamePlaying[roomID].jackpot += jackpot;
            let newRound = createRound(gamePlaying[roomID].rounds[gamePlaying[roomID].rounds.length -1].users, roomID, false);
            gamePlaying[roomID].rounds.push(newRound);
            response.isWinner = false;
            response.round = newRound;
            console.log(JSON.stringify(response));
            return response;
        }

        gamePlaying[roomID].rounds[gamePlaying[roomID].rounds.length -1].users[winner.socketID].won = true;
        gamePlaying[roomID].rounds[gamePlaying[roomID].rounds.length -1].userWon = winner.userID;
        gamePlaying[roomID].rounds[gamePlaying[roomID].rounds.length -1].users[winner.socketID].books += parseInt(gamePlaying[roomID].rounds[gamePlaying[roomID].rounds.length -1].prize) - parseInt(userList[winner.socketID].bet);
        gamePlaying[roomID].users[winner.socketID].books += parseInt(gamePlaying[roomID].rounds[gamePlaying[roomID].rounds.length -1].prize) - parseInt(userList[winner.socketID].bet);

        console.log("----Hay ganador-----");
        console.log(JSON.stringify(winner));

        let usersLost = Object.keys(userList).filter(function (key){ return userList[key].won != true }); 
        console.log("users que perdieron en la ronda: " + JSON.stringify(usersLost));

        //Se envia el resultado

        response.isWinner = true;
        response.winner = winner;
        response.usersLost = usersLost;
        response.usersGameOver = [];  
        
        //Se le restan los libros a los que perdieron
        usersLost.forEach(element => {
            gamePlaying[roomID].rounds[gamePlaying[roomID].rounds.length -1].users[element].books -= parseInt(userList[element].bet);
            gamePlaying[roomID].users[element].books -= parseInt(userList[element].bet);
            if (gamePlaying[roomID].users[element].books <= 0){
                //Game over para el player
                response.usersGameOver.push(gamePlaying[roomID].users[element]);
                delete gamePlaying[roomID].users[element];
                User.updateGameLoose(userList[element].userID, gamePlaying[roomID].books);  
            }
        });

        switch (Object.keys(gamePlaying[roomID].users).length) {
            case 1:
                //End game
                logger.info("Game terminated. ID: " + roomID);
                gamePlaying[roomID].won = gamePlaying[roomID].users[Object.keys(gamePlaying[roomID].users)[0]].userID
                Game.gameUpdate(roomID, gamePlaying[roomID].won, gamePlaying[roomID].rounds);
                User.updateGameWin(gamePlaying[roomID].users[Object.keys(gamePlaying[roomID].users)[0]]);
                delete  gamePlaying[roomID];
                response.gameFinished = true;
                return response;
            break;    
            case 2:
                console.log("Quedan 2 jugadores, se lanza el one2one");
                //let newRound2 = createRound(gamePlaying[roomID].users, roomID, false);
                //newRound2.isOne2One = true;
                //response.round = newRound2;
                createOne2One(gamePlaying[roomID].users, roomID);
                response.isOne2One = true;
                return response;
                break;
            case 3:
                console.log("Quedan más jugadores, se sigue jugando...");
                let newRound = createRound(gamePlaying[roomID].users, roomID, false);
                response.round = newRound;
                return response;
            break;
            case 4:
                console.log("Quedan más jugadores, se sigue jugando...");
                let newRound4 = createRound(gamePlaying[roomID].users, roomID, false);
                response.round = newRound4;
                return response;
            break;     
        }

    }else{
        //Faltan que algunos usuarios respondan
        return false;
    }
    
}

function checkPairing(userList){

    let maxbet = 0;
    let nextUser = [];

    Object.keys(userList).forEach(function(key) {
        if(userList[key].bet > maxbet){
            maxbet = userList[key].bet;
        }
    });

    Object.keys(userList).forEach(function(key) {
        if(userList[key].bet < maxbet){
            nextUser.push(userList[key]);
            
        }
    });

    console.log(JSON.stringify(nextUser));

    nextUser.sort(function (a, b) {          
        if (a.turn > b.turn) {
            return 1;
        }
        if (a.turn < b.turn) {
            return -1;
        }
        // a must be equal to b
        return 0;
    });

    console.log(JSON.stringify(nextUser));

    if(nextUser.length != 0){
        return nextUser[0];
    }else{
        return "";
    }

}

/**
 * Function to re-order the turns 
 * @param obj objeto con los users de la room
 *  */
function changeTurns(obj, roomID){

    //Reacomodamiento de turnos si quedan 4 players
    if (Object.keys(obj).length === 4) {

        Object.keys(obj).forEach(key => {
            let value = obj[key];
            (value.turn === 1) ? value.turn = 4 :  value.turn = value.turn - 1;
        });
        
    }else{
        //reordenamiento de los users cuando quedan menos de 4
        //Paso el object a array y los ordeno
        var newArrayUsers = Object.entries(obj);
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

        //Corrigo los Turnos
        for (let index = 0; index < newArrayUsers.length; index++) {
            newArrayUsers[index][1].turn = index+1; 
        }
        //Se cambia el orden
        for (let index = 0; index < newArrayUsers.length; index++) {
   
            if (newArrayUsers[index][1].turn === 1) {
                newArrayUsers[index][1].turn = newArrayUsers.length;
            }else{
                newArrayUsers[index][1].turn =newArrayUsers[index][1].turn - 1;
            }
             
        }
        //Retorno como object
        obj = newArrayUsers.reduce((acc, record) => ({
            ...acc,
            [record[0]]: record[1],
        }), {});
            
    }

    Object.keys(obj).forEach(function(key){
        gamePlaying[roomID].users[obj[key].socketID].turn = obj[key].turn;
    });

    return obj;
}

function createRound(users, roomID, isNewRound){
    //Armo la primera ronda

    let round = {};
    let newUsers = JSON.parse(JSON.stringify(users));
    Object.keys(newUsers).forEach(function(key) {
        newUsers[key].bet = 50;
        newUsers[key].left = false;
        newUsers[key].answer = "";
        newUsers[key].won = false;
      });

    round.round_number = (isNewRound) ? 1 :  gamePlaying[roomID].rounds.length + 1;
    round.category = categories[Math.floor(Math.random()*categories.length)];
    round.users = (isNewRound) ?  newUsers :  changeTurns(newUsers, roomID);
    round.questionID = "";
    round.res_ok = "";
    round.state = "betting";
    round.nextTurn = 1
    round.userWon ="";
    round.isOne2One = false;
    round.prize = 0;
    round.jackpot = (isNewRound) ?  0 :  gamePlaying[roomID].jackpot;
    round.betCount = 0;
    round.answersCount = 0;
    round.usersInRound = (isNewRound) ? 4 :  Object.keys(newUsers).length;
    gamePlaying[roomID].rounds.push(round);
    return round;
}

function createOne2One(users, roomID){
    let one2one = {};
    let newUsers = JSON.parse(JSON.stringify(users));
    Object.keys(newUsers).forEach(function(key) {
        newUsers[key].answer = "";
        newUsers[key].won = false;
        newUsers[key].countCorrect = 0;
    });
    one2one.currentRound = 0;
    one2one.ready = 0;
    one2one.jackpot = gamePlaying[roomID].jackpot;
    one2one.rounds = [];
    for (let index = 0; index < categories.length; index++) {
        let round = {}
        round.category = categories[index];
        round.question = {};
        round.won = "";
        round.answeredCount = 0;
        round.users = newUsers;
        one2one.rounds.push(round);
    }
    gamePlaying[roomID].one2one = one2one;
}

/**
 * @param {{roomID: string, userID: string}} data
 */
function ready(data){
    gamePlaying[data.roomID].one2one.ready += 1;
    if(gamePlaying[data.roomID].one2one.ready == 2){
        return startOne2One = true;
    }else{
        return startOne2One = false;
    }
}

function one2oneQuestion(roomID, indexRound){

    Question.getQuestion(gamePlaying[roomID].one2one.rounds[indexRound].category, 1, function(result){
        if(result){
            let quest = result;
            let question = {};
            question.id = quest._id;
            question.question = quest.question;
            question.answers = [];
            question.answers.push(quest.option_1);
            question.answers.push(quest.option_2);
            question.answers.push(quest.option_3);
            question.answerCorrect = quest.answer_ok;
            gamePlaying[roomID].one2one.rounds[indexRound].question = question;
            callback(question)
        }else{
            console.log("error question");
        }  
    })
    
}

function one2oneAnswer(answer, roomID){

    let response = {};
    gamePlaying[roomID].one2one.rounds[gamePlaying[roomID].one2one.currentRound].answeredCount += 1;
    gamePlaying[roomID].one2one.rounds[gamePlaying[roomID].one2one.currentRound].users[answer.socketID].answer = answer.answer;
    if(answer.answer == gamePlaying[roomID].one2one.rounds[gamePlaying[roomID].one2one.currentRound].question.answerCorrect){
        gamePlaying[roomID].one2one.rounds[gamePlaying[roomID].one2one.currentRound].users[answer.socketID].won = true;
        gamePlaying[roomID].one2one.rounds[gamePlaying[roomID].one2one.currentRound].users[answer.socketID].countCorrect += 1;
    }
    //Respondieron los 2 usuarios
    if(gamePlaying[roomID].one2one.rounds[gamePlaying[roomID].one2one.currentRound].answeredCount == 2){
        gamePlaying[roomID].one2one.currentRound += 1;
        if(gamePlaying[roomID].one2one.currentRound > 3){
            //Verificar si gano alguno
            switch (gamePlaying[roomID].one2one.currentRound) {
                case 3:
                    let userList = gamePlaying[roomID].one2one.rounds[gamePlaying[roomID].one2one.currentRound].users;
                    Object.keys(userList).forEach(function(key) {
                        if (userList[key].countCorrect == 0 || userList[key].countCorrect == 3) {
                            
                        }
                    });
                    break;
                case 4:
        
                    break;
                case 5:
                
                    break;
            }
            
        }
        return gamePlaying[roomID].one2one.currentRound;
    }else{
        return false;
    }

}


module.exports = {
    newGame,
    getGame,
    newBet,
    startGame,
    getQuestion,
    ready,
    one2oneQuestion,
    one2oneAnswer,
    newAnswer,
    delUserGame
}