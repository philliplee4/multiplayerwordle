
import { socket } from './socket-client.js'

import { 
    createGameGrid, 
    createGameKeyboard, 
    showInvalidWordPopup,
    shakeCurrentRow,
    validGuess,
    getRandomWord,
    clearGameBoard,
    clearKeyboard,
    displayCurrentGuess,
    colorFeedback,
    getSquare
} from './gameLogic.js';

let currentPlayer = 1;
let currentRow = 0;
let currentGuess = "";
let gameActive = false;
let targetWord= "";
let squares = null;

let myTurnIndex = -1;
let currentTurnIndex = 0;

let turnTimer = null;
let timeRemaining = 30;

let isSubmitting = false;

/* Start multiplayer game*/

export function initializeMultiplayerGame(gameData, playerIndex){
    console.log("Starting multiplayer game with data:", gameData);

    targetWord = gameData.targetWord;
    currentTurnIndex = gameData.currentTurn;
    myTurnIndex = playerIndex;

    /* Create game grid */
    squares = createGameGrid('mp-Grid');

    if(!squares) {
        console.error("Failed to create game grid");
        return;
    }

    createGameKeyboard('kb1','kb2','kb3',handleKeyboardInput);
    document.addEventListener('keydown', handlePhysicalKeyboard)

    //generate new word each round 
    gameActive = true;
    isSubmitting = false;
    updateTurnIndicator();

    console.log("Successfully initialized");
}


//not used maybe delete later
async function startNewRound(){
    console.log("Starting new round...");
/*     targetWord = await getRandomWord();
    console.log("Target word:",  targetWord); */

    currentRow = 0;
    currentGuess = "";
    currentPlayer = 1;

    clearGameBoard(squares);
    clearKeyboard('kb1', 'kb2', 'kb3');
}

function handleKeyboardInput(key){
    if(!gameActive) return;
    if(myTurnIndex != currentTurnIndex){
        showInvalidWordPopup("Not your turn!");
        return;
    }

    if(key === 'ENTER' || key === 'Enter'){
        handleEnter();
    } else if(key === '⌫'){
        handleBackspace();
    } else if(/^[A-Z]$/.test(key)){
        handleLetter(key);
    }
}


function handlePhysicalKeyboard(event) {
    if (!gameActive) return;
    if(myTurnIndex != currentTurnIndex) return;
    
    const key = event.key.toUpperCase();
    
    // Handle letters A-Z
    if (key.length === 1 && key >= 'A' && key <= 'Z') {
        handleLetter(key);
    }
    // Handle Enter
    else if (event.key === 'Enter') {
        handleEnter();
    }
    // Handle Backspace
    else if (event.key === 'Backspace') {
        handleBackspace();
    }
}




/* handle inputs*/
function handleLetter(letter){
    if(currentGuess.length < 5) {
        currentGuess += letter.toUpperCase();
        displayCurrentGuess(currentGuess, currentRow, squares);
    }
}

function handleBackspace(){
    if(currentGuess.length > 0) {
        currentGuess=currentGuess.slice(0, -1);
        displayCurrentGuess(currentGuess, currentRow, squares);
    }
}

async function handleEnter(){

    if(isSubmitting) {
        console.log("Already sumitting, ignoring duplicate enters");
        return;
    }
    if(currentGuess.length !== 5){
        showInvalidWordPopup("Word must be 5 letters long");
        shakeCurrentRow(currentRow, squares);
        return;
    }

    isSubmitting = true;

    socket.emit('submitGuess', {
        guess: currentGuess,
        row: currentRow
    });

    setTimeout( () => {
        isSubmitting = false;
    }, 1000);

}

function cleanupGame(){
    document.removeEventListener('keydown', handlePhysicalKeyboard);
    if(turnTimer) clearInterval(turnTimer);
    gameActive = false;
    isSubmitting = false;
}

function updateTurnIndicator(){
    const indicator = document.querySelector('.turn-indicator');

    const player1Sidebar = document.querySelector('.player-sidebar.active');
    const player2Sidebar = document.querySelector('.player-sidebar.player2');


    if(indicator){
        if(myTurnIndex === currentTurnIndex) {
            indicator.textContent = "Your Turn";
            indicator.style.color = "#1e40af";
        } else {
            indicator.textContent = "Opponent's Turn";
            indicator.style.color = "#6b7280";
        }

    }

     if(myTurnIndex === currentTurnIndex) {
        // It's my turn - highlight my sidebar
        if(myTurnIndex === 0 && player1Sidebar) {
            player1Sidebar.style.border = '3px solid #3b82f6';
            player1Sidebar.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.4)';
        } else if(myTurnIndex === 1 && player2Sidebar) {
            player2Sidebar.style.border = '3px solid #3b82f6';
            player2Sidebar.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.4)';
        }
        
        // Remove highlight from opponent
        if(myTurnIndex === 0 && player2Sidebar) {
            player2Sidebar.style.border = 'none';
            player2Sidebar.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
        } else if(myTurnIndex === 1 && player1Sidebar) {
            player1Sidebar.style.border = 'none';
            player1Sidebar.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
        }
    } else {
        // It's opponent's turn - highlight their sidebar
        if(currentTurnIndex === 0 && player1Sidebar) {
            player1Sidebar.style.border = '3px solid #3b82f6';
            player1Sidebar.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.4)';
        } else if(currentTurnIndex === 1 && player2Sidebar) {
            player2Sidebar.style.border = '3px solid #3b82f6';
            player2Sidebar.style.boxShadow = '0 0 20px rgba(59, 130, 246, 0.4)';
        }
        
        // Remove highlight from my sidebar
        if(myTurnIndex === 0 && player1Sidebar) {
            player1Sidebar.style.border = 'none';
            player1Sidebar.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
        } else if(myTurnIndex === 1 && player2Sidebar) {
            player2Sidebar.style.border = 'none';
            player2Sidebar.style.boxShadow = '0 4px 15px rgba(0, 0, 0, 0.1)';
        }
    }
}


socket.on('guessResult', (data) => {

    isSubmitting = false;

    //display guess on grid
    displayCurrentGuess(data.guess, data.row, squares);

    //apply colors based on guess
    colorFeedback(data.guess, targetWord, data.row, squares);

    currentRow = data.row + 1;
    currentGuess = "";
    currentTurnIndex = data.currentTurn;

    updateTurnIndicator();

    //check if game end
    if(data.isCorrect){
        console.log(`${data.playerName} wins!`);
        gameActive = false;
        if(turnTimer) clearInterval(turnTimer);
    } else if(currentRow >= 6) {
        console.log("Round ends!");
        gameActive = false;
        if(turnTimer) clearInterval(turnTimer);
    } //if neither, then game continues


})

socket.on('invalidWord', (data) => {
    isSubmitting = false;
    showInvalidWordPopup(data.message);
    shakeCurrentRow(currentRow, squares);
})

//starting timer
socket.on('timerStart', (data) => {
    timeRemaining = data.duration;
    startClientTimer();
});

//turn skipped
socket.on('turnSkipped', (data) => {
    console.log(`${data.playerName}'s turn was skipped - time expired`);
    isSubmitting = false;

    //mark the skipped row as grayed out
    for(let i = 0; i<5; i++){
        const square = getSquare(data.row, i, squares);
        if(square) {
            square.textContent = '';
            square.classList.add('absent');
        }
    }

    currentRow = data.row + 1;
    currentTurnIndex = data.currentTurn;
    currentGuess = "";
    updateTurnIndicator();
})

//start timer
function startClientTimer() {
    if(turnTimer) clearInterval(turnTimer);

    turnTimer = setInterval( () => {
        timeRemaining--;
        updateTimerDisplay();

        if(timeRemaining <= 0){
            clearInterval(turnTimer);
        }
    }, 1000);
}

//update visualization of the timer
function updateTimerDisplay() {
    
    const wordInfo = document.querySelector('.word-info');
    if(wordInfo) {
        wordInfo.textContent = `Turn timer: ${timeRemaining}s`;

        if(timeRemaining <= 10) {
            wordInfo.style.color = '#ef4444';
        } else {
            wordInfo.style.color = '#6b7280';
        }
    }
}

socket.on('newRoundStarting', (data) => {
    console.log(`Starting round ${data.round}/${data.maxRounds}`);
    isSubmitting = false;

    const roundInfo = document.querySelector('.round-info');
    if(roundInfo){
        roundInfo.textContent = `Round ${data.round}/${data.maxRounds}`;
    }

    const matchScore = document.querySelector('.match-score');
    if(matchScore) {
        matchScore.textContent = `Player 1: ${data.scores[0]} wins | Player 2: ${data.scores[1]} wins `
    }

    //reset game state
    targetWord = data.targetWord;
    currentTurnIndex = data.currentTurn;
    currentRow = 0;
    currentGuess = "";
    gameActive = true;

    clearGameBoard(squares);
    clearKeyboard('kb1', 'kb2', 'kb3');

    updateTurnIndicator();
});

socket.on('roundEnded', (data) => {
    gameActive = false;
    isSubmitting = false;

    if(turnTimer) clearInterval(turnTimer);

    if(data.winner) {
        showInvalidWordPopup(`${data.winner} wins this round!`);
    } else {
        showInvalidWordPopup(`Round draw! Word was: ${data.correctWord}`);
    }

    const matchScore = document.querySelector('.match-score');
    if(matchScore) {
        matchScore.textContent = `Player 1: ${data.scores[0]} wins | Player 2: ${data.scores[1]} wins`
    }
});

socket.on('matchEnded', (data) => {
    gameActive = false;
    if(turnTimer) clearInterval(turnTimer);

    let message = '';
    if(data.winner){
        message = `Match Over! ${data.winner} wins ${data.scores[0]}-${data.scores[1]}!`
    } else {
        message = `Match ended in a draw ${data.scores[0]}-${data.scores[1]}!`;
    }

    showMatchEndScreen(message, data.scores);
})

function showMatchEndScreen(message, scores) {

    //hides multiplayer game screen
    document.getElementById('multiplayerGameScreen').style.display = 'none';

    //create or show match ending screen
    let endScreen = document.getElementById('matchEndScreen');
    if(!endScreen){
        endScreen = document.createElement('div');
        endScreen.id = 'matchEndScreen';
        endScreen.style.cssText = 'display: flex; flex-direction: column; align-items: center; justify-content: center; min-height: 100vh; padding: 40px;';
        document.body.appendChild(endScreen); 
    }

        endScreen.innerHTML = `
        <div style="text-align: center; background: rgba(255,255,255,0.95); padding: 40px; border-radius: 20px; box-shadow: 0 8px 25px rgba(0,0,0,0.1);">
            <h1 style="font-size: 2.5rem; margin-bottom: 20px;">Match Complete!</h1>
            <p style="font-size: 1.5rem; margin-bottom: 30px;">${message}</p>
            
            <div style="display: flex; gap: 15px; flex-direction: column;">
                <button id="backToHomeBtn" style="padding: 15px 30px; font-size: 1.1rem; background: #3b82f6; color: white; border: none; border-radius: 10px; cursor: pointer; min-width: 250px;">
                    Main Menu
                </button>
            </div>
        </div>
    `;

    endScreen.style.display = 'flex';

    //add button
    document.getElementById('backToHomeBtn').addEventListener('click', ()=> {
        socket.emit('leaveRoom');
        endScreen.style.display = 'none';
        location.reload();
    });
}



    // Add this to your main JavaScript file or at the bottom of multiplayer.js
window.addEventListener('DOMContentLoaded', () => {
    const multiplayerScreen = document.getElementById('multiplayerGameScreen');
    if (multiplayerScreen && multiplayerScreen.style.display !== 'none') {
        initializeMultiplayerGame();
    }
});

