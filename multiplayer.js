import { 
    createGameGrid, 
    createGameKeyboard, 
    getSquare, 
    colorFeedback, 
    testWord, 
    showInvalidWordPopup,
    shakeCurrentRow 
} from './gameLogic.js';

let currentPlayer = 1;
let currentRow = 0;
let currentGuess = "";
let gameActive = false;
let target= "Mango";
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

    gameActive = true;
    currentRow = 0;
    currentGuess = "";

    console.log("Successfully initialized");
}

function handleLetter(letter){
    if(currentGuess.length < 5) {
        currentGuess += letter;
        updateCurrentRow();
    }
}

function handleBackspace(){
    if(currentGuess.length > 0) {
        currentGuess=currentGuess.slice(0, -1);
        updateCurrentRow();
    }
}

async function handleEnter(){
    if(currentGuess.length !== 5){
        showInvalidWordPopup("Word must be 5 letters long");
        shakeCurrentRow(currentRow, squares);
        return;
    }
}