// Configuration
const WORD_LENGTH_EQUIVALENT = 5;

// Éléments DOM
const elements = {
    modeSelect: document.getElementById("mode"),
    timeSelect: document.getElementById("time"),
    restartBtn: document.getElementById("restart-btn"),
    wordDisplay: document.getElementById("word-display"),
    inputField: document.getElementById("input-field"),
    timeDisplay: document.getElementById("time-display"),
    wpmDisplay: document.getElementById("wpm"),
    accuracyDisplay: document.getElementById("accuracy"),
    correctDisplay: document.getElementById("correct"),
    errorsDisplay: document.getElementById("errors")
};

// Dictionnaires de mots
const wordDictionaries = {
    easy: ["pomme", "banane", "fraise", "orange", "kiwi", "fruit", "melon", "pêche", "poire", "raisin"],
    medium: ["clavier", "écran", "souris", "chargeur", "batterie", "portable", "ordinateur", "téléphone", "imprimante", "casque"],
    hard: ["programmation", "développement", "algorithmique", "architecture", "javascript", "ordinateur", "interface", "système", "application", "réseau"]
};

// État du jeu
const gameState = {
    startTime: null,
    timer: null,
    timeLeft: 60,
    isRunning: false,
    isZenMode: false,
    currentWordIndex: 0,
    currentCharIndex: 0,
    wordsToType: [],
    correctChars: 0,
    totalTypedChars: 0,
    errors: 0,
    correctWords: 0,
    lastCorrect: true // Pour suivre si le dernier caractère était correct
};

// Initialisation du jeu
function initGame() {
    clearInterval(gameState.timer);
    
    gameState.wordsToType = [];
    gameState.currentWordIndex = 0;
    gameState.currentCharIndex = 0;
    gameState.startTime = null;
    gameState.isRunning = false;
    gameState.timeLeft = parseInt(elements.timeSelect.value);
    gameState.isZenMode = gameState.timeLeft === 0;
    gameState.correctChars = 0;
    gameState.totalTypedChars = 0;
    gameState.errors = 0;
    gameState.correctWords = 0;
    gameState.lastCorrect = true;
    
    elements.timeDisplay.textContent = gameState.isZenMode ? "∞" : gameState.timeLeft;
    elements.wpmDisplay.textContent = "0";
    elements.accuracyDisplay.textContent = "100";
    elements.correctDisplay.textContent = "0";
    elements.errorsDisplay.textContent = "0";
    
    // Génération des mots
    for (let i = 0; i < 50; i++) {
        gameState.wordsToType.push(getRandomWord(elements.modeSelect.value));
    }
    
    renderWords();
    elements.inputField.value = "";
    elements.inputField.disabled = false;
    elements.inputField.focus();
}

// Obtient un mot aléatoire selon le mode
function getRandomWord(mode) {
    const wordList = wordDictionaries[mode];
    return wordList[Math.floor(Math.random() * wordList.length)];
}

// Affiche les mots à l'écran avec coloration des caractères
function renderWords() {
    elements.wordDisplay.innerHTML = "";
    
    gameState.wordsToType.forEach((word, wordIndex) => {
        const wordSpan = document.createElement("span");
        wordSpan.className = "word";
        
        if (wordIndex === gameState.currentWordIndex) {
            wordSpan.classList.add("active");
        }
        
        // Crée des spans pour chaque caractère
        word.split("").forEach((char, charIndex) => {
            const charSpan = document.createElement("span");
            charSpan.className = "char";
            charSpan.textContent = char;
            
            // Coloration des caractères
            if (wordIndex < gameState.currentWordIndex) {
                // Mots déjà complétés (tous corrects)
                charSpan.classList.add("correct");
            } else if (wordIndex === gameState.currentWordIndex) {
                // Mot en cours
                if (charIndex < gameState.currentCharIndex) {
                    // Caractères déjà tapés
                    const typedChar = elements.inputField.value[charIndex];
                    if (typedChar === char) {
                        charSpan.classList.add("correct");
                    } else {
                        charSpan.classList.add("incorrect");
                    }
                }
            }
            
            wordSpan.appendChild(charSpan);
        });
        
        elements.wordDisplay.appendChild(wordSpan);
        elements.wordDisplay.appendChild(document.createTextNode(" "));
    });
}

// Démarre le timer
function startTimer() {
    if (!gameState.isRunning && !gameState.isZenMode) {
        gameState.isRunning = true;
        gameState.startTime = Date.now();
        
        gameState.timer = setInterval(() => {
            gameState.timeLeft--;
            elements.timeDisplay.textContent = gameState.timeLeft;
            
            if (gameState.timeLeft <= 0) {
                endGame();
            }
        }, 1000);
    }
}

// Calcule les statistiques avec la nouvelle règle de précision
function calculateStats() {
    if (!gameState.startTime) return { wpm: 0, accuracy: 100 };
    
    const elapsedTime = (Date.now() - gameState.startTime) / 1000;
    const minutes = elapsedTime / 60;
    const totalWords = gameState.correctChars / WORD_LENGTH_EQUIVALENT;
    const wpm = minutes > 0 ? totalWords / minutes : 0;
    
    // Nouveau calcul de précision : 100% si tout est correct, sinon pourcentage réel
    let accuracy;
    if (gameState.totalTypedChars === 0) {
        accuracy = 100;
    } else {
        accuracy = (gameState.correctChars / gameState.totalTypedChars) * 100;
        // Si le dernier caractère est correct et qu'il n'y a pas d'erreurs, 100%
        if (gameState.lastCorrect && gameState.errors === 0) {
            accuracy = 100;
        }
    }
    
    return { 
        wpm: Math.round(wpm),
        accuracy: Math.round(accuracy)
    };
}

// Met à jour les statistiques affichées
function updateStats() {
    const { wpm, accuracy } = calculateStats();
    elements.wpmDisplay.textContent = wpm;
    elements.accuracyDisplay.textContent = accuracy;
    elements.correctDisplay.textContent = gameState.correctWords;
    elements.errorsDisplay.textContent = gameState.errors;
}

// Gère la saisie de l'utilisateur
function handleInput() {
    startTimer();
    
    const typedWord = elements.inputField.value;
    const targetWord = gameState.wordsToType[gameState.currentWordIndex];
    gameState.currentCharIndex = typedWord.length;
    
    // Vérifie si le dernier caractère est correct
    if (typedWord.length > 0) {
        const lastTypedChar = typedWord[typedWord.length - 1];
        const targetChar = targetWord[typedWord.length - 1];
        gameState.lastCorrect = lastTypedChar === targetChar;
        
        if (!gameState.lastCorrect) {
            gameState.errors++;
        }
    }
    
    // Vérifie si le mot est complété
    if (typedWord === targetWord + " ") {
        gameState.correctChars += targetWord.length;
        gameState.totalTypedChars += targetWord.length;
        gameState.correctWords++;
        
        gameState.currentWordIndex++;
        gameState.currentCharIndex = 0;
        elements.inputField.value = "";
        gameState.lastCorrect = true; // Réinitialise pour le nouveau mot
        
        // Ajoute plus de mots si nécessaire
        if (gameState.currentWordIndex > gameState.wordsToType.length - 10) {
            for (let i = 0; i < 10; i++) {
                gameState.wordsToType.push(getRandomWord(elements.modeSelect.value));
            }
        }
    } else {
        // Compte les caractères corrects
        let correct = 0;
        for (let i = 0; i < typedWord.length && i < targetWord.length; i++) {
            if (typedWord[i] === targetWord[i]) correct++;
        }
        
        gameState.correctChars = gameState.correctChars - (gameState.currentCharIndex - correct) + correct;
        gameState.totalTypedChars = gameState.totalTypedChars - gameState.currentCharIndex + typedWord.length;
    }
    
    renderWords();
    updateStats();
}

// Termine la partie
function endGame() {
    clearInterval(gameState.timer);
    gameState.isRunning = false;
    elements.inputField.disabled = true;
    
    // Affiche les résultats finaux
    const { wpm, accuracy } = calculateStats();
    setTimeout(() => {
        alert(`Test terminé !\nMots/min: ${wpm}\nPrécision: ${accuracy}%\nMots corrects: ${gameState.correctWords}\nErreurs: ${gameState.errors}`);
    }, 100);
}

// Événements
elements.inputField.addEventListener("input", handleInput);
elements.modeSelect.addEventListener("change", initGame);
elements.timeSelect.addEventListener("change", initGame);
elements.restartBtn.addEventListener("click", initGame);

// Initialisation
initGame();