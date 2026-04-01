// PAGE ELEMENTS
const wordDisplay = document.getElementById("word-display");
const hintText = document.getElementById("hint-text");
const wrongCount = document.getElementById("wrong-count");
const guessedLettersText = document.getElementById("guessed-letters");
const messageArea = document.getElementById("message-area");
const hangmanImage = document.getElementById("hangman-image");
const playAgainButton = document.getElementById("play-again-button");
const letterBoard = document.getElementById("letter-board");

// GAME DATA OBJECT
//Stores all game data and settings in one place
const game =
{    
    words: [], // Array of word/hint objects loaded from the JSON file    
    selectedWord: "", // The current word the player is trying to guess    
    selectedHint: "", // The hint that matches the selected word    
    correctLetters: [], // Array of correctly guessed letters    
    wrongLetters: [], // Array of incorrectly guessed letters    
    maxWrong: 6, // Maximum number of wrong guesses allowed before the player loses    
    isOver: false, // Tracks whether the current game has ended    
    hangmanImages: // Array of image file paths for each hangman stage
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


// FUNCTIONS

//Loads the word and hint data from the JSON file using fetch()
//Once the JSON data is loaded,
//it stores the words in the game object,
//creates the letter buttons,
//and starts the first game
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

//Resets the game state and starts a brand new round
//Chooses a random word and hint,
// clears previous guesses,
// resets the display,
// and enables the controls again
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
    messageArea.classList.remove("wrong-highlight", "right-highlight");

    resetLetterButtons();
    updateWordDisplay();
    updateHangmanImage();
}

//Updates the word area on the page
//Shows correctly guessed letters, 
//and underscores for letters that have not been guessed yet
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

//Updates the hangman image based on the number of wrong guesses
//Restarts the fade-in animation each time the image changes
//and updates the alt text
function updateHangmanImage()
{
    const imageIndex = game.wrongLetters.length;
    const imagePath = game.hangmanImages[imageIndex];

    hangmanImage.src = imagePath;
    hangmanImage.alt = "Hangman drawing stage " + imageIndex;

    hangmanImage.classList.remove("fade-in");
    void hangmanImage.offsetWidth;
    hangmanImage.classList.add("fade-in");
}

//Displays all guessed letters on the page
//Combines correct and wrong guesses into one list and sorts them alphabetically
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
        guessedLettersText.classList.add("wrong-highlight");
    }
}

//Creates the clickable A-Z buttons shown in the letter board
//Each button sends its letter to processGuess() when clicked
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

//Re-enables all A-Z buttons for a new game and removes their used styling
function resetLetterButtons()
{
    const buttons = letterBoard.querySelectorAll(".letter-button");

    buttons.forEach(function(button)
    {
        button.disabled = false;
        button.classList.remove("used");
    });
}

//Disables one specific letter button after it has been guessed,
//preventing player from selecting same letter in the same game
function disableLetterButton(letter)
{
    const button = letterBoard.querySelector('[data-letter="' + letter + '"]');

    if (button)
    {
        button.disabled = true;
        button.classList.add("used");
    }
}

//Disables every letter button
//Used when the game is over so the player cannot continue guessing
function disableAllLetters()
{
    const buttons = letterBoard.querySelectorAll(".letter-button");

    buttons.forEach(function(button)
    {
        button.disabled = true;
    });
}

//Handles the main game logic for one guessed letter
//Checks whether the letter was already guessed,
//adds the letter to the correct or wrong list, 
//updates the display,and then checks if the game has been won or lost
function processGuess(letter)
{
    if (game.isOver)
    {
        messageArea.textContent = "Game over. Click Play Again to start a new game.";
        messageArea.classList.toggle("wrong-highlight");
        return;
    }

    if (game.correctLetters.includes(letter) || game.wrongLetters.includes(letter))
    {
        messageArea.textContent = "You already guessed that letter.";
        messageArea.classList.toggle("wrong-highlight");
        return;
    }

    if (game.selectedWord.includes(letter))
    {
        game.correctLetters.push(letter);
        messageArea.textContent = 'Good guess! "' + letter.toUpperCase() + '" is in the word.';
        messageArea.classList.remove("wrong-highlight");
        messageArea.classList.add("right-highlight");
    }
    else
    {
        game.wrongLetters.push(letter);
        messageArea.textContent = 'Sorry, "' + letter.toUpperCase() + '" is not in the word.';
        messageArea.classList.remove("right-highlight");
        messageArea.classList.add("wrong-highlight");
    }

    disableLetterButton(letter);
    updateWordDisplay();
    updateHangmanImage();
    updateGuessedLetters();
    wrongCount.textContent = game.wrongLetters.length.toString();
    wrongCount.classList.add("wrong-highlight");
    checkGameOver();
}

//Checks whether the player has won or lost the game
//Player wins if every letter in the word has been guessed
//Player loses if the number of wrong guesses reaches the maximum allowed
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
        messageArea.classList.add("right-highlight");
        disableGameControls();
        return;
    }

    if (game.wrongLetters.length >= game.maxWrong)
    {
        game.isOver = true;
        wordDisplay.textContent = game.selectedWord.toUpperCase().split("").join(" ");
        messageArea.textContent = 'You lost the game! The word was "' + game.selectedWord.toUpperCase() + '".';
        messageArea.classList.add("wrong-highlight");
        disableGameControls();
    }
}

//Disables all letter buttons
//Called when the game ends so the player must click Play Again before starting a new round
function disableGameControls()
{
    disableAllLetters();
}


// EVENT LISTENERS
//Starts a brand new game when the player clicks Play Again
playAgainButton.addEventListener("click", function()
{
    startNewGame();
});

// START GAME
//Load the JSON word list
loadWords();