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

socket.on('rematchRequested', (data) => {
    
    console.log(`${data.playerName} wants to rematch!`);

    const matchEndMessage = document.getElementById('matchEndMessage');
    if(matchEndMessage){
        matchEndMessage.textContent = `${data.playerName} wants a rematch! Click Rematch to accept.`;
        matchEndMessage.style.color = '#059669';
        matchEndMessage.style.fontWeight = '700';
        matchEndMessage.style.fontSize = '1.5rem';
    }
    
    const rematchBtn = document.getElementById('rematchBtn');
    if(rematchBtn) {
    
        rematchBtn.disabled = false;
        rematchBtn.textContent = 'Accept Rematch';
        rematchBtn.style.background = '#10b981';
        rematchBtn.style.cursor = 'pointer';
        rematchBtn.style.animation = 'pulse 1s infinite';
        rematchBtn.style.boxShadow = '0 0 20px rgba(16, 185, 129, 0.5)';
    }
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
    
    /* showScreen('multiplayerGameScreen'); */

    

    //check if URL has room code
    const urlParams = new URLSearchParams(window.location.search);
    const roomCodeFromURL = urlParams.get('room');

    const testScreen = urlParams.get('screen');
    // Development mode - auto-initialize game components
    if(testScreen === 'multiplayerGameScreen') {
        showScreen(testScreen);
        
        // Auto-initialize the game grid and keyboard for testing
        setTimeout(() => {
            const mockGameData = {
                targetWord: 'APPLE', // Test word
                currentTurn: 0
            };
            const mockPlayerIndex = 0; // You're player 1
            
            initializeMultiplayerGame(mockGameData, mockPlayerIndex);
        }, 100);
        return;
    }
    
    // Normal flow
    if(testScreen && document.getElementById(testScreen)) {
        showScreen(testScreen);
        return;
    }

    //homepage
    const competitiveBtn = document.getElementById('competiveMode');
    const customBtn = document.getElementById('customMode');
    
    //waiting room
    const startGameBtn = document.getElementById('startGameBtn');
    const leaveRoomBtn = document.getElementById('leaveRoomBtn');

    const playerNameInput = document.getElementById('playerNameInput');
    const createBtn = document.getElementById('createRoomConfirm');
    const backHomeBtn = document.getElementById('backToHomeFromRoom');

    //match end screen buttons
    const rematchBtn = document.getElementById('rematchBtn');
    const backToHomeBtn = document.getElementById('backToHomeBtn');

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

    if(playerNameInput){
        playerNameInput.addEventListener('keydown', (event) => {
            if(event.key === 'Enter'){
                event.preventDefault();
                
                if(document.activeElement === backHomeBtn){
                    return;
                }

                if(createBtn){
                    createBtn.click();
                }
                
            }
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

    //match end screen
    if(rematchBtn){
        rematchBtn.addEventListener('click', ()=> {
            console.log('Rematch requested');

            rematchBtn.disabled = true;
            rematchBtn.textContent = 'Waiting for opponent...';
            rematchBtn.style.background = '#9ca3af';
            rematchBtn.style.cursor = 'not-allowed';
            rematchBtn.style.animation = 'none';

            socket.emit('requestRematch');

            const matchEndMessage = document.getElementById('matchEndMessage');
            if(matchEndMessage){
                matchEndMessage.textContent = 'Waiting for opoonent to accept rematch...';
                matchEndMessage.style.color = '#6b7280';
                matchEndMessage.style.fontSize = '1.3rem';
            }

        });
    }

    if(backToHomeBtn) {
        backToHomeBtn.addEventListener('click', ()=> {
            socket.emit('leaveRoom');
            document.getElementById('matchEndScreen').style.display = 'none';
            location.reload();
        });
    }


});

