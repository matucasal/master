const logger = require('../../configuration/logger')(__filename);
const User = require('../users');
const JWT = require('jsonwebtoken');
const { JWT_SECRET } = require('../../configuration');

const roomManager = require('./room-manager');
const gameManager = require('./game-manager');
const usersManager = require('./users-manager');

var redisClient;

var io;
//logger.emerg("Emergency");
//logger.alert("Alert");
//logger.crit("Critial");
//logger.error("Error");
//logger.warning("Warning");
//logger.notice("Notice");
//logger.info("Info"); 
//logger.debug("debug");

exports = module.exports = function (ios) {
    io = ios;
    io.on('connection', function (socket) {
        socket.auth = false;
        logger.info("New connection from" + socket.handshake.address);
        socket.on('authenticate', authenticate);
        socket.on('searchGame', searchGame);
        socket.on('join', userJoined);
        socket.on('userBet', userBet);
        socket.on('userAnswer', userAnswer);
        //Workflow del duelo
        socket.on('duelAccept',userAcceptDuel);
        socket.on('duelAnswer',userAnswerDuel);

        socket.on('disconnecting', userDisconnecting);
        socket.on('disconnect', userDisconnect);
        /*setTimeout(function(){
            //If the socket didn't authenticate, disconnect it
            if (!socket.auth) {
              logger.notice("Disconnecting socket by timeout auth ", socket.id);
              socket.disconnect('unauthorized');
            }
        }, 20000);*/
    })

}

authenticate = function (data) {
    var socket = this;
    socket.auth = true;
    JWT.verify(data.token, JWT_SECRET, function (err, success) {
        if (err) {
            socket.emit("authenticated", false);
        } else {
            socket.auth = true;
            socket.emit("authenticated", true);
        }
    })

}

/**
 * @param {level: string} level 
 */
searchGame = function (level) {
    var socket = this;
    if (socket.auth) {
        var rooms = roomManager.searchRooms(level);
        socket.emit("Welcome", JSON.stringify(rooms));
    } else {
        socket.emit("authenticated", false);
    }

}
/**
 * @param {}
 */
userJoined = function (data) {
    var socket = this;
    if (socket.auth) {
        socket.join(data.roomId);
        var room = roomManager.addUserRoom(data.roomId, data.user, socket.id);
        io.sockets.in(data.roomId).emit('playerJoinned', JSON.stringify(room));

        if (socket.adapter.rooms[data.roomId].length === 4) {
            logger.info("Room: " + data.roomId + " Users: " + socket.adapter.rooms[data.roomId].length);
            let round = gameManager.startGame(data.roomId);
            io.sockets.in(data.roomId).emit('newRound', JSON.stringify(round));
            logger.info("Start game id: " + data.roomId ); 
        } else {
            logger.info("Room: " + data.roomId + " Users: " + socket.adapter.rooms[data.roomId].length)
        }
    } else {

    }

}



/**
 * @param {{value: number , roomID: string, userID: string, left: boolean, pairing: boolean}} data
 */
async function userBet(data) {
    let socket = this;
    if (socket.auth) {
        let bet = { "bet": data.value, "userID": data.userID, "left": data.left, "roomID": data.roomID, "socket": socket.id, "pairing": data.pairing };
        let response = await gameManager.newBet(bet);

        socket.to(data.roomID).emit('newBet', JSON.stringify(bet));
        //io.sockets.in(data.roomID).emit('newBet', JSON.stringify(bet));

        if (response.userLeftRound) {
            socket.to(data.roomID).emit('userLeftRound', response.userLeftRound);
        }

        if (response.finished) {
            socket.to(data.roomID).emit('newBet', JSON.stringify(bet));
            //io.sockets.in(data.roomID).emit('newBet', JSON.stringify(bet));
            gameManager.getQuestion(data.roomID, function (result) {
                logger.info("Room: " + data.roomID + " Se envía pregunta")
                io.sockets.in(data.roomID).emit('question', JSON.stringify(result));
            })
        } else {
            if (response.nextUser) {
                logger.info("usuario para pairing: " + JSON.stringify(response.nextUser));
                io.sockets.in(data.roomID).emit('pairingBet', JSON.stringify(response.nextUser));
            }
        }
    } else {
        socket.emit("authenticated", false);
    }

};

/**
 * @param {{answer: String , roomID: string, timeResponse: Number, userID: string}} data
 */
