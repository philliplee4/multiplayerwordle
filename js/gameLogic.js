//Generating the board and general rules


//Define the actual letters on keyboard
const row1 = ["Q", "W", "E", "R", "T", "Y", "U", "I", "O", "P"];
const row2 = ["A", "S", "D", "F", "G", "H", "J", "K", "L"];
const row3 = ["Enter", "Z", "X", "C", "V", "B", "N", "M", "⌫"];

const letterRows = {
  Q: "row1", W: "row1", E: "row1", R: "row1", T: "row1", Y: "row1", U: "row1", I: "row1", O: "row1", P: "row1",
  A: "row2", S: "row2", D: "row2", F: "row2", G: "row2", H: "row2", J: "row2", K: "row2", L: "row2",
  Z: "row3", X: "row3", C: "row3", V: "row3", B: "row3", N: "row3", M: "row3"
};

//Gameboard creation

export function createGameGrid(gridId) {
    const guessGrid = document.getElementById(gridId);
    if(!guessGrid){
        console.error(`Grid element with id '${gridId}' not found`)
        return null;
    }

    guessGrid.innerHTML = '';

    for(let row = 0;row<6;row++){
        const guessRow = document.createElement('div');
        guessRow.classList.add('guessRow');

/* 
        //add player indicators
        const playerIndicator = document.createElement('div');
        playerIndicator.classList.add('player-indicator');
        playerIndicator.setAttribute('data-row', row);
        guess.appendChild(playerIndicator);
 */

        for(let column=0;column<5;column++){
            const letterBox = document.createElement('div');
            letterBox.classList.add('letter-box');
            guessRow.appendChild(letterBox);
        }

        guessGrid.appendChild(guessRow);
    }

    return document.querySelectorAll(`#${gridId} .letter-box`);
}

export function createGameKeyboard(kb1, kb2, kb3, handleInputCallback){

    //access id of each keyboard row
    const keyboardOne = document.getElementById(kb1);
    const keyboardTwo = document.getElementById(kb2);
    const keyboardThree = document.getElementById(kb3);

    if (!keyboardOne || !keyboardTwo || !keyboardThree) {
        console.error('One or more keyboard elements not found');
        return;
    }


    //
    keyboardOne.innerHTML = '';
    keyboardTwo.innerHTML = '';
    keyboardThree.innerHTML = '';

    row1.forEach(letter => {
        const key = document.createElement('button');
        key.classList.add('key-button', 'letter-key');
        key.textContent = letter;
        key.addEventListener('click', () => handleInputCallback(letter))
        keyboardOne.appendChild(key);
    });

    row2.forEach(letter => {
        const key = document.createElement('button');
        key.classList.add('key-button','letter-key');
        key.textContent = letter;
        key.addEventListener('click', () => handleInputCallback(letter))
        keyboardTwo.appendChild(key);
    });

    row3.forEach(letter => {
        const key = document.createElement('button');
        key.textContent = letter;
        if(letter === "Enter" || letter === "⌫") {
            key.classList.add('key-button','wide-key');
        } else {
            key.classList.add('key-button','letter-key');
        }
       
        key.addEventListener('click', () => handleInputCallback(letter))
        keyboardThree.appendChild(key);
    });
}

export async function validGuess(guess, targetWord, rowNumber, squares){
  //ensures word is a valid word, not if guess is correct
  const isValid = await testWord(guess);

  if(!isValid){
    return{
      valid: false,
      isCorrect: false
    };
  }

  colorFeedback(guess, targetWord, rowNumber, squares);

  //checks if word is the correct wordle 
  const isCorrect = guess.toUpperCase() === targetWord.toUpperCase();
  return { valid: true, isCorrect };

}

export function displayCurrentGuess(guess, row, squares){

    for(let i = 0; i< 5; i++){
        const square = getSquare(row, i, squares);
        if(square){
            square.textContent = '';
            square.classList.remove('filled');
        }
    }

    for(let i = 0; i< guess.length; i++){
        const square = getSquare(row, i, squares);
        if(square){
            square.textContent = guess[i];
            square.classList.add('filled');
        }
    }
}

//Helper functions
export function getSquare(row, column, squares){
    if(!squares) return null;
    return squares[row * 5 + column];
}

export async function getRandomWord() {
    try {
        const response = await fetch("https://random-word-api.vercel.app/api?words=1&length=5");
        const [word] = await response.json();
        return word.toUpperCase();
    } catch (error) {
        console.error('Error fetching word:', error);
        const fallbackWords = ["SUPER", "FURRY", "WORLD", "MANGO"];
        const fallback = fallbackWords[Math.floor(Math.random() * fallbackWords.length)];
        console.log("Using fallback word: " + fallback);
        return fallback;
    }
}

export async function testWord(guess){
    try{
        const response = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${guess}`);
        return response.ok;
    } catch (error) {
        console.error('Error testing word:', error);
        return false;
    }
}

export function clearGameBoard(squares) {
    if(!squares) return;
    squares.forEach(square => {
        square.textContent = "";
        square.className = "letter-box";
    });
}

export function clearKeyboard(kb1, kb2, kb3){
    [kb1, kb2, kb3].forEach(rowId => {
        const keyboardRow = document.getElementById(rowId);
        if(keyboardRow){
            const keys = keyboardRow.querySelectorAll('button');
            keys.forEach(key => {
                key.classList.remove('correct', 'present','absent');
                /* Maybe change later to "normal" format */
                if(key.textCtonent === "Enter" || key.textContent === "⌫"){
                  key.className = "key-button wide-key";
                } else {
                  key.className = "key-button letter-key";
                }
            });
        }
    });
}


export function colorFeedback(userGuess, targetWord, rowNumber, squares) {
  let availableLetters = targetWord.split('');
  let results = new Array(5);

  // First pass: correct positions
  for (let i = 0; i < 5; i++) {
    if (userGuess[i] === targetWord[i]) {
      results[i] = 'correct';
      colorKeyboard(userGuess[i], letterRows[userGuess[i]], 'correct');
      availableLetters.splice(availableLetters.indexOf(userGuess[i]), 1);
    }
  }

  // Second pass: present/absent
  for (let i = 0; i < 5; i++) {
    if (results[i] === 'correct') continue;
    const availableIndex = availableLetters.indexOf(userGuess[i]);

    if (availableIndex !== -1) {
      results[i] = 'present';
      colorKeyboard(userGuess[i], letterRows[userGuess[i]], 'present');
      availableLetters.splice(availableIndex, 1);
    } else {
      results[i] = 'absent';
      colorKeyboard(userGuess[i], letterRows[userGuess[i]], 'absent');
    }
  }

  // Apply colors to squares
  for (let i = 0; i < 5; i++) {
    const currentSquare = getSquare(rowNumber, i, squares);
    if (currentSquare) {
      currentSquare.classList.add(results[i]);
    }
  }
}

export function colorKeyboard(letter, rowType, colorClass) {
  // Map rowType to actual keyboard IDs
  const keyboardMap = {
    'row1': 'kb1',
    'row2': 'kb2', 
    'row3': 'kb3'
  };
  
  const rowId = keyboardMap[rowType];
  const keyboardRow = document.getElementById(rowId);
  if (!keyboardRow) return;
  
  const keys = keyboardRow.querySelectorAll('button');
  let letterArray = rowType === 'row1' ? row1 : rowType === 'row2' ? row2 : row3;

  for (let i = 0; i < letterArray.length; i++) {
    if (letterArray[i] === letter) {
      const keyElement = keys[i];
      if (keyElement) {
        // Don't downgrade feedback (correct > present > absent)
        if (keyElement.classList.contains('correct')) return;
        if (keyElement.classList.contains('present') && colorClass === 'absent') return;
        
        keyElement.classList.remove('correct', 'present', 'absent');
        keyElement.classList.add(colorClass);
      }
      break;
    }
  }
}

export function shakeCurrentRow(currentRow, squares) {
  for (let col = 0; col < 5; col++) {
    const square = getSquare(currentRow, col, squares);
    if (square) {
      square.classList.add('shake');
      setTimeout(() => square.classList.remove('shake'), 600);
    }
  }
}

export function showInvalidWordPopup(message = "Invalid word") {
  const popup = document.getElementById('incorrectPopup');
  if (popup) {
    popup.textContent = message;
    popup.classList.add('show');
    setTimeout(() => popup.classList.remove('show'), 1000);
  }
}
