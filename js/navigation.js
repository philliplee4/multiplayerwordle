import { initializeMultiplayerGame } from './multiplayer.js';
import { socket } from './socket-client.js';


let isHost=false;

// Listen for room created response from server
socket.on('roomCreated', (data) => {
    console.log('Room created:', data.roomCode);
    isHost = true; //Set host flag
    
    // Show waiting room
    showScreen('waitingRoomScreen');
    
    //create sharable link
    const shareableLink = `${window.location.origin}${window.location.pathname}?room=${data.roomCode}`;
    document.getElementById('currentRoomCode').textContent = shareableLink;
    
    // Update player 1 info
    document.querySelector('#player1Slot .player-name').textContent = data.playerName;

    // Show start button only for host
    document.getElementById('startGameBtn').style.display = 'block';
});


//room join
socket.on('roomJoined', (data) => {
    console.log('Joined room:', data.roomCode);
    isHost = false; // not host

    showScreen('waitingRoomScreen');
    document.getElementById('currentRoomCode').textContent = window.location.search;

    document.querySelector('#player1Slot .player-name').textContent = data.player1Name;
    document.querySelector('#player1Slot .player-status').textContent = 'Ready';


    document.querySelector('#player2Slot .player-name').textContent = data.playerName;
    document.querySelector('#player2Slot .player-status').textContent = 'Ready';


    document.getElementById('playerCount').textContent = "2/2"
    document.getElementById('startGameBtn').style.display = 'none';
})

// Other player joins(host to see)
socket.on('playerJoined', (data) => {
    document.querySelector('#player2Slot .player-name').textContent = data.playerName;
    document.querySelector('#player2Slot .player-status').textContent = 'Ready';
    document.getElementById('playerCount').textContent = '2/2';   
});

socket.on('error', (data) => {
    alert(data.message);

    if(data.message === 'Room not found') {
        window.location.href = window.location.origin + window.location.pathname;
    }
});

//listen for game start for both people to join
socket.on('gameStarted', (data)=> {
    console.log('Game starting!');
    showScreen('multiplayerGameScreen');

    //update player names on multiplayer screen
    document.querySelector('.player-sidebar.active .player-name').textContent = data.player1;
    document.querySelector('.player-sidebar.player2 .player-name').textContent = data.player2;


    const myPlayerIndex = isHost ? 0 : 1;
    initializeMultiplayerGame(data, myPlayerIndex);

})

//disconnection

socket.on('hostDisconnected', ()=> {
    alert('Host disconnected. Returning to home.');
    window.location.href = window.location.origin + window.location.pathname;
});

socket.on('playerLeft', (data) => {
    alert(`${data.playerName} left the room`);
    document.querySelector('#player2Slot .player-name').textContent = 'Waiting...';
    document.querySelector('#player2Slot .player-status').textContent = 'Joining';
    document.getElementById('playerCount').textContent = '1/2';
});

socket.on('gameEnded', (data) => {
    alert(data.reason);
    window.location.href = window.location.origin + window.location.pathname;
})

function showScreen(screenId){
    const screens = [
        'homescreen',
        'roomSetupScreen',
        'waitingRoomScreen',
        'multiplayerGameScreen',
        'itemShopScreen',
        'gameFinishScreen',
        'initializeMultiplayerGame'
    ]

    screens.forEach(id => {
        const element = document.getElementById(id);
        if(element) {
            element.style.display = 'none';
        }
    });

    const targetElement = document.getElementById(screenId);
    if(targetElement) {
        targetElement.style.display = 'block';
    } else {
        console.error(`Screen with id '${screenId}' not found`) ;
    }
    }

document.addEventListener('DOMContentLoaded', ()=> {
    
    //showScreen('multiplayerGameScreen');

    //check if URL has room code
    const urlParams = new URLSearchParams(window.location.search);
    const roomCodeFromURL = urlParams.get('room');

    //homepage
    const competitiveBtn = document.getElementById('competiveMode');
    const customBtn = document.getElementById('customMode');
    
    //waiting room
    const startGameBtn = document.getElementById('startGameBtn');
    const leaveRoomBtn = document.getElementById('leaveRoomBtn');

    const createBtn = document.getElementById('createRoomConfirm');

    const backHomeBtn = document.getElementById('backToHomeFromRoom');

    //leave button for everyone before any returns
    if(leaveRoomBtn){
        leaveRoomBtn.addEventListener('click', ()=> {
            console.log('Leave Room Clicked');
            socket.emit('leaveRoom');
            socket.disconnect();
            window.location.href = window.location.origin + window.location.pathname;
        });
    }

    //setup start game button for everyone 
    if(startGameBtn){
        startGameBtn.addEventListener('click', () => {
            console.log('Start button clicked, emitting startGame');
            socket.emit('startGame');
        })
    }

    if(backHomeBtn){
        backHomeBtn.addEventListener('click', ()=> {
            window.location.href = window.location.origin + window.location.pathname;
        });
    }



    //someone click on shared link
    if(roomCodeFromURL){
        showScreen('roomSetupScreen');
        if(createBtn) {
            createBtn.textContent = 'Join Room';
            createBtn.addEventListener('click', () => {
                const playerName = document.getElementById('playerNameInput').value;
                if(!playerName){
                    alert('Please enter your name');
                    return;
                }
                socket.emit('joinRoom', { playerName, roomCode: roomCodeFromURL});
            });
        }
        return;
    }



    //homepage
    if(competitiveBtn){
        competitiveBtn.addEventListener('click', () => showScreen('waitingRoomScreen'));
    }

    if(customBtn){
        customBtn.addEventListener('click', () => showScreen('roomSetupScreen'));
    }

    //roomsetup 
    if(createBtn){
        createBtn.addEventListener('click', () => {
            const playerName = document.getElementById('playerNameInput').value;

            if(!playerName){
                alert('Please enter your name');
                return;
            }

            socket.emit('createRoom', { playerName });
        });
    }






});