async function userAnswer(data) {
    var socket = this;
    if (socket.auth) {
        //Enviar a todos los que estan en la room que alguien ya respondió
        io.sockets.in(data.roomID).emit('userDone', JSON.stringify({ 'userID': data.userID, 'answer': data.answer, 'timeResponse': data.timeResponse }));
        let answerSelected = { "socketID": socket.id, "userID": data.userID, "answer": data.answer, "timeResponse": data.timeResponse };
        let result = await gameManager.newAnswer(answerSelected, data.roomID);


        //Faltan responder users?
        if (result != false) {
            if (result.isWinner) {
                if (result.usersGameOver.length > 0) {
                    io.sockets.in(data.roomID).emit('gameOver', result.usersGameOver);
                    removeUserInRoom(result.usersGameOver, data.roomID);
                }
                if (result.isOne2One) {
                    io.sockets.in(data.roomID).emit('duelNotice', data.roomID);
                    return;
                }
                if (result.gameFinished) {
                    logger.info("Room: " + data.roomID + " Partida finalizada")
                    logger.info("Room: " + data.roomID + " Ganador: " + result.winner.userID)
                    io.sockets.in(data.roomID).emit('roomClosed', "");
                    io.sockets.in(data.roomID).emit('userGameWon', result.winner.userID);
                } else {
                    io.sockets.in(data.roomID).emit('userWon', result.winner.userID);
                    io.sockets.in(data.roomID).emit('newRound', JSON.stringify(result.round));
                }
            } else {
                if (result.isOne2One) {
                    io.sockets.in(data.roomID).emit('duelNotice', data.roomID);
                    return;
                }else{
                    if (result.usersGameOver.length > 0) {
                        io.sockets.in(data.roomID).emit('gameOver', result.usersGameOver);
                        removeUserInRoom(result.usersGameOver, data.roomID);
                    }
                    if (result.gameFinished) {
                        logger.info("Room: " + data.roomID + " Partida finalizada")
                        logger.info("Room: " + data.roomID + " Ganador: " + result.winner.userID)
                        io.sockets.in(data.roomID).emit('roomClosed', "");
                        io.sockets.in(data.roomID).emit('userGameWon', result.winner.userID);
                    } else {
                        io.sockets.in(data.roomID).emit('userWon', "");
                        io.sockets.in(data.roomID).emit('newRound', JSON.stringify(result.round));
                    }
                    
                }
                
            }
        }
    } else {
        socket.emit("authenticated", false);
    }

}

/**
 * @param {{roomID: string, userID: string}} data
 */
async function userAcceptDuel(data) {
    console.log("Duelo aceptado");
    var socket = this;
    if (socket.auth) {
        let result = await gameManager.ready(data.roomID, data.userID);
        if (result) {
            let question = await gameManager.one2oneQuestion(data.roomID, 1, function(result){
                io.sockets.in(data.roomID).emit('duelQuestion', JSON.stringify(result));
            });
        }
    } else {
        socket.emit("authenticated", false);
    }
}

/**
 * @param {{answer: String , roomID: string, timeResponse: Number, userID: string}} data
 */
async function userAnswerDuel(data) {
    var socket = this;
    if (socket.auth) {
        //Enviar a todos los que estan en la room que alguien ya respondió
        io.sockets.in(data.roomID).emit('userDone', JSON.stringify({ 'userID': data.userID, 'answer': data.answer, 'timeResponse': data.timeResponse }));
        let answerSelected = { "socketID": socket.id, "userID": data.userID, "answer": data.answer };
        let result = await gameManager.one2oneAnswer(answerSelected, data.roomID, data.userID);
        //Faltan responder users? -> todavia nada

        //El result me trae o vacio o la nueva ronda 
        if (result != false) {
            
            //Termino el juego
            if (result.gameFinished) {

                io.sockets.in(data.roomID).emit('duelResult', JSON.stringify({ 'userWonID': result.winner, 'roomID': data.roomID }) )
            }
            //No termina el juego -> tengo que mandar mas preguntas y mandar quien gano la ronda 
            else {
                console.log("llego el resultado")
                console.log(result)
                if (result.resultadoRonda){
                    console.log("emito el resultado")
                    io.sockets.in(data.roomID).emit('duelQuestionWon', JSON.stringify(result.resultadoRonda) )
                }
                //result tendria que ser el current round
                let question = await gameManager.one2oneQuestion(data.roomID, result.currentRound, function(result){
                    io.sockets.in(data.roomID).emit('duelQuestion', JSON.stringify(result));
                });
            }
        }
    } else {
        socket.emit("authenticated", false);
    }
    
}

userDisconnecting = async function () {
    var socket = this;
    try {
        //Quito al player del socket.room
        var roomID = Object.getOwnPropertyNames(socket.rooms)[1];
        if (roomID != undefined) {
            io.sockets.sockets[socket.id].leave(roomID);
            let room = roomManager.delUserRoom(roomID, socket.id);
            if (room == false) {
                logger.notice("Player en juego..");
                let result = await gameManager.delUserGame(roomID, socket.id);
                if (result.bet) {
                    let bet = { "bet": result.bet.value, "userID": result.userID, "left": true, "roomID": roomID, "socket": socket.id, "pairing": false };
                    socket.to(roomID).emit('newBet', JSON.stringify(bet));
                }
                if (result.answering) {
                    io.sockets.in(data.roomID).emit('userDone', JSON.stringify({ 'userID': result.userID, 'answer': "", 'timeResponse': 8000 }));
                }
                socket.to(roomID).emit('userLeft', result.userID);
            }
        }

    } catch (error) {
        logger.notice(error);
        logger.error(error);
    }
}

userDisconnect = function () {
    var socket = this;
    try {
        logger.info("New disconnection from" + socket.handshake.address);
    } catch (error) {
        logger.notice("Error");
        logger.error(error);
    }
}

removeUserInRoom = function (users, roomID) {
    users.forEach(element => {
        io.sockets.sockets[element.socketID].leave(roomID);
    });
}

