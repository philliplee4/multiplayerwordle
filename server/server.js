const fetch = require('node-fetch');
const wordList = require('./words.json');

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: "*"
    },

    pingTimeout: 5000,
    pingInterval: 2000

});

//get random word from json file
function getRandomWord(difficulty = 'medium') {
    const words = wordList[difficulty];
    return words[Math.floor(Math.random() * words.length)];
}

//stores active rooms
const rooms = {}; 

io.on('connection', (socket) => {
    console.log('A player connected:', socket.id);

    socket.on('createRoom', (data) => {
        const roomCode = Math.random().toString(36).substring(2, 8).toUpperCase();

        rooms[roomCode] = {
            players: [{ id: socket.id, name: data.playerName }],
            host: socket.id,
            scores: [0, 0],
            currentRound: 0,
            maxRounds: 5
        };

        socket.join(roomCode);
        console.log(`Room ${roomCode} created by ${data.playerName}`);

        socket.emit('roomCreated', { roomCode, playerName: data.playerName });
    });

    //handle join room
    socket.on('joinRoom', (data) => {
        const room = rooms[data.roomCode];

        if(!room){
            socket.emit('error', { message: 'Room not found'});
            return;
        }

        if(room.players.length >= 2){
            socket.emit('error', {message: 'Room is full'});
            return;
        }

        room.players.push({ id: socket.id, name: data.playerName});
        socket.join(data.roomCode);

        console.log(`${data.playerName} joined room ${data.roomCode}`);

        socket.emit('roomJoined', {
            roomCode: data.roomCode, 
            playerName: data.playerName, 
            player1Name: room.players[0].name
        });


        socket.to(data.roomCode).emit('playerJoined', { playerName: data.playerName});
    });


    //handle game start
    socket.on('startGame', () => {


        console.log('Received startGame Event');
        //find which room socket is in
        let roomCode = null;
        for( const code in rooms) {
            if(rooms[code].host === socket.id ){
                roomCode = code;
                break;
            }
        }

        if (roomCode) {

            const room = rooms[roomCode];

            if(room.players.length < 2){
                socket.emit('error', { message: 'Waiting for another person to join'})
                return;
            }


            room.targetWord = getRandomWord('medium');
            room.currentTurn = Math.floor(Math.random() * 2);
            room.currentRow = 0;
            room.turnTimer = null;       
            room.turnDuration = 30000;   

            startNewRound(roomCode);

            console.log(`Starting game in room ${roomCode} with word: ${room.targetWord}`);

            //send player names to multiplayer server
            io.to(roomCode).emit('gameStarted', {
                player1: room.players[0].name,
                player2: room.players[1].name,
                targetWord: room.targetWord,
                currentTurn: room.currentTurn
            });

            startTurnTimer(roomCode);
        } else {
            console.log('No room found');
        }


    });

    socket.on('submitGuess', async (data) => {

        //find which room player is in
        let roomCode = null;
        let playerIndex = -1;

        for(const code in rooms) {
            const room = rooms[code];
            playerIndex = room.players.findIndex(p => p.id === socket.id);
            if(playerIndex != -1){
                roomCode = code;
                break;
            }
        }

        if(!roomCode) {
            socket.emit('error', {message: 'Room not found'});
            return;
        }

        const room = rooms[roomCode];


        //check if player turn
        if(room.currentTurn != playerIndex){
            socket.emit('error', {message: "Not your turn!"});
            return;
        }


        //validate word exist(add word valdiation later for now accept 5 letter word)
        const guess = data.guess.toUpperCase();

        try{
            const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${guess.toLowerCase()}`);
            if(!response.ok){
                socket.emit('invalidWord', { message: 'Not a valid word'});
                return;
            }
        } catch(error) {
            console.error('Dictionary API error:', error);
            socket.emit('invalidWord', {message: 'Could not validate word'});
            return;
        }


        if(room.turnTimer) {
            clearTimeout(room.turnTimer);
            room.turnTimer = null;
        }

        //check if correct
        const targetWord = room.targetWord;
        const isCorrect = (guess === targetWord);
        const playerName = room.players[playerIndex].name;

        console.log(`${playerName} guessed: ${guess} in room ${roomCode}`);
        
        //switch turn to other player
        room.currentTurn = (room.currentTurn + 1) % 2;
        room.currentRow++;

        //broadcast to everyone in room
        io.to(roomCode).emit('guessResult', {
            guess: guess,
            row: data.row,
            isCorrect: isCorrect,
            playerName: playerName,
            currentTurn: room.currentTurn
        });

        if(isCorrect){
            room.scores[playerIndex]++; //increase winner's score

            io.to(roomCode).emit('roundEnded', { 
                winner: playerName,
                scores: room.scores,
                reason: 'correct'
            });

            setTimeout(() => startNewRound(roomCode), 3000);
        } else if(room.currentRow >= 6){
            io.to(roomCode).emit('roundEnded', {
                winner: null,
                scores: room.scores,
                reason: 'draw',
                correctWord: targetWord
            });
            
            setTimeout( () => startNewRound(roomCode), 3000);
        } else {
            startTurnTimer(roomCode);
        }

        //start timer for next turn 
        if(!isCorrect && room.currentRow < 6) {
            startTurnTimer(roomCode);
        }

    });

    socket.on('leaveRoom', () => {
        console.log('Manual leave room trigger for:', socket.id);
        handleDisconnect(socket.id);
    })

    socket.on('disconnect', () => {
        console.log('========================================');
        console.log('DISCONNECT DETECTED for socket:', socket.id);
        console.log('Current rooms:', Object.keys(rooms));
        console.log('========================================');
        console.log('Player disconnected;', socket.id);
        handleDisconnect(socket.id);
        
    });
});

function handleDisconnect(socketId){
    for(const code in rooms){
            const room = rooms[code];
            const playerIndex = room.players.findIndex(p => p.id === socketId);

            if(playerIndex != -1){
                const disconnectedPlayer = room.players[playerIndex];

                //check if game was active(currentTurn exist = game started)
                const gameWasActive = room.currentTurn != undefined;

                if(gameWasActive){
                   console.log(`${disconnectedPlayer.name} disconnected during game in room ${code}`);
                   io.to(code).emit('gameEnded', {
                    reason: `${disconnectedPlayer.name} disconnected. Game ended.`
                   });
                   delete rooms[code];
                } else {
                    //still in lobby 
                    if(room.host === socketId) {
                        //host left
                        console.log(`host ${disconnectedPlayer.name} left lobby ${code}, closing room`);
                        io.to(code).emit('hostDisconnected');
                        delete rooms[code];
                    } else {
                        //guest left lobby, remove them lobby stays open
                        console.log(`${disconnectedPlayer.name} left lobby ${code}`);
                        room.players.splice(playerIndex, 1);
                        io.to(code).emit('playerLeft', {
                            playerName: disconnectedPlayer.name
                        });
                    }
                }
                break;
            }
        }
}

//timer to each turn

function startTurnTimer(roomCode) {
    const room = rooms[roomCode];
    if(!room) return;


    //clear any current timers
    if(room.turnTimer){
        clearTimeout(room.turnTimer);
    }

    // notify client timer has start
    io.to(roomCode).emit('timerStart', {
        duration: room.turnDuration / 1000
    });

    //set timeout
    room.turnTimer = setTimeout ( () => {
        handleTurnTimeout(roomCode);
    }, room.turnDuration);
}

function handleTurnTimeout(roomCode){
    const room = rooms[roomCode];
    if(!room) return;

    const currentPlayerIndex = room.currentTurn;
    const currentPlayerName = room.players[currentPlayerIndex].name;

    console.log(`${currentPlayerName} ran out of time in room ${roomCode}`);

    //skip turn
    room.currentTurn = (room.currentTurn + 1) % 2;
    room.currentRow++;

    //notify the client
    io.to(roomCode).emit('turnSkipped', {
        playerName: currentPlayerName,
        row: room.currentRow - 1,
        currentTurn: room.currentTurn
    });

    //check if game over
    if(room.currentRow >= 6) {
        io.to(roomCode).emit('roundEnded', {
            winner: null,
            scores: room.scores,
            reason: 'draw',
            correctWord: room.targetWord
        });
        setTimeout( () => startNewRound(roomCode), 3000);
    } else {
        startTurnTimer(roomCode); //Start timer for next turn
    }
}

//start new round 
function startNewRound(roomCode) {
    const room = rooms[roomCode];
    if(!room) return;

    room.currentRound++;

    //match over if current round is greater than 5
    if(room.currentRound > room.maxRounds) {
        let winner = null;
        if(room.scores[0] > room.scores[1]){
            winner = 0;
        } else if(room.scores[0] < room.scores[1]) {
            winner = 1;
        } 

        //else means nobody won draw 
        io.to(roomCode).emit('matchEnded', {
            winner: winner !== null ? room.players[winner].name : null,
            scores: room.scores,
            reason: winner !== null? 'bestOf5Complete' : 'trueDraw'
        });
        delete rooms[roomCode];
        return;
    }

    //if there still more rounds, resets round
    room.targetWord = getRandomWord('medium');
    room.currentTurn = Math.floor(Math.random() * 2);
    room.currentRow = 0;

    if(room.turnTimer){
        clearTimeout(room.turnTimer);
        room.turnTimer = null;
    }

    io.to(roomCode).emit('newRoundStarting', {
        round: room.currentRound,
        maxRounds: room.maxRounds,
        scores: room.scores,
        targetWord: room.targetWord,
        currentTurn: room.currentTurn
    });

    startTurnTimer(roomCode);
}


server.listen(3000, () => {
    console.log('Server running on https://localhost:3000')
});