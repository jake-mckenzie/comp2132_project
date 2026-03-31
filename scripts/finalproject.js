// GAME DATA OBJECT
/*
    This object stores all game data and settings in one place.
*/
const game =
{
    // Array of word/hint objects loaded from the JSON file.
    words: [],

    // The current word the player is trying to guess.
    selectedWord: "",

    // The hint that matches the selected word.
    selectedHint: "",

    // Array of correctly guessed letters.
    correctLetters: [],

    // Array of incorrectly guessed letters.
    wrongLetters: [],

    // Maximum number of wrong guesses allowed before the player loses.
    maxWrong: 6,

    // Tracks whether the current game has ended.
    isOver: false,

    // Array of image file paths for each hangman stage.
    hangmanImages:
    [
        "../images/hangman-0.png",
        "../images/hangman-1.png",
        "../images/hangman-2.png",
        "../images/hangman-3.png",
        "../images/hangman-4.png",
        "../images/hangman-5.png",
        "../images/hangman-6.png"
    ]
};


// PAGE ELEMENTS

// The page element that shows the hidden word with guessed letters revealed.
const wordDisplay = document.getElementById("word-display");

// The page element that displays the hint for the current word.
const hintText = document.getElementById("hint-text");

// The page element that displays the number of wrong guesses.
const wrongCount = document.getElementById("wrong-count");

// The page element that shows all letters the player has guessed.
const guessedLettersText = document.getElementById("guessed-letters");

// The page element used to show feedback messages to the player.
const messageArea = document.getElementById("message-area");

// The page element that displays the current hangman image.
const hangmanImage = document.getElementById("hangman-image");

// The button the player clicks to reset the game and begin a new round.
const playAgainButton = document.getElementById("play-again-button");

// The container that holds the clickable A-Z letter buttons.
const letterBoard = document.getElementById("letter-board");


// FUNCTIONS

/*
    This function loads the word and hint data from the JSON file using fetch().
    Once the JSON data is loaded, it stores the words in the game object,
    creates the letter buttons, and starts the first game.
*/
function loadWords()
{
    fetch("../data/words.json")
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
            disableAllLetters();
        });
}

/*
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
    messageArea.textContent = "Click a letter to start guessing!";

    resetLetterButtons();
    updateWordDisplay();
    updateHangmanImage();
}

/*
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
    This function updates the hangman image based on the number of wrong guesses.
    It also restarts the fade-in animation each time the image changes
    and updates the alt text based on the image filename.
*/
function updateHangmanImage()
{
    const imageIndex = game.wrongLetters.length;
    const imagePath = game.hangmanImages[imageIndex];
    const fileName = imagePath.split("/").pop();

    hangmanImage.src = imagePath;
    hangmanImage.alt = "Hangman drawing stage " + imageIndex;

    hangmanImage.classList.remove("fade-in");
    void hangmanImage.offsetWidth;
    hangmanImage.classList.add("fade-in");
}

/*
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
    This function handles the main game logic for one guessed letter.
    It checks whether the letter was already guessed,
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

    if (game.correctLetters.includes(letter) || game.wrongLetters.includes(letter))
    {
        messageArea.textContent = "You already guessed that letter.";
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
}

/*
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
    This function disables all letter buttons.
    It is called when the game ends so the player must click Play Again
    before starting a new round.
*/
function disableGameControls()
{
    disableAllLetters();
}


// EVENT LISTENERS

/*
    This event starts a brand new game when the player clicks Play Again.
*/
playAgainButton.addEventListener("click", function()
{
    startNewGame();
});

// START GAME

/*
    Start the game by loading the JSON word list.
*/
loadWords();