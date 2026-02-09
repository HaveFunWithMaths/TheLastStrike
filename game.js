/**
 * THE LAST STRIKE - Game Engine
 * A Nim-variant strategy game with perfect AI
 */

// =============================================
// GAME STATE MACHINE
// =============================================

const GamePhase = {
    CONFIG: 'config',
    PLAYING: 'playing',
    GAME_OVER: 'gameOver'
};

const PlayerTurn = {
    PLAYER1: 'player1',
    PLAYER2: 'player2'
};

const GameMode = {
    PVP: 'pvp',
    PVAI: 'pvai'
};

// =============================================
// GAME STATE
// =============================================

const state = {
    // Configuration
    totalSticks: 30,
    maxMove: 3,
    minMove: 1, // Fixed at 1
    mode: GameMode.PVAI,

    // Player names
    player1Name: 'PLAYER 1',
    player2Name: 'PLAYER 2',

    // Runtime
    phase: GamePhase.CONFIG,
    currentPlayer: PlayerTurn.PLAYER1,
    remainingSticks: 30,

    // Interaction
    highlightedCount: 0,
    isAnimating: false,

    // Stick data
    sticks: [],

    // Layout config
    groupsPerRow: 3 // Default, will be calculated
};

// =============================================
// DOM REFERENCES
// =============================================

const dom = {
    configPanel: document.getElementById('configPanel'),
    gameArena: document.getElementById('gameArena'),
    sticksBox: document.getElementById('sticksBox'),
    sticksContainer: document.getElementById('sticksContainer'),
    totalSticksInput: document.getElementById('totalSticksInput'),
    maxMoveInput: document.getElementById('maxMoveInput'),
    player1NameInput: document.getElementById('player1Name'),
    player2NameInput: document.getElementById('player2Name'),
    remainingValue: document.getElementById('remainingValue'),
    turnPlayer: document.getElementById('turnPlayer'),
    ambientGlow: document.getElementById('ambientGlow'),
    gameOverOverlay: document.getElementById('gameOverOverlay'),
    winnerText: document.getElementById('winnerText'),
    slashOverlay: document.getElementById('slashOverlay'),
    startBtn: document.getElementById('startBtn'),
    homeBtn: document.getElementById('homeBtn'),
    resetBtn: document.getElementById('resetBtn'),
    playAgainBtn: document.getElementById('playAgainBtn')
};

// =============================================
// CONFIGURATION HANDLERS
// =============================================

function initConfigHandlers() {
    // Config buttons (+ and -)
    document.querySelectorAll('.config-btn').forEach(btn => {
        btn.addEventListener('click', handleConfigChange);
    });

    // Typeable inputs
    dom.totalSticksInput.addEventListener('input', handleInputChange);
    dom.totalSticksInput.addEventListener('blur', validateInputs);
    dom.maxMoveInput.addEventListener('input', handleInputChange);
    dom.maxMoveInput.addEventListener('blur', validateInputs);

    // Mode buttons
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', handleModeChange);
    });

    // Start button
    dom.startBtn.addEventListener('click', startGame);

    // Home button
    dom.homeBtn.addEventListener('click', resetToConfig);

    // Reset button
    dom.resetBtn.addEventListener('click', resetGame);

    // Play again button
    dom.playAgainBtn.addEventListener('click', resetToConfig);
}

function handleConfigChange(e) {
    const action = e.target.dataset.action;
    const target = e.target.dataset.target;

    if (target === 'totalSticks') {
        let value = parseInt(dom.totalSticksInput.value) || 20;
        if (action === 'increase' && value < 100) {
            value++;
        } else if (action === 'decrease' && value > 5) {
            value--;
        }
        state.totalSticks = value;
        dom.totalSticksInput.value = value;
    } else if (target === 'maxMove') {
        let value = parseInt(dom.maxMoveInput.value) || 3;
        if (action === 'increase' && value < 10) {
            value++;
        } else if (action === 'decrease' && value > 2) {
            value--;
        }
        state.maxMove = value;
        dom.maxMoveInput.value = value;
    }
}

function handleInputChange(e) {
    const input = e.target;
    let value = parseInt(input.value);

    if (input.id === 'totalSticksInput') {
        if (!isNaN(value)) state.totalSticks = value;
    } else if (input.id === 'maxMoveInput') {
        if (!isNaN(value)) state.maxMove = value;
    }
}

function validateInputs() {
    // Validate totalSticks
    let n = parseInt(dom.totalSticksInput.value);
    if (isNaN(n) || n < 5) n = 5;
    if (n > 100) n = 100;
    state.totalSticks = n;
    dom.totalSticksInput.value = n;

    // Validate maxMove
    let m = parseInt(dom.maxMoveInput.value);
    if (isNaN(m) || m < 2) m = 2;
    if (m > 10) m = 10;
    state.maxMove = m;
    dom.maxMoveInput.value = m;
}

function handleModeChange(e) {
    const mode = e.target.dataset.mode;
    state.mode = mode === 'pvp' ? GameMode.PVP : GameMode.PVAI;

    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });
}

// =============================================
// LAYOUT CALCULATIONS
// =============================================

function calculateGridLayout(totalSticks) {
    const sticksPerGroup = 5;
    const totalGroups = Math.ceil(totalSticks / sticksPerGroup);

    // Find the best square-ish layout
    // For 9 groups -> 3x3, for 4 groups -> 2x2, etc.
    // Use ceiling of square root for columns

    let cols;
    const sqrt = Math.sqrt(totalGroups);

    // Perfect squares: use sqrt directly
    if (Number.isInteger(sqrt)) {
        cols = sqrt;
    } else {
        // For non-perfect squares, find best fit
        cols = Math.ceil(sqrt);
    }

    // Adjust for mobile - max 3 columns
    const isMobile = window.innerWidth < 600;
    if (isMobile) {
        cols = Math.min(cols, 3);
    }

    // Ensure at least 2 columns
    cols = Math.max(2, cols);

    return {
        groupsPerRow: cols,
        totalGroups: totalGroups
    };
}

// =============================================
// GAME FLOW
// =============================================

function startGame() {
    validateInputs();

    // Get player names
    state.player1Name = dom.player1NameInput.value.trim().toUpperCase() || 'PLAYER 1';
    state.player2Name = dom.player2NameInput.value.trim().toUpperCase() || (state.mode === GameMode.PVAI ? 'AI' : 'PLAYER 2');

    state.phase = GamePhase.PLAYING;
    state.remainingSticks = state.totalSticks;
    state.currentPlayer = PlayerTurn.PLAYER1;
    state.highlightedCount = 0;
    state.isAnimating = false;

    // Initialize sticks array
    state.sticks = Array(state.totalSticks).fill(true);

    // Calculate layout
    const layout = calculateGridLayout(state.totalSticks);
    state.groupsPerRow = layout.groupsPerRow;

    // Update UI
    dom.configPanel.classList.add('hidden');
    dom.gameArena.classList.add('active');
    dom.remainingValue.textContent = state.remainingSticks;

    // Render sticks
    renderSticks();
    updateStickStates(); // Initial visual lock
    updateTurnIndicator();
}

function resetGame() {
    state.remainingSticks = state.totalSticks;
    state.currentPlayer = PlayerTurn.PLAYER1;
    state.highlightedCount = 0;
    state.isAnimating = false;
    state.sticks = Array(state.totalSticks).fill(true);
    state.phase = GamePhase.PLAYING;

    dom.remainingValue.textContent = state.remainingSticks;
    dom.gameOverOverlay.classList.remove('active');

    // Render sticks
    renderSticks();
    updateStickStates();
    updateTurnIndicator();
}

function resetToConfig() {
    state.phase = GamePhase.CONFIG;
    dom.gameOverOverlay.classList.remove('active');
    dom.gameArena.classList.remove('active');
    dom.configPanel.classList.remove('hidden');
    dom.ambientGlow.classList.remove('player2');
    dom.sticksBox.classList.remove('player2');
}

function endGame(winner) {
    state.phase = GamePhase.GAME_OVER;

    const isPlayer2 = winner === PlayerTurn.PLAYER2;
    const winnerName = isPlayer2 ? state.player2Name : state.player1Name;

    dom.winnerText.textContent = `${winnerName} WINS`;
    dom.winnerText.classList.toggle('player2', isPlayer2);

    setTimeout(() => {
        dom.gameOverOverlay.classList.add('active');
    }, 600);
}

function switchTurn() {
    state.currentPlayer = state.currentPlayer === PlayerTurn.PLAYER1
        ? PlayerTurn.PLAYER2
        : PlayerTurn.PLAYER1;

    updateTurnIndicator();

    // If AI's turn
    if (state.mode === GameMode.PVAI && state.currentPlayer === PlayerTurn.PLAYER2) {
        setTimeout(executeAIMove, 500);
    }
}

function updateTurnIndicator() {
    const isPlayer2 = state.currentPlayer === PlayerTurn.PLAYER2;
    const playerName = isPlayer2 ? state.player2Name : state.player1Name;

    dom.turnPlayer.textContent = playerName;
    dom.turnPlayer.classList.toggle('player2', isPlayer2);
    dom.ambientGlow.classList.toggle('player2', isPlayer2);
    dom.sticksBox.classList.toggle('player2', isPlayer2);

    // Update CSS custom property for current color
    document.documentElement.style.setProperty('--current-color',
        isPlayer2 ? 'var(--player2-color)' : 'var(--player1-color)');
    document.documentElement.style.setProperty('--current-glow',
        isPlayer2 ? 'var(--player2-glow)' : 'var(--player1-glow)');
}

// =============================================
// AI LOGIC (Perfect Play)
// =============================================

function calculateAIMove() {
    // Winning strategy: (sticks % (M + 1))
    const modValue = state.maxMove + 1;
    const remainder = state.remainingSticks % modValue;

    if (remainder === 0) {
        // Losing position - take 1 (stall)
        return 1;
    } else {
        // Take remainder to force opponent into losing position
        return remainder;
    }
}

function executeAIMove() {
    if (state.phase !== GamePhase.PLAYING || state.isAnimating) return;

    const moveCount = calculateAIMove();

    // Find first N available sticks
    const sticksToStrike = [];
    for (let i = 0; i < state.sticks.length && sticksToStrike.length < moveCount; i++) {
        if (state.sticks[i]) {
            sticksToStrike.push(i);
        }
    }

    // Highlight and strike
    highlightSticks(sticksToStrike.length);

    setTimeout(() => {
        strikeSticks(sticksToStrike);
    }, 300);
}

// =============================================
// STICK RENDERING (Grid Layout with Groups of 5)
// =============================================

function updateStickStates() {
    // Visually lock sticks beyond maxMove
    const stickElements = dom.sticksContainer.querySelectorAll('.stick');
    let activeIndex = 0;

    for (let i = 0; i < state.sticks.length; i++) {
        if (state.sticks[i]) {
            activeIndex++;
            if (activeIndex > state.maxMove) {
                stickElements[i].classList.add('locked');
            } else {
                stickElements[i].classList.remove('locked');
            }
        }
    }
}

function renderSticks() {
    dom.sticksContainer.innerHTML = '';

    const stickCount = state.totalSticks;
    const sticksPerGroup = 5;
    const totalGroups = Math.ceil(stickCount / sticksPerGroup);

    // Calculate and set grid columns
    const layout = calculateGridLayout(stickCount);
    dom.sticksContainer.style.setProperty('--grid-cols', layout.groupsPerRow);

    let stickIndex = 0;

    for (let g = 0; g < totalGroups; g++) {
        const group = document.createElement('div');
        group.className = 'stick-group';
        group.dataset.groupIndex = g;

        const sticksInGroup = Math.min(sticksPerGroup, stickCount - g * sticksPerGroup);

        for (let s = 0; s < sticksInGroup; s++) {
            const stick = document.createElement('div');
            stick.className = 'stick';
            stick.dataset.index = stickIndex;

            // Event listeners
            const currentIndex = stickIndex;
            stick.addEventListener('mouseenter', () => handleStickHover(currentIndex));
            stick.addEventListener('mouseleave', clearHighlights);
            stick.addEventListener('click', () => handleStickClick(currentIndex));

            // Touch support for mobile
            stick.addEventListener('touchstart', (e) => {
                e.preventDefault();
                handleStickHover(currentIndex);
            });
            stick.addEventListener('touchend', (e) => {
                e.preventDefault();
                handleStickClick(currentIndex);
            });

            group.appendChild(stick);
            stickIndex++;
        }

        dom.sticksContainer.appendChild(group);
    }
}

// =============================================
// INTERACTION HANDLERS
// =============================================

function handleStickHover(index) {
    if (state.phase !== GamePhase.PLAYING || state.isAnimating) return;
    if (state.mode === GameMode.PVAI && state.currentPlayer === PlayerTurn.PLAYER2) return;

    // Find the position of this stick among active sticks (1-indexed)
    let positionInActive = 0;
    for (let i = 0; i <= index && i < state.sticks.length; i++) {
        if (state.sticks[i]) positionInActive++;
    }

    // Strict Input Validation:
    // If hovering a stick that represents a move > maxMove (e.g. 5th stick when M=3),
    // do NOT highlight anything. It is an invalid move.
    if (positionInActive > state.maxMove) {
        clearHighlights();
        return;
    }

    // Valid move -> Highlight exactly positionInActive sticks
    highlightSticks(positionInActive);
}

function highlightSticks(count) {
    clearHighlights();
    state.highlightedCount = count;

    const isPlayer2 = state.currentPlayer === PlayerTurn.PLAYER2;
    const stickElements = dom.sticksContainer.querySelectorAll('.stick');

    let highlighted = 0;
    for (let i = 0; i < state.sticks.length && highlighted < count; i++) {
        if (state.sticks[i]) {
            stickElements[i].classList.add('highlighted');
            if (isPlayer2) stickElements[i].classList.add('player2');
            highlighted++;
        }
    }
}

function clearHighlights() {
    state.highlightedCount = 0;
    dom.sticksContainer.querySelectorAll('.stick').forEach(stick => {
        stick.classList.remove('highlighted', 'player2');
    });
}

function handleStickClick(index) {
    if (state.phase !== GamePhase.PLAYING || state.isAnimating) return;
    if (state.mode === GameMode.PVAI && state.currentPlayer === PlayerTurn.PLAYER2) return;
    if (state.highlightedCount === 0) return;

    // Find the sticks to strike
    const sticksToStrike = [];
    for (let i = 0; i < state.sticks.length && sticksToStrike.length < state.highlightedCount; i++) {
        if (state.sticks[i]) {
            sticksToStrike.push(i);
        }
    }

    strikeSticks(sticksToStrike);
}

// =============================================
// STRIKE ANIMATION
// =============================================

function strikeSticks(indices) {
    if (indices.length === 0) return;

    state.isAnimating = true;

    const stickElements = dom.sticksContainer.querySelectorAll('.stick');
    const isPlayer2 = state.currentPlayer === PlayerTurn.PLAYER2;

    // Get positions for slash effect
    const firstStick = stickElements[indices[0]];
    const lastStick = stickElements[indices[indices.length - 1]];

    if (firstStick && lastStick) {
        const containerRect = dom.sticksContainer.getBoundingClientRect();
        const firstRect = firstStick.getBoundingClientRect();
        const lastRect = lastStick.getBoundingClientRect();

        // Create slash line in overlay
        const slashLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        slashLine.classList.add('slash-line');
        slashLine.setAttribute('x1', firstRect.left - 20);
        slashLine.setAttribute('y1', firstRect.top + firstRect.height / 2);
        slashLine.setAttribute('x2', lastRect.right + 20);
        slashLine.setAttribute('y2', lastRect.top + lastRect.height / 2);
        slashLine.setAttribute('stroke', isPlayer2 ? 'url(#slashGradientPink)' : 'url(#slashGradientCyan)');
        slashLine.setAttribute('stroke-dasharray', '1000');
        slashLine.setAttribute('stroke-dashoffset', '1000');

        dom.slashOverlay.appendChild(slashLine);

        // Trigger animation
        requestAnimationFrame(() => {
            slashLine.classList.add('animate');
        });

        // Clean up slash after animation
        setTimeout(() => {
            slashLine.remove();
        }, 400);
    }

    // Mark sticks as struck with staggered animation
    indices.forEach((i, idx) => {
        setTimeout(() => {
            state.sticks[i] = false;
            stickElements[i].classList.add('struck');
        }, idx * 30);
    });

    // Update state after all animations
    setTimeout(() => {
        state.remainingSticks -= indices.length;
        dom.remainingValue.textContent = state.remainingSticks;

        // Check for game over
        if (state.remainingSticks === 0) {
            state.isAnimating = false;
            endGame(state.currentPlayer);
        } else {
            state.isAnimating = false;
            clearHighlights();
            switchTurn();
            updateStickStates(); // Update locked visuals for new turn (if relevant)
        }
    }, 150 + indices.length * 30);
}

// =============================================
// WINDOW RESIZE HANDLER
// =============================================

function handleResize() {
    if (state.phase === GamePhase.PLAYING) {
        const layout = calculateGridLayout(state.totalSticks);
        state.groupsPerRow = layout.groupsPerRow;
        // Re-render only if needed for major layout changes
    }
}

// =============================================
// INITIALIZATION
// =============================================

function init() {
    initConfigHandlers();

    // Set initial display values
    dom.totalSticksInput.value = state.totalSticks;
    dom.maxMoveInput.value = state.maxMove;

    // Window resize listener
    window.addEventListener('resize', handleResize);
}

// Start the game
document.addEventListener('DOMContentLoaded', init);
