"use strict";

/*
    COMP 2132 Assignment 08
    Hangman Game

    This file controls the full Hangman game:
    - loading words from a JSON file
    - starting and resetting the game
    - handling guesses
    - updating the display
    - checking for win/loss conditions
*/


// -------------------------
// GAME DATA OBJECT
// -------------------------

/*
    game
    This object stores all game data and settings in one place.
*/
const game =
{
    // words
    // Array of word/hint objects loaded from the JSON file.
    words: [],

    // selectedWord
    // The current word the player is trying to guess.
    selectedWord: "",

    // selectedHint
    // The hint that matches the selected word.
    selectedHint: "",

    // correctLetters
    // Array of correctly guessed letters.
    correctLetters: [],

    // wrongLetters
    // Array of incorrectly guessed letters.
    wrongLetters: [],

    // maxWrong
    // Maximum number of wrong guesses allowed before the player loses.
    maxWrong: 6,

    // isOver
    // Tracks whether the current game has ended.
    isOver: false,

    // hangmanImages
    // Array of image file paths for each hangman stage.
    hangmanImages:
    [
        "images/hangman-0.png",
        "images/hangman-1.png",
        "images/hangman-2.png",
        "images/hangman-3.png",
        "images/hangman-4.png",
        "images/hangman-5.png",
        "images/hangman-6.png"
    ]
};


// -------------------------
// PAGE ELEMENTS
// -------------------------

// wordDisplay
// The page element that shows the hidden word with guessed letters revealed.
const wordDisplay = document.getElementById("word-display");

// hintText
// The page element that displays the hint for the current word.
const hintText = document.getElementById("hint-text");

// wrongCount
// The page element that displays the number of wrong guesses.
const wrongCount = document.getElementById("wrong-count");

// guessedLettersText
// The page element that shows all letters the player has guessed.
const guessedLettersText = document.getElementById("guessed-letters");

// messageArea
// The page element used to show feedback messages to the player.
const messageArea = document.getElementById("message-area");

// hangmanImage
// The page element that displays the current hangman image.
const hangmanImage = document.getElementById("hangman-image");

// letterInput
// The text input where the player types a letter guess.
const letterInput = document.getElementById("letter-input");

// guessButton
// The button the player clicks to submit a typed letter guess.
const guessButton = document.getElementById("guess-button");

// playAgainButton
// The button the player clicks to reset the game and begin a new round.
const playAgainButton = document.getElementById("play-again-button");

// letterBoard
// The container that holds the clickable A-Z letter buttons.
const letterBoard = document.getElementById("letter-board");


// -------------------------
// FUNCTIONS
// -------------------------

/*
    loadWords()
    This function loads the word and hint data from the JSON file using fetch().
    Once the JSON data is loaded, it stores the words in the game object,
    creates the letter buttons, and starts the first game.
*/
function loadWords()
{
    fetch("data/words.json")
        .then(function(response)
        {
            if (!response.ok)
            {
                throw new Error("Could not load words.json");
            }

            return response.json();
        })
        .then(function(data)
        {
            game.words = data;
            createLetterButtons();
            startNewGame();
        })
        .catch(function(error)
        {
            console.error(error);
            messageArea.textContent = "Game data could not be loaded.";
            guessButton.disabled = true;
            letterInput.disabled = true;
        });
}

/*
    startNewGame()
    This function resets the game state and starts a brand new round.
    It chooses a random word and hint, clears previous guesses,
    resets the display, and enables the controls again.
*/
function startNewGame()
{
    const randomIndex = Math.floor(Math.random() * game.words.length);
    const randomEntry = game.words[randomIndex];

    game.selectedWord = randomEntry.word.toLowerCase();
    game.selectedHint = randomEntry.hint;
    game.correctLetters = [];
    game.wrongLetters = [];
    game.isOver = false;

    hintText.textContent = game.selectedHint;
    wrongCount.textContent = "0";
    guessedLettersText.textContent = "None yet";
    messageArea.textContent = "Start guessing!";
    letterInput.value = "";
    letterInput.disabled = false;
    guessButton.disabled = false;

    resetLetterButtons();
    updateWordDisplay();
    updateHangmanImage();
    letterInput.focus();
}

/*
    updateWordDisplay()
    This function updates the word area on the page.
    It shows correctly guessed letters in their proper positions,
    and shows underscores for letters that have not been guessed yet.
*/
function updateWordDisplay()
{
    let display = "";

    for (let i = 0; i < game.selectedWord.length; i++)
    {
        const currentLetter = game.selectedWord[i];

        if (game.correctLetters.includes(currentLetter))
        {
            display += currentLetter.toUpperCase() + " ";
        }
        else
        {
            display += "_ ";
        }
    }

    wordDisplay.textContent = display.trim();
}

/*
    updateHangmanImage()
    This function updates the hangman image based on the number of wrong guesses.
    It also restarts the fade-in animation each time the image changes.
*/
function updateHangmanImage()
{
    const imageIndex = game.wrongLetters.length;
    hangmanImage.src = game.hangmanImages[imageIndex];

    hangmanImage.classList.remove("fade-in");
    void hangmanImage.offsetWidth;
    hangmanImage.classList.add("fade-in");
}

/*
    updateGuessedLetters()
    This function displays all guessed letters on the page.
    It combines correct and wrong guesses into one list and sorts them alphabetically.
*/
function updateGuessedLetters()
{
    const allLetters = game.correctLetters.concat(game.wrongLetters);
    allLetters.sort();

    if (allLetters.length === 0)
    {
        guessedLettersText.textContent = "None yet";
    }
    else
    {
        guessedLettersText.textContent = allLetters.join(", ").toUpperCase();
    }
}

