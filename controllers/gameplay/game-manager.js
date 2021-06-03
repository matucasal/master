const Category = require('../../models/category');
const Question = require('../../controllers/questions');
const logger = require('../../configuration/logger')(__filename);
const User = require('../users');
const Game = require('../games');
const redisController = require('../redisController')

var gamePlaying = {};
var categories = [];

Category.find({}, {
    "_id": 0,
    "categoryName": 1
}, function (error, res) {
    categories = res.map(a => a.categoryName);
})


function newGame(game) {
    gamePlaying[game.id] = game;
    redisController.saveGame(game);
}

function getGame(id) {
    return gamePlaying[id];
}

function delUserGame(gameID, socketID) {

    let userID = gamePlaying[gameID].users[socketID].userID;
    if (gamePlaying[gameID].rounds[gamePlaying[gameID].rounds.length - 1].state == "betting" && gamePlaying[gameID].rounds[gamePlaying[gameID].rounds.length - 1].users[socketID].turn != gamePlaying[gameID].rounds[gamePlaying[gameID].rounds.length - 1].nextTurn) {
        gamePlaying[gameID].rounds[gamePlaying[gameID].rounds.length - 1].usersInRound -= +1;
        delete gamePlaying[gameID].users[socketID];
        delete gamePlaying[gameID].rounds[gamePlaying[gameID].rounds.length - 1].users[socketID];
        logger.notice("Betting No turn---> user deleted from room: " + gameID);
        let result = {}
        result.userID = userID;
        return result;
    }
    if (gamePlaying[gameID].rounds[gamePlaying[gameID].rounds.length - 1].state == "betting" && gamePlaying[gameID].rounds[gamePlaying[gameID].rounds.length - 1].users[socketID].turn == gamePlaying[gameID].rounds[gamePlaying[gameID].rounds.length - 1].nextTurn) {
        let result =  newBet({ 'value': 50, 'roomID': gameID, 'userID': userID, 'left': true, 'socket': socketID, 'pairing': false });
        delete gamePlaying[gameID].users[socketID];
        logger.notice("Betting MyTurn---> user deleted from room: " + gameID);
        result.userID = userID
        result.bet = {"value": 50 , "roomID": gameID, "userID": userID, "left": true, "pairing": false}
        delete gamePlaying[gameID].rounds[gamePlaying[gameID].rounds.length -1].users[socketID];
        return result;
    }
    if (gamePlaying[gameID].rounds[gamePlaying[gameID].rounds.length - 1].state == "pairing") {
        let result = newBet({ 'value': 50, 'roomID': gameID, 'userID': userID, 'left': true, 'socket': socketID, 'pairing': true });
        delete gamePlaying[gameID].users[socketID];
        logger.notice("user deleted from room: " + gameID);
        result.userID = userID
        result.bet = {"value": 50 , "roomID": gameID, "userID": userID, "left": true, "pairing": true}
        return result;
    }
    if (gamePlaying[gameID].rounds[gamePlaying[gameID].rounds.length - 1].state == "answering") {
        newAnswer({ "socketID": socketID, "userID": userID, "answer": "", "timeResponse": 8000 });
        delete gamePlaying[gameID].users[socketID];
        delete gamePlaying[gameID].rounds[gamePlaying[gameID].rounds.length - 1].users[socketID];
        logger.notice("user deleted from room: " + gameID);
        let result = {}
        result.userID
        result.answering = true
        return result;
    }

}

function startGame(roomID) {
    //Elijo categoría
    gamePlaying[roomID].rounds = [];
    let users = gamePlaying[roomID].users;
    updatebooks(users);
    users = Object.assign({}, ...users.map(user => ({ [user.socketID]: user })));
    gamePlaying[roomID].users = [];
    gamePlaying[roomID].users = users;
    return createRound(users, roomID, true);
}

function updatebooks(users) {
    users.forEach(usr => {
        User.updateBooks(usr);
    });
}


function getQuestion(roomID, callback) {
    Question.getQuestion(gamePlaying[roomID].rounds[gamePlaying[roomID].rounds.length - 1].category, 1, function (result) {
        if (result) {
            let quest = result;
            let question = {};
            question.id = quest._id;
            question.question = quest.question;
            question.answers = [];
            question.answers.push(quest.option_1);
            question.answers.push(quest.option_2);
            question.answers.push(quest.option_3);
            question.answerCorrect = quest.answer_ok;
            gamePlaying[roomID].rounds[gamePlaying[roomID].rounds.length - 1].questionID = quest.id;
            gamePlaying[roomID].rounds[gamePlaying[roomID].rounds.length - 1].answer_ok = quest.answer_ok;
            callback(question)
        } else {
            logger.notice("error question");
        }
    })

}

/**
 * @param {{value: number , roomID: string, userID: string, left: boolean, socket: string, pairing: boolean}} data
 */
function newBet(data) {
    let response = {};
    response.finished = false
    response.userLeftRound = false

    if (data.left == true) {
        gamePlaying[data.roomID].rounds[gamePlaying[data.roomID].rounds.length - 1].prize += parseInt(data.bet);
        gamePlaying[data.roomID].rounds[gamePlaying[data.roomID].rounds.length - 1].betCount += +1;
        gamePlaying[data.roomID].rounds[gamePlaying[data.roomID].rounds.length - 1].nextTurn += +1;
        gamePlaying[data.roomID].users[data.socket].books -= parseInt(data.bet);
        delete gamePlaying[data.roomID].rounds[gamePlaying[data.roomID].rounds.length - 1].users[data.socket];
        //gamePlaying[data.roomID].rounds[gamePlaying[data.roomID].rounds.length - 1].usersInRound -= +1;
        response.userLeftRound = data.userID;
    } else {
        gamePlaying[data.roomID].rounds[gamePlaying[data.roomID].rounds.length - 1].betCount += 1;
        gamePlaying[data.roomID].rounds[gamePlaying[data.roomID].rounds.length - 1].nextTurn += 1;
        gamePlaying[data.roomID].rounds[gamePlaying[data.roomID].rounds.length - 1].users[data.socket].bet = parseInt(data.bet);
        gamePlaying[data.roomID].rounds[gamePlaying[data.roomID].rounds.length - 1].prize += parseInt(data.bet);
    }

    if (data.pairing) {
        let pairing = checkPairing(gamePlaying[data.roomID].rounds[gamePlaying[data.roomID].rounds.length - 1].users);

        if (!pairing) {
            response.finished = true;
            return response;
        } else {
            response.nextUser = pairing;
            return response;
        }
    }

    if (gamePlaying[data.roomID].rounds[gamePlaying[data.roomID].rounds.length - 1].betCount == gamePlaying[data.roomID].rounds[gamePlaying[data.roomID].rounds.length - 1].usersInRound) {

        let pairing = checkPairing(gamePlaying[data.roomID].rounds[gamePlaying[data.roomID].rounds.length - 1].users);
        if (!pairing) {
            response.finished = true;
            return response;
        } else {
            response.nextUser = pairing;
            return response;
        }
    }
    return response;
}

function newAnswer(answer, roomID) {
    logger.info("Respuesta recibida " + answer.userID);
    gamePlaying[roomID].rounds[gamePlaying[roomID].rounds.length - 1].state = "Answering";
    let response = {};
    gamePlaying[roomID].rounds[gamePlaying[roomID].rounds.length - 1].users[answer.socketID].answer = answer.answer;
    gamePlaying[roomID].rounds[gamePlaying[roomID].rounds.length - 1].users[answer.socketID].timeResponse = answer.timeResponse;
    gamePlaying[roomID].rounds[gamePlaying[roomID].rounds.length - 1].answersCount++;

    //Verifico si todos respondieron
    if (gamePlaying[roomID].rounds[gamePlaying[roomID].rounds.length - 1].answersCount == Object.keys(gamePlaying[roomID].rounds[gamePlaying[roomID].rounds.length - 1].users).length) {
        //Opcion correcta
        logger.notice("Respondieron todos")
        let res_ok = gamePlaying[roomID].rounds[gamePlaying[roomID].rounds.length - 1].answer_ok;
        let winner;
        //verificar quien ganó, emitir respuesta y recalcular libros para cada user.
        let userList = gamePlaying[roomID].rounds[gamePlaying[roomID].rounds.length - 1].users;

        Object.keys(userList).forEach(function (key) {
            if (userList[key].answer == res_ok) {
                if (winner === undefined) {
                    winner = userList[key];
                } else {
                    if (userList[key].timeResponse < winner.timeResponse) {
                        winner = userList[key];
                    }
                }
            }
        });


        //Si no hay ganador, entra al IF
        if (winner === undefined) {
            let jackpot = 0;
            response.usersGameOver = [];
            logger.notice("----No hubo ningún ganador en esta ronda----");

            Object.keys(userList).forEach(function (key) {
                //le resto los libros dentro de la ronda
                gamePlaying[roomID].rounds[gamePlaying[roomID].rounds.length - 1].users[userList[key].socketID].books -= parseInt(userList[userList[key].socketID].bet);
                //le resto los libros al jugador
                gamePlaying[roomID].users[userList[key].socketID].books -= parseInt(userList[userList[key].socketID].bet);
                //sumo todos los libros al jackpot
                jackpot += parseInt(userList[userList[key].socketID].bet);
                //Si uno se queda con 0 o menos -> arafue
                if (gamePlaying[roomID].users[userList[key].socketID].books <= 0) {
                    //Game over para el player
                    console.log("Game over para user: " +  gamePlaying[roomID].users[userList[key].socketID].userID + " - Name: " + gamePlaying[roomID].users[userList[key].socketID].name);
                    response.usersGameOver.push(gamePlaying[roomID].users[userList[key].socketID]);
                    delete gamePlaying[roomID].users[userList[key].socketID];
                    User.updateGameLoose(userList[userList[key].socketID].userID, gamePlaying[roomID].books);
                }

            });
            //Mando el jackpot al room 
            gamePlaying[roomID].jackpot += jackpot;
            //Verificar si gano algun user
            if (Object.keys(gamePlaying[roomID].users).length == 1) {
                Object.keys(gamePlaying[roomID].users).forEach(element => {
                    winner = Object.keys(gamePlaying[roomID].users[element])
                });
            }

        }else{
            gamePlaying[roomID].rounds[gamePlaying[roomID].rounds.length - 1].users[winner.socketID].won = true;
            gamePlaying[roomID].rounds[gamePlaying[roomID].rounds.length - 1].userWon = winner.userID;
            gamePlaying[roomID].rounds[gamePlaying[roomID].rounds.length - 1].users[winner.socketID].books += parseInt(gamePlaying[roomID].rounds[gamePlaying[roomID].rounds.length - 1].prize) - parseInt(userList[winner.socketID].bet);
            gamePlaying[roomID].users[winner.socketID].books += parseInt(gamePlaying[roomID].rounds[gamePlaying[roomID].rounds.length - 1].prize) - parseInt(userList[winner.socketID].bet);

            logger.notice("----Hay ganador-----");
            logger.notice(JSON.stringify("UserID: " + winner.userID + " Name: " + winner.name));

            let usersLost = Object.keys(userList).filter(function (key) { return userList[key].won != true });

            //Se envia el resultado

            response.isWinner = true;
            response.winner = winner;
            response.usersLost = usersLost;
            response.usersGameOver = [];

            //Se le restan los libros a los que perdieron
            usersLost.forEach(element => {
                gamePlaying[roomID].rounds[gamePlaying[roomID].rounds.length - 1].users[element].books -= parseInt(userList[element].bet);
                gamePlaying[roomID].users[element].books -= parseInt(userList[element].bet);
                if (gamePlaying[roomID].users[element].books <= 0) {
                    //Game over para el player
                    console.log("Game over para user: " + gamePlaying[roomID].users[element].userID );
                    response.usersGameOver.push(gamePlaying[roomID].users[element]);
                    delete gamePlaying[roomID].users[element];
                    User.updateGameLoose(userList[element].userID, gamePlaying[roomID].books);
                }
            });

        }
        
        
        switch (Object.keys(gamePlaying[roomID].users).length) {
            case 1:
                //End game
                logger.info("Game terminated. RoomID: " + roomID);
                //gamePlaying[roomID].won = gamePlaying[roomID].users[Object.keys(gamePlaying[roomID].users)[0]].userID
                Game.gameUpdate(roomID, winner, gamePlaying[roomID].rounds);
                User.updateGameWin(gamePlaying[roomID].users[Object.keys(gamePlaying[roomID].users)[0]]);
                delete gamePlaying[roomID];
                response.winner = winner;
                response.gameFinished = true;
                return response;
                break;
            case 2:
                logger.notice("Quedan 2 jugadores, se lanza el one2one");
                //let newRound2 = createRound(gamePlaying[roomID].users, roomID, false);
                //newRound2.isOne2One = true;
                //response.round = newRound2;
                createOne2One(gamePlaying[roomID].users, roomID);
                response.isOne2One = true;
                return response;
                break;
            case 3:
                logger.notice("Quedan más jugadores, se sigue jugando...");
                let newRound = createRound(gamePlaying[roomID].users, roomID, false);
                response.round = newRound;
                return response;
                break;
            case 4:
                logger.notice("Quedan más jugadores, se sigue jugando...");
                let newRound4 = createRound(gamePlaying[roomID].users, roomID, false);
                response.round = newRound4;
                return response;
                break;
        }

    } else {
        //Faltan que algunos usuarios respondan
        return false;
    }

}

function checkPairing(userList) {

    let maxbet = 0;
    let nextUser = [];

    Object.keys(userList).forEach(function (key) {
        if (userList[key].bet > maxbet) {
            maxbet = userList[key].bet;
        }
    });

    Object.keys(userList).forEach(function (key) {
        if (userList[key].bet < maxbet) {
            nextUser.push(userList[key]);

        }
    });

    //logger.notice(JSON.stringify(nextUser));

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

    //logger.notice(JSON.stringify(nextUser));

    if (nextUser.length != 0) {
        return nextUser[0];
    } else {
        return "";
    }

}

/**
 * Function to re-order the turns 
 * @param obj objeto con los users de la room
 *  */
function changeTurns(obj, roomID) {

    //Reacomodamiento de turnos si quedan 4 players
    if (Object.keys(obj).length === 4) {

        Object.keys(obj).forEach(key => {
            let value = obj[key];
            (value.turn === 1) ? value.turn = 4 : value.turn = value.turn - 1;
        });

    } else {
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
            newArrayUsers[index][1].turn = index + 1;
        }
        //Se cambia el orden
        for (let index = 0; index < newArrayUsers.length; index++) {

            if (newArrayUsers[index][1].turn === 1) {
                newArrayUsers[index][1].turn = newArrayUsers.length;
            } else {
                newArrayUsers[index][1].turn = newArrayUsers[index][1].turn - 1;
            }

        }
        //Retorno como object
        obj = newArrayUsers.reduce((acc, record) => ({
            ...acc,
            [record[0]]: record[1],
        }), {});

    }

    Object.keys(obj).forEach(function (key) {
        gamePlaying[roomID].users[obj[key].socketID].turn = obj[key].turn;
    });

    return obj;
}

function createRound(users, roomID, isNewRound) {
    //Armo la primera ronda

    let round = {};
    let newUsers = JSON.parse(JSON.stringify(users));
    Object.keys(newUsers).forEach(function (key) {
        newUsers[key].bet = 50;
        newUsers[key].left = false;
        newUsers[key].answer = "";
        newUsers[key].won = false;
    });

    round.round_number = (isNewRound) ? 1 : gamePlaying[roomID].rounds.length + 1;
    round.category = categories[Math.floor(Math.random() * categories.length)];
    round.users = (isNewRound) ? newUsers : changeTurns(newUsers, roomID);
    round.questionID = "";
    round.res_ok = "";
    round.state = "betting";
    round.nextTurn = 1
    round.userWon = "";
    round.isOne2One = false;
    round.prize = 0;
    round.jackpot = (isNewRound) ? 0 : gamePlaying[roomID].jackpot;
    round.betCount = 0;
    round.answersCount = 0;
    round.usersInRound = (isNewRound) ? 4 : Object.keys(newUsers).length;
    gamePlaying[roomID].rounds.push(round);
    return round;
}

//El createone2one arranca cuando en el useranswer quedan solo 2 pjs
function createOne2One(users, roomID) {
    let one2one = {};
    let results = []
    let newUsers = JSON.parse(JSON.stringify(users));
    
    Object.keys(newUsers).forEach(function (key) {
        newUsers[key].answer = "";
        newUsers[key].won = false;
        newUsers[key].countCorrect = 0;

        //creo el results del one2one vacio por cada usuario
        results[newUsers[key].userID] = {}
        results[newUsers[key].userID].total = 0
    });

    one2one.currentRound = 1;
    //ready -> cuenta cuantos usuarios estan para el one2one

    one2one.results = results;
    one2one.ready = 0;
    one2one.jackpot = gamePlaying[roomID].jackpot;
    one2one.rounds = [];
    //itera todas las categorias y va creando una ronda vacia para cada una 
    for (let index = 0; index < categories.length; index++) {
        let round = {}
        round.category = categories[index];
        round.question = {};
        round.won;
        round.results = [];
        round.answeredCount = 0;
        round.users = newUsers;
        one2one.rounds.push(round);
    }
    gamePlaying[roomID].one2one = one2one;
}

/**
 * @param {{roomID: string, userID: string}} data
 */
function ready(roomID, userID) {

    gamePlaying[roomID].one2one.ready += 1;
    if (gamePlaying[roomID].one2one.ready == 2) {
        logger.notice("Aceptaron ambos players, que empiecen las preguntas")
        return startOne2One = true;
    } else {
        return startOne2One = false;
    }
}

function one2oneQuestion(roomID, indexRound, callback) {

    Question.getQuestion(gamePlaying[roomID].one2one.rounds[gamePlaying[roomID].one2one.currentRound].category, 1, function (result) {
        if (result) {
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
        } else {
            logger.notice("error question");
        }
    })

}

function one2oneAnswer(answer, roomID, userID) {

    let response = {};

    //Cuando llega una respuesta la agrego al contador
    //logger.notice('current round: ', gamePlaying[roomID].one2one.rounds[gamePlaying[roomID].one2one.currentRound])
    
    gamePlaying[roomID].one2one.rounds[gamePlaying[roomID].one2one.currentRound].answeredCount += 1;
    //Tomo la respuesta del user
    gamePlaying[roomID].one2one.rounds[gamePlaying[roomID].one2one.currentRound].users[answer.socketID].answer = answer.answer;

    
    //gamePlaying[roomID].one2one.rounds[indexRound].question

    //En este objeto guardo el resultado de la ronda
    
    //Reviso si esta correcta la respuesta
    if (answer.answer == gamePlaying[roomID].one2one.rounds[gamePlaying[roomID].one2one.currentRound].question.answerCorrect) {
        logger.notice("Respondio correctamente: " + userID)
        gamePlaying[roomID].one2one.rounds[gamePlaying[roomID].one2one.currentRound].users[answer.socketID].won = true;
        gamePlaying[roomID].one2one.rounds[gamePlaying[roomID].one2one.currentRound].users[answer.socketID].countCorrect += 1;
        //Aca mando socket de que respondio bien?
        
        logger.notice("Total del que gano antes del + 1 " + gamePlaying[roomID].one2one.results[userID].total)
        //guardo en el results del userID que sumo una respuesta correcta
        gamePlaying[roomID].one2one.results[userID].total =  gamePlaying[roomID].one2one.results[userID].total + 1

        //Agrego el resultado de la ronda
        gamePlaying[roomID].one2one.rounds[gamePlaying[roomID].one2one.currentRound].results.push({'userId':userID, 'result': true })
    }
    //La respuesta es incorrecta
    else {
        gamePlaying[roomID].one2one.rounds[gamePlaying[roomID].one2one.currentRound].results.push({'userId':userID, 'result': false })
    }

    logger.notice('Estado actual del one2one despues de poner respuesta correcta')
    logger.notice(gamePlaying[roomID].one2one.currentRound)
    logger.notice(gamePlaying[roomID].one2one.currentRound.results)
    
    
    //Respondieron los 2 usuarios
    if (gamePlaying[roomID].one2one.rounds[gamePlaying[roomID].one2one.currentRound].answeredCount == 2) {
        console.log("Duelo Round N°: "+ gamePlaying[roomID].one2one.currentRound);
        console.log("Respondieron los 2 usuarios");


       //Agrego el resultado de la ronda
       console.log("resultado de la ronda")
       console.log(gamePlaying[roomID].one2one.rounds[gamePlaying[roomID].one2one.currentRound].results)
       response.resultadoRonda = gamePlaying[roomID].one2one.rounds[gamePlaying[roomID].one2one.currentRound].results;


        //Si ya hay mas de 3 rondas -> reviso si ya gano alguno
        if (gamePlaying[roomID].one2one.currentRound >= 3) {
            //Tengo que resolver si hay ganador o no
            let winner;
            //Para eso voy a revisar las posiblidades
            //Si son 3 rondas -> 3 - 0
            //Si son 4 rondas -> 4 - < 3
            //Si son 5 rondas -> x > y o y > x
            //gamePlaying[roomID].one2one.results[userID].total
            
            //Obtengo los resultados
            let resultsList = gamePlaying[roomID].one2one.results
            
            //gamePlaying[roomID].one2one.results[userID].total
            //Si son 3 rondas -> 3 - 0
            
            //Llamo al metodo duelAlgorithm -> si hay ganador, lo devuelve sino false
            winner = duelAlgorithm (resultsList, gamePlaying[roomID].one2one.currentRound )
            

            if (winner){
                //Termina la partida
                logger.notice("Ganador: " + winner);
                logger.notice("Game terminated. ID: " + roomID);
                gamePlaying[roomID].won = winner
                Game.gameUpdate(roomID, gamePlaying[roomID].won, gamePlaying[roomID].rounds);
                User.updateGameWin(gamePlaying[roomID].users[Object.keys(gamePlaying[roomID].users)[0]]);
                delete gamePlaying[roomID];
                //mando como respuesta al socket que termino el juego y el ganador
                response.gameFinished = true;
                response.winner = winner;
                return response;
                //Si no hay ganador -> sumo una nuva ronda
            }
        }
        
        gamePlaying[roomID].one2one.currentRound += 1;
        //Le agrego uno al current round para mandarlo al socket
        response.currentRound = gamePlaying[roomID].one2one.currentRound
        
        return response;
    }

    return false;
        
}

function duelAlgorithm(resultsList, actualRound) {
    
    //Estas variables van a ser los flags para ir viendo como vienen los usuarios
    let totalGanador = 0;
    let totalPerdedor = 0;

    let userIDGanador;
    
    let totalRounds = 5
    let diferenciaRounds = 0;

    diferenciaRounds = totalRounds - actualRound;
    
    logger.notice("Ronda actual: " + totalRounds);
    logger.notice("Diferencia rounds: " + diferenciaRounds);

    
    Object.keys(resultsList).forEach(function (key) {
        //1) Reviso que sea mayor => este usuario puede ganar
        if (resultsList[key].total >= totalGanador){
            //1.1) Tomo el total ganador anterior y lo dejo como perdedor
            totalPerdedor = totalGanador
            
            //1.2) Tomo el total nuevo y lo pongo como ganador
            totalGanador = resultsList[key].total
            userIDGanador = key
            
        }
        //2) Reviso si es menor => este usuario puede perder
        else if (resultsList[key].total < totalGanador){
            totalPerdedor = resultsList[key].total
        }
    }) 

    logger.notice("Total ganador: " + totalGanador);
    logger.notice("Total perdedor: " + totalPerdedor);
    

    //3) Ahora reviso si la diferencia entre ganador y perdedor es > a la diferencia, si es asi, hay ganador
    let diferenciaGanadorPerdedor = totalGanador - totalPerdedor
    
    if (diferenciaGanadorPerdedor > diferenciaRounds){
        return userIDGanador
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