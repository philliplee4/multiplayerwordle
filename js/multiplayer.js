
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
    colorFeedback
} from './gameLogic.js';

let currentPlayer = 1;
let currentRow = 0;
let currentGuess = "";
let gameActive = false;
let targetWord= "";
let squares = null;

let myTurnIndex = -1;
let currentTurnIndex = 0;

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
    if(currentGuess.length !== 5){
        showInvalidWordPopup("Word must be 5 letters long");
        shakeCurrentRow(currentRow, squares);
        return;
    }

    socket.emit('submitGuess', {
        guess: currentGuess,
        row: currentRow
    });

    /* //check word if valid and correct 
    const result = await validGuess(currentGuess, targetWord, currentRow, squares);

    //check if word is valid
    if(!result.valid){
        showInvalidWordPopup("Not a valid word");
        shakeCurrentRow(currentRow, squares);
        return;
    }

    //check if word is correct guess
    if(result.isCorrect){
        console.log(`Player ${currentPlayer} wins!`);
    } else if (currentRow >= 5){
        console.log("End of round!")
        cleanupGame();
        //round ends
    } else {
        currentRow++;
        currentGuess="";
        //switch turns switchPlayer();
    } */
}

function cleanupGame(){
    document.removeEventListener('keydown', handlePhysicalKeyboard);
    gameActive = false;
}

function updateTurnIndicator(){
    const indicator = document.querySelector('.turn-indicator');
    if(indicator){
        if(myTurnIndex === currentTurnIndex) {
            indicator.textContent = "Your Turn";
            indicator.style.color = "#1e40af";
        } else {
            indicator.textContent = "Opponent's Turn";
            indicator.style.color = "#6b7280";
        }
    }
}
/* 
export function setMyTurnIndex(index) {
    myTurnIndex = index;
} */

socket.on('guessResult', (data) => {
    
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
    } else if(currentRow >= 6) {
        console.log("Round ends!");
        gameActive = false;
    } //if neither, then game continues


})

socket.on('invalidWord', (data) => {
    showInvalidWordPopup(data.message);
    shakeCurrentRow(currentRow, squares);
})




    // Add this to your main JavaScript file or at the bottom of multiplayer.js
window.addEventListener('DOMContentLoaded', () => {
    const multiplayerScreen = document.getElementById('multiplayerGameScreen');
    if (multiplayerScreen && multiplayerScreen.style.display !== 'none') {
        initializeMultiplayerGame();
    }
});