/*
    createLetterButtons()
    This function creates the clickable A-Z buttons shown in the letter board.
    Each button sends its letter to processGuess() when clicked.
*/
function createLetterButtons()
{
    letterBoard.innerHTML = "";

    for (let i = 65; i <= 90; i++)
    {
        const letter = String.fromCharCode(i).toLowerCase();
        const button = document.createElement("button");

        button.type = "button";
        button.className = "letter-button";
        button.textContent = letter.toUpperCase();
        button.dataset.letter = letter;

        button.addEventListener("click", function()
        {
            processGuess(letter);
        });

        letterBoard.appendChild(button);
    }
}

/*
    resetLetterButtons()
    This function re-enables all A-Z buttons for a new game
    and removes their used styling.
*/
function resetLetterButtons()
{
    const buttons = letterBoard.querySelectorAll(".letter-button");

    buttons.forEach(function(button)
    {
        button.disabled = false;
        button.classList.remove("used");
    });
}

/*
    disableLetterButton(letter)
    This function disables one specific letter button after it has been guessed,
    so the player cannot choose the same letter again in the same game.
*/
function disableLetterButton(letter)
{
    const button = letterBoard.querySelector('[data-letter="' + letter + '"]');

    if (button)
    {
        button.disabled = true;
        button.classList.add("used");
    }
}

/*
    disableAllLetters()
    This function disables every letter button.
    It is used when the game is over so the player cannot continue guessing.
*/
function disableAllLetters()
{
    const buttons = letterBoard.querySelectorAll(".letter-button");

    buttons.forEach(function(button)
    {
        button.disabled = true;
    });
}

/*
    isValidLetter(letter)
    This function checks whether the player's input is exactly one letter from A to Z.
    It returns true for valid input and false for invalid input.
*/
function isValidLetter(letter)
{
    return /^[a-z]$/.test(letter);
}

/*
    processGuess(letter)
    This function handles the main game logic for one guessed letter.
    It validates the input, checks whether the letter was already guessed,
    adds the letter to the correct or wrong list, updates the display,
    and then checks if the game has been won or lost.
*/
function processGuess(letter)
{
    if (game.isOver)
    {
        messageArea.textContent = "Game over. Click Play Again to start a new game.";
        return;
    }

    if (!isValidLetter(letter))
    {
        messageArea.textContent = "Please enter one letter from A to Z.";
        letterInput.value = "";
        letterInput.focus();
        return;
    }

    if (game.correctLetters.includes(letter) || game.wrongLetters.includes(letter))
    {
        messageArea.textContent = "You already guessed that letter.";
        letterInput.value = "";
        letterInput.focus();
        return;
    }

    if (game.selectedWord.includes(letter))
    {
        game.correctLetters.push(letter);
        messageArea.textContent = 'Good guess! "' + letter.toUpperCase() + '" is in the word.';
    }
    else
    {
        game.wrongLetters.push(letter);
        messageArea.textContent = 'Sorry, "' + letter.toUpperCase() + '" is not in the word.';
    }

    disableLetterButton(letter);
    updateWordDisplay();
    updateHangmanImage();
    updateGuessedLetters();
    wrongCount.textContent = game.wrongLetters.length.toString();
    checkGameOver();

    letterInput.value = "";
    letterInput.focus();
}

/*
    checkGameOver()
    This function checks whether the player has won or lost the game.
    The player wins if every letter in the word has been guessed.
    The player loses if the number of wrong guesses reaches the maximum allowed.
*/
function checkGameOver()
{
    let allFound = true;

    for (let i = 0; i < game.selectedWord.length; i++)
    {
        if (!game.correctLetters.includes(game.selectedWord[i]))
        {
            allFound = false;
            break;
        }
    }

    if (allFound)
    {
        game.isOver = true;
        messageArea.textContent = "You won the game!";
        disableGameControls();
        return;
    }

    if (game.wrongLetters.length >= game.maxWrong)
    {
        game.isOver = true;
        wordDisplay.textContent = game.selectedWord.toUpperCase().split("").join(" ");
        messageArea.textContent = 'You lost the game! The word was "' + game.selectedWord.toUpperCase() + '".';
        disableGameControls();
    }
}

/*
    disableGameControls()
    This function disables the text input, guess button, and all letter buttons.
    It is called when the game ends so the player must click Play Again
    before starting a new round.
*/
function disableGameControls()
{
    letterInput.disabled = true;
    guessButton.disabled = true;
    disableAllLetters();
}


// -------------------------
// EVENT LISTENERS
// -------------------------

/*
    Guess button click event
    This event reads the typed letter from the input box
    and sends it to processGuess().
*/
guessButton.addEventListener("click", function()
{
    const letter = letterInput.value.trim().toLowerCase();
    processGuess(letter);
});

/*
    Letter input keydown event
    This event allows the player to press Enter
    instead of clicking the Guess button.
*/
letterInput.addEventListener("keydown", function(event)
{
    if (event.key === "Enter")
    {
        const letter = letterInput.value.trim().toLowerCase();
        processGuess(letter);
    }
});

/*
    Play Again button click event
    This event starts a brand new game when the player clicks Play Again.
*/
playAgainButton.addEventListener("click", function()
{
    startNewGame();
});


// -------------------------
// START GAME
// -------------------------

/*
    Start the game by loading the JSON word list.
*/
loadWords();