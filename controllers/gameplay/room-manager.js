const uniqid = require('uniqid');
const Game = require('../games');
const game_manager = require('./game-manager');
const redisController = require('../redisController')
const logger = require('../../configuration/logger')(__filename);

var gameRooms = [];
//Se crean las primeras rooms
newRoom('Neofito');
newRoom('Virtuoso');
newRoom('Serafin');

function newRoom(level) {
    let room = { 'id': uniqid(), 'books': 1000, 'level': level, 'max': 4, 'inside': 0, 'users': [], 'jackpot': 0, 'won': {} }
    gameRooms.push(room);
    logger.notice("New room available: " + room.id);
    redisController.saveRoom(room);
    try {
        redisController.saveRoom(room);
    } catch (error) {
        console.log(error);
    }
    
}

function deleteRoom(roomID) {
    console.log(roomID);
    let index = gameRooms.findIndex(x => x.id === roomID);
    gameRooms.splice(index, 1);
    logger.notice("New room deleted: " + roomID);
}

function addUserRoom(roomID, user, socketID) {
    user.socketID = socketID;
    let index = gameRooms.findIndex(x => x.id === roomID);
    user.books = gameRooms[index].books;
    if (gameRooms[index].inside == 0) {
        user.turn = 1;
        gameRooms[index].users.push(user);
    } else {
        user.turn = gameRooms[index].users.length + 1;
        gameRooms[index].users.push(user);
    }
    gameRooms[index].inside = gameRooms[index].inside + 1;

    if (gameRooms[index].inside == 4) {
        Game.saveGame(roomID, gameRooms[index].users);
        let room = Object.assign({}, gameRooms[index]);
        game_manager.newGame(room);
        this.newRoom(gameRooms[index].level);
        this.deleteRoom(roomID)
        return room;
    } else {
        return gameRooms[index];
    }

}

function delUserRoom(roomID, socket) {
    let index = gameRooms.findIndex(x => x.id === roomID);
    if (index != -1) {
        let indexUser = 0;
        for (let i = 0; i < gameRooms[index].users.length; i++) {
            if (gameRooms[index].users[i].socketID == socket) {
                indexUser = i
                break;
            }
        }
        for (let indexTurn = indexUser + 1; indexTurn < gameRooms[index].users.length; indexTurn++) {
            gameRooms[index].users[indexTurn].turn = gameRooms[index].users[indexTurn].turn - 1;
        }
        gameRooms[index].users.splice(indexUser, 1);
        gameRooms[index].inside = gameRooms[index].users.length;
        return gameRooms[index].id;
    }
    return false;
}

function searchRooms(level) {

    var roomsResult = [];
    for (let index = 0; index < gameRooms.length; index++) {
        const room = gameRooms[index];
        if (room.level == level) {
            roomsResult.push(room);
        }
    }
    return roomsResult;
}

function searchRoomByID(roomID) {
    return gameRooms.find(x => x.id == roomID);
}

module.exports = {
    searchRooms,
    newRoom,
    deleteRoom,
    addUserRoom,
    delUserRoom,
    searchRoomByID
}

