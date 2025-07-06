// wordle.js - MVP Scaffold

document.addEventListener('DOMContentLoaded', () => {
  // DOM Elements
  const grid = document.getElementById('game-grid');
  const keyboard = document.getElementById('keyboard');
  const guessCounter = document.getElementById('guess-counter');
  const feedback = document.getElementById('feedback');

  // Game State
  let currentRow = 0;
  let currentCol = 0;
  let guesses = Array.from({ length: 6 }, () => Array(5).fill(''));
  let gameState = 'active'; // 'active', 'won', 'lost', 'waiting'

  // --- Game Logic Variables ---
  let targetWord = '';
  let usedKeys = {}; // {A: 'correct'|'present'|'absent'}
  let feedbacks = Array.from({ length: 6 }, () => Array(5).fill(null)); // Store feedback for each row

  // --- Utility Functions ---
  function pickDailyWord() {
    // Random word selection - different every time you reload
    const randomIndex = Math.floor(Math.random() * WORDS.length);
    const selectedWord = WORDS[randomIndex].toUpperCase();
    
    // Debug logging
    console.log('Random word selected at index:', randomIndex);
    console.log('Selected word:', selectedWord);
    
    return selectedWord;
  }

  function isValidWord(word) {
    return WORDS.includes(word.toLowerCase());
  }

  function updateGuessCounter() {
    guessCounter.textContent = `${currentRow + 1}/6`;
  }

  function updateKeyboard() {
    // Update key classes based on usedKeys
    document.querySelectorAll('.key').forEach(btn => {
      const key = btn.getAttribute('data-key').toUpperCase();
      btn.classList.remove('correct', 'present', 'absent');
      if (usedKeys[key]) btn.classList.add(usedKeys[key]);
    });
  }

  function giveFeedback(guess) {
    // Returns array: 'correct', 'present', 'absent' for each letter
    const result = Array(5).fill('absent');
    const targetArr = targetWord.split('');
    const guessArr = guess.split('');
    const used = Array(5).fill(false);
    // First pass: correct
    for (let i = 0; i < 5; i++) {
      if (guessArr[i] === targetArr[i]) {
        result[i] = 'correct';
        used[i] = true;
      }
    }
    // Second pass: present
    for (let i = 0; i < 5; i++) {
      if (result[i] === 'correct') continue;
      for (let j = 0; j < 5; j++) {
        if (!used[j] && guessArr[i] === targetArr[j]) {
          result[i] = 'present';
          used[j] = true;
          break;
        }
      }
    }
    return result;
  }

  function revealRow(row, feedbackArr) {
    feedbacks[row] = feedbackArr.slice(); // Store feedback for this row
    for (let col = 0; col < 5; col++) {
      const idx = row * 5 + col;
      const tile = grid.children[idx];
      const letter = guesses[row][col];
      // Remove previous animation and feedback classes
      tile.classList.remove('correct', 'present', 'absent', 'flip');
      // Stagger flip animation
      setTimeout(() => {
        tile.classList.add('flip');
        // Hide letter at halfway point
        setTimeout(() => {
          tile.textContent = '';
        }, 150);
        // Reveal color and letter at end of flip
        setTimeout(() => {
          tile.classList.remove('flip');
          tile.classList.add(feedbackArr[col]);
          tile.textContent = letter;
          if (["correct","present","absent"].includes(feedbackArr[col])) {
            tile.style.color = "#fff";
          } else {
            tile.style.color = "#222";
          }
        }, 300);
      }, col * 300);
    }
  }

  function updateUsedKeys(guess, feedbackArr) {
    for (let i = 0; i < 5; i++) {
      const letter = guess[i];
      const prev = usedKeys[letter];
      const curr = feedbackArr[i];
      if (prev === 'correct') continue;
      if (prev === 'present' && curr === 'absent') continue;
      usedKeys[letter] = curr;
    }
  }

  // --- Input Handling ---
  function handleKeyInput(key) {
    if (gameState !== 'active') return;
    key = key.toUpperCase();
    if (key === 'BACKSPACE' || key === 'BACK') {
      if (currentCol > 0) {
        currentCol--;
        guesses[currentRow][currentCol] = '';
        renderGrid();
      }
      return;
    }
    if (key === 'ENTER') {
      const guess = guesses[currentRow].join('');
      if (guess.length < 5) {
        showFeedback('Not enough letters', 'error', 2000);
        return;
      }
      if (!isValidWord(guess)) {
        showFeedback('Not in word list', 'error', 2000);
        return;
      }
      // Feedback
      const feedbackArr = giveFeedback(guess);
      revealRow(currentRow, feedbackArr);
      updateUsedKeys(guess, feedbackArr);
      updateKeyboard();
      if (guess === targetWord) {
        gameState = 'won';
        showFeedback('🎉 You win! 🎉', 'success', 0);
        updateGuessCounter();
        return;
      }
      currentRow++;
      currentCol = 0;
      updateGuessCounter();
      if (currentRow === 6) {
        gameState = 'lost';
        showFeedback(`Game Over! The word was ${targetWord}`, 'error', 0);
        showCorrectAnswer();
        
        // Also reveal the correct word in the last row for visual confirmation
        setTimeout(() => {
          revealCorrectWord();
        }, 1000);
        
        return;
      }
      hideFeedback();
      // Delay renderGrid until after the last tile's flip animation
      setTimeout(() => {
        renderGrid();
      }, 5 * 300 + 50); // 5 tiles * 300ms per flip + small buffer
      return;
    }
    if (/^[A-Z]$/.test(key) && currentCol < 5) {
      guesses[currentRow][currentCol] = key;
      currentCol++;
      renderGrid();
    }
  }

  // --- Event Listeners ---
  keyboard.addEventListener('click', e => {
    if (e.target.classList.contains('key')) {
      handleKeyInput(e.target.getAttribute('data-key'));
    }
  });
  document.addEventListener('keydown', e => {
    let key = e.key;
    if (key === 'Backspace') key = 'BACK';
    if (key === 'Enter') key = 'ENTER';
    handleKeyInput(key);
  });

  // --- Init ---
  function startGame() {
    // Clear any existing correct answer display
    const existingAnswer = document.getElementById('correct-answer');
    if (existingAnswer) {
      existingAnswer.remove();
    }
    
    targetWord = pickDailyWord();
    usedKeys = {};
    currentRow = 0;
    currentCol = 0;
    guesses = Array.from({ length: 6 }, () => Array(5).fill(''));
    feedbacks = Array.from({ length: 6 }, () => Array(5).fill(null));
    gameState = 'active';
    renderGrid();
    renderKeyboard();
    updateGuessCounter();
    hideFeedback();
  }

  startGame();

  // Render Game Grid
  function renderGrid() {
    grid.innerHTML = '';
    for (let row = 0; row < 6; row++) {
      for (let col = 0; col < 5; col++) {
        const tile = document.createElement('div');
        tile.className = 'tile';
        tile.setAttribute('data-row', row);
        tile.setAttribute('data-col', col);
        tile.setAttribute('aria-label', `Row ${row + 1} Column ${col + 1}`);
        tile.textContent = guesses[row][col] || '';
        // Apply feedback class if available
        const feedback = feedbacks[row][col];
        tile.classList.remove('correct', 'present', 'absent');
        if (["correct","present","absent"].includes(feedback)) {
          tile.classList.add(feedback);
          tile.style.color = "#fff";
        } else {
          tile.style.color = guesses[row][col] ? '#222' : '#222';
        }
        grid.appendChild(tile);
      }
    }
  }

  // Render Virtual Keyboard
  function renderKeyboard() {
    // Official Wordle layout
    const rows = [
      ['Q','W','E','R','T','Y','U','I','O','P'],
      ['A','S','D','F','G','H','J','K','L'],
      ['ENTER','Z','X','C','V','B','N','M','BACK']
    ];
    keyboard.innerHTML = '';
    rows.forEach(row => {
      const rowDiv = document.createElement('div');
      rowDiv.className = 'keyboard-row';
      row.forEach(key => {
        const btn = document.createElement('button');
        btn.className = 'key';
        btn.setAttribute('data-key', key);
        btn.setAttribute('aria-label', key);
        btn.textContent = key === 'BACK' ? '⌫' : key;
        if (key === 'ENTER' || key === 'BACK') btn.classList.add('wide');
        rowDiv.appendChild(btn);
      });
      keyboard.appendChild(rowDiv);
    });
  }

  // Enhanced Feedback System
  function showFeedback(msg, type = 'info', duration = 3000) {
    // Clear any existing timeout
    if (feedback.timeout) {
      clearTimeout(feedback.timeout);
    }
    
    // Remove all existing classes
    feedback.classList.remove('show', 'error', 'success', 'info', 'shake');
    
    // Set message
    feedback.textContent = msg;
    
    // Add appropriate class based on type
    if (type === 'error') {
      feedback.classList.add('error', 'shake');
    } else if (type === 'success') {
      feedback.classList.add('success');
    } else {
      feedback.classList.add('info');
    }
    
    // Show the message with animation
    setTimeout(() => {
      feedback.classList.add('show');
    }, 10);
    
    // Auto-hide after duration (unless it's a success message)
    if (type !== 'success' && duration > 0) {
      feedback.timeout = setTimeout(() => {
        hideFeedback();
      }, duration);
    }
  }
  
  function hideFeedback() {
    feedback.classList.remove('show');
    if (feedback.timeout) {
      clearTimeout(feedback.timeout);
      feedback.timeout = null;
    }
  }
  
  function showCorrectAnswer() {
    console.log('Showing correct answer:', targetWord); // Debug log
    
    // Create a special display for the correct answer
    const correctAnswerDiv = document.createElement('div');
    correctAnswerDiv.id = 'correct-answer';
    correctAnswerDiv.className = 'correct-answer-display';
    
    const answerText = document.createElement('div');
    answerText.className = 'answer-text';
    answerText.textContent = 'The correct word was:';
    
    const answerWord = document.createElement('div');
    answerWord.className = 'answer-word';
    answerWord.textContent = targetWord;
    
    correctAnswerDiv.appendChild(answerText);
    correctAnswerDiv.appendChild(answerWord);
    
    // Insert after the game grid
    const gameGrid = document.getElementById('game-grid');
    if (gameGrid && gameGrid.parentNode) {
      gameGrid.parentNode.insertBefore(correctAnswerDiv, gameGrid.nextSibling);
      
      // Animate in
      setTimeout(() => {
        correctAnswerDiv.classList.add('show');
        console.log('Correct answer display added and animated'); // Debug log
      }, 100);
    } else {
      console.error('Could not find game grid to insert correct answer'); // Debug log
    }
  }
  
  function revealCorrectWord() {
    // Fill the last row with the correct word and show it as all correct
    const lastRow = 5; // 6th row (0-indexed)
    const targetArr = targetWord.split('');
    
    // Update the guesses array
    for (let col = 0; col < 5; col++) {
      guesses[lastRow][col] = targetArr[col];
    }
    
    // Update the feedback array
    for (let col = 0; col < 5; col++) {
      feedbacks[lastRow][col] = 'correct';
    }
    
    // Re-render the grid to show the correct word
    renderGrid();
    
    console.log('Correct word revealed in grid:', targetWord); // Debug log
  }

  // --- Dark Theme Toggle ---
  (function() {
    const body = document.body;
    const toggleBtn = document.getElementById('theme-toggle');
    let iconWrapper = document.getElementById('theme-icon-wrapper');

    // SVGs for sun and moon
    const sunSVG = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="5"/><path d="M12 1v2m0 18v2m11-11h-2M3 12H1m16.95 6.95-1.41-1.41M6.34 6.34 4.93 4.93m12.02 0-1.41 1.41M6.34 17.66l-1.41 1.41"/></svg>';
    const moonSVG = '<svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 12.79A9 9 0 1 1 11.21 3a7 7 0 0 0 9.79 9.79z"/></svg>';

    function setTheme(dark) {
      if (dark) {
        body.classList.add('dark-theme');
        if (iconWrapper) iconWrapper.innerHTML = moonSVG;
        localStorage.setItem('wordleTheme', 'dark');
      } else {
        body.classList.remove('dark-theme');
        if (iconWrapper) iconWrapper.innerHTML = sunSVG;
        localStorage.setItem('wordleTheme', 'light');
      }
    }

    // On load, set theme from localStorage
    const saved = localStorage.getItem('wordleTheme');
    setTheme(saved === 'dark');

    // Re-select iconWrapper after innerHTML replacement
    function updateIconWrapper() {
      iconWrapper = document.getElementById('theme-icon-wrapper');
    }

    if (toggleBtn) {
      toggleBtn.addEventListener('click', function() {
        const isDark = body.classList.contains('dark-theme');
        setTheme(!isDark);
        // update iconWrapper reference
        setTimeout(updateIconWrapper, 10);
      });
    }
  })();

  // TODO: Add event listeners for keyboard and physical input
  // TODO: Implement game logic, state transitions, feedback, local storage, etc.
}); 