import { 
    createGameGrid, 
    createGameKeyboard, 
    showInvalidWordPopup,
    shakeCurrentRow,
    validGuess,
    getRandomWord,
    clearGameBoard,
    clearKeyboard,
    displayCurrentGuess
} from './gameLogic.js';

let currentPlayer = 1;
let currentRow = 0;
let currentGuess = "";
let gameActive = false;
let targetWord= "";
let squares = null;

/* Start multiplayer game*/

export function initializeMultiplayerGame(){
    console.log("Starting multiplayer game");

    /* Create game grid */
    squares = createGameGrid('mp-Grid');

    if(!squares) {
        console.error("Failed to create game grid");
        return;
    }

    createGameKeyboard('kb1','kb2','kb3',handleKeyboardInput);
    document.addEventListener('keydown', handlePhysicalKeyboard)

    //generate new word each round 
    startNewRound();
    gameActive = true;


    console.log("Successfully initialized");
}

async function startNewRound(){
    targetWord = await getRandomWord();
    console.log("Target word:",  targetWord);

    currentRow = 0;
    currentGuess = "";
    currentPlayer = 1;

    clearGameBoard(squares);
    clearKeyboard('kb1', 'kb2', 'kb3');
}

function handleKeyboardInput(key){
    if(!gameActive) return;

    if(key === 'ENTER'){
        handleEnter();
    } else if(key === '⌫'){
        handleBackspace();
    } else {
        handleLetter(key);
    }
}
/* 
function updateCurrentRow(){
    for(let i = 0; i< 5; i++){
        const square = getSquare(currentRow, i, squares);
        if(square){
            square.textContent = '';
            square.classList.add('filled');
        }
    }

    for(let i = 0; i<currentGuess.length; i++){
        const square = getSquare(currentRow, i, squares);
        if(square){
            square.textContent = currentGuess[i];
            square.classList.add('filled');
        }
    }
} */

function handlePhysicalKeyboard(event) {
    if (!gameActive) return;
    
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
        currentGuess += letter;
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

    //check word if valid and correct 
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
    }
}

function cleanupGame(){
    document.removeEventListener('keydown', handlePhysicalKeyboard);
    gameActive = false;
}


/* 
document.getElementById('startGameBtn').addEventListener('click', () => {
    // Hide waiting room
    document.getElementById('waitingRoomScreen').style.display = 'none';
    // Show multiplayer game
    showMultiplayerScreen();
});

export function showMultiplayerScreen() {
    document.getElementById('multiplayerGameScreen').style.display = 'block';
    initializeMultiplayerGame();
} */

    // Add this to your main JavaScript file or at the bottom of multiplayer.js so guessing grid and keyboard will always show
window.addEventListener('DOMContentLoaded', () => {
    const multiplayerScreen = document.getElementById('multiplayerGameScreen');
    if (multiplayerScreen && multiplayerScreen.style.display !== 'none') {
        initializeMultiplayerGame();
    }
}); 
