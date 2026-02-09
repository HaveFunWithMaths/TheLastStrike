/**
 * THE LAST STRIKE - Enhanced Game Engine
 * Features: Misère Mode, Undo/Redo, Sound Effects, Visual Effects
 */

// =============================================
// GAME STATE MACHINE
// =============================================

const GamePhase = { CONFIG: 'config', PLAYING: 'playing', GAME_OVER: 'gameOver' };
const PlayerTurn = { PLAYER1: 'player1', PLAYER2: 'player2' };
const GameMode = { PVP: 'pvp', PVAI: 'pvai' };

// =============================================
// AUDIO SYSTEM
// =============================================

const AudioSystem = {
    enabled: true,
    context: null,

    init() {
        try {
            this.context = new (window.AudioContext || window.webkitAudioContext)();
        } catch (e) {
            console.warn('Audio not supported');
        }
    },

    unlock() {
        if (this.context && this.context.state === 'suspended') {
            this.context.resume();
        }
    },

    play(type) {
        if (!this.enabled || !this.context) return;
        this.unlock();

        const sounds = {
            click: () => this.beep(800, 0.05, 'sine'),
            hover: () => this.beep(600, 0.02, 'sine'),
            strike: () => this.explosion(),
            victory: () => this.victoryFanfare(),
            defeat: () => this.defeatSound(),
            undo: () => this.beep(400, 0.1, 'triangle'),
            redo: () => this.beep(500, 0.1, 'triangle'),
            toggle: () => this.beep(700, 0.05, 'sine')
        };

        if (sounds[type]) sounds[type]();
    },

    beep(frequency, duration, type = 'sine') {
        const osc = this.context.createOscillator();
        const gain = this.context.createGain();
        osc.connect(gain);
        gain.connect(this.context.destination);
        osc.type = type;
        osc.frequency.value = frequency;
        gain.gain.setValueAtTime(0.15, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + duration);
        osc.start();
        osc.stop(this.context.currentTime + duration);
    },

    explosion() {
        const bufferSize = this.context.sampleRate * 0.3;
        const buffer = this.context.createBuffer(1, bufferSize, this.context.sampleRate);
        const data = buffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / bufferSize, 2);
        }
        const source = this.context.createBufferSource();
        source.buffer = buffer;
        const gain = this.context.createGain();
        source.connect(gain);
        gain.connect(this.context.destination);
        gain.gain.setValueAtTime(0.3, this.context.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.context.currentTime + 0.3);
        source.start();
    },

    victoryFanfare() {
        const notes = [523, 659, 784, 1047];
        notes.forEach((freq, i) => {
            setTimeout(() => this.beep(freq, 0.2, 'sine'), i * 150);
        });
    },

    defeatSound() {
        const notes = [400, 350, 300, 250];
        notes.forEach((freq, i) => {
            setTimeout(() => this.beep(freq, 0.2, 'sawtooth'), i * 150);
        });
    },

    toggle() {
        this.enabled = !this.enabled;
        if (this.enabled) this.play('toggle');
        return this.enabled;
    }
};

// =============================================
// VISUAL EFFECTS SYSTEM
// =============================================

const VFX = {
    createParticles() {
        const container = document.getElementById('particlesContainer');
        if (!container) return;
        container.innerHTML = '';
        for (let i = 0; i < 30; i++) {
            const particle = document.createElement('div');
            particle.className = 'particle';
            particle.style.left = Math.random() * 100 + '%';
            particle.style.animationDelay = Math.random() * 15 + 's';
            particle.style.animationDuration = (10 + Math.random() * 10) + 's';
            container.appendChild(particle);
        }
    },

    createBokeh() {
        const container = document.getElementById('bokehContainer');
        if (!container) return;
        container.innerHTML = '';
        const colors = ['#00f5ff', '#ff006e', '#ffffff', '#8855ff'];
        for (let i = 0; i < 20; i++) {
            const dot = document.createElement('div');
            dot.className = 'bokeh-dot';
            const size = 4 + Math.random() * 12;
            dot.style.width = size + 'px';
            dot.style.height = size + 'px';
            dot.style.left = Math.random() * 100 + '%';
            dot.style.bottom = Math.random() * 150 + 'px';
            dot.style.background = colors[Math.floor(Math.random() * colors.length)];
            dot.style.animationDelay = Math.random() * 3 + 's';
            container.appendChild(dot);
        }
    },

    screenShake() {
        const container = document.getElementById('gameContainer');
        container.classList.add('shake');
        setTimeout(() => container.classList.remove('shake'), 400);
    },

    createExplosion(x, y, color) {
        const container = document.getElementById('explosionContainer');
        const particleCount = 12;
        for (let i = 0; i < particleCount; i++) {
            const particle = document.createElement('div');
            particle.className = 'explosion-particle';
            particle.style.left = x + 'px';
            particle.style.top = y + 'px';
            particle.style.background = color;
            particle.style.boxShadow = `0 0 6px ${color}`;
            const angle = (i / particleCount) * Math.PI * 2;
            const distance = 30 + Math.random() * 50;
            particle.style.setProperty('--tx', Math.cos(angle) * distance + 'px');
            particle.style.setProperty('--ty', Math.sin(angle) * distance + 'px');
            container.appendChild(particle);
            setTimeout(() => particle.remove(), 600);
        }
    },

    createRipple(x, y, color) {
        const container = document.getElementById('explosionContainer');
        const ripple = document.createElement('div');
        ripple.className = 'ripple';
        ripple.style.left = x + 'px';
        ripple.style.top = y + 'px';
        ripple.style.borderColor = color;
        container.appendChild(ripple);
        setTimeout(() => ripple.remove(), 600);
    },

    pulseCounter() {
        const counter = document.getElementById('remainingValue');
        counter.classList.add('pulse');
        setTimeout(() => counter.classList.remove('pulse'), 300);
    },

    launchConfetti(playerColor) {
        const container = document.getElementById('confettiContainer');
        container.innerHTML = '';
        const colors = playerColor === 'player1'
            ? ['#00f5ff', '#00d4ff', '#00b3ff', '#ffffff']
            : ['#ff006e', '#ff3399', '#ff66b2', '#ffffff'];

        for (let i = 0; i < 100; i++) {
            setTimeout(() => {
                const confetti = document.createElement('div');
                confetti.className = 'confetti';
                confetti.style.left = Math.random() * 100 + '%';
                confetti.style.background = colors[Math.floor(Math.random() * colors.length)];
                confetti.style.transform = `rotate(${Math.random() * 360}deg)`;
                confetti.style.animationDuration = (2 + Math.random() * 2) + 's';
                const shapes = ['circle', 'square'];
                if (shapes[Math.floor(Math.random() * 2)] === 'circle') {
                    confetti.style.borderRadius = '50%';
                }
                container.appendChild(confetti);
                setTimeout(() => confetti.remove(), 3000);
            }, i * 30);
        }
    },

    hapticFeedback(type = 'light') {
        if ('vibrate' in navigator) {
            const patterns = { light: [10], medium: [20], heavy: [30, 20, 30] };
            navigator.vibrate(patterns[type] || patterns.light);
        }
    }
};

// =============================================
// GAME STATE
// =============================================

const state = {
    totalSticks: 30,
    maxMove: 3,
    minMove: 1,
    mode: GameMode.PVAI,
    misereMode: false,
    player1Name: 'PLAYER 1',
    player2Name: 'PLAYER 2',
    phase: GamePhase.CONFIG,
    currentPlayer: PlayerTurn.PLAYER1,
    remainingSticks: 30,
    highlightedCount: 0,
    isAnimating: false,
    sticks: [],
    groupsPerRow: 3,
    // Undo/Redo
    history: [],
    historyIndex: -1
};

// =============================================
// DOM REFERENCES
// =============================================

const dom = {};

function cacheDom() {
    dom.configPanel = document.getElementById('configPanel');
    dom.gameArena = document.getElementById('gameArena');
    dom.sticksBox = document.getElementById('sticksBox');
    dom.sticksContainer = document.getElementById('sticksContainer');
    dom.totalSticksInput = document.getElementById('totalSticksInput');
    dom.maxMoveInput = document.getElementById('maxMoveInput');
    dom.player1NameInput = document.getElementById('player1Name');
    dom.player2NameInput = document.getElementById('player2Name');
    dom.remainingValue = document.getElementById('remainingValue');
    dom.turnPlayer = document.getElementById('turnPlayer');
    dom.ambientGlow = document.getElementById('ambientGlow');
    dom.gameOverOverlay = document.getElementById('gameOverOverlay');
    dom.winnerText = document.getElementById('winnerText');
    dom.gameOverSubtitle = document.getElementById('gameOverSubtitle');
    dom.trophyIcon = document.getElementById('trophyIcon');
    dom.slashOverlay = document.getElementById('slashOverlay');
    dom.startBtn = document.getElementById('startBtn');
    dom.homeBtn = document.getElementById('homeBtn');
    dom.resetBtn = document.getElementById('resetBtn');
    dom.playAgainBtn = document.getElementById('playAgainBtn');
    dom.soundToggle = document.getElementById('soundToggle');
    dom.misereMode = document.getElementById('misereMode');
    dom.misereToggle = document.getElementById('misereToggle');
    dom.gameModeIndicator = document.getElementById('gameModeIndicator');
    dom.undoBtn = document.getElementById('undoBtn');
    dom.redoBtn = document.getElementById('redoBtn');
    dom.gameSubtitle = document.getElementById('gameSubtitle');
    dom.misereDescription = document.getElementById('misereDescription');
}

// =============================================
// CONFIGURATION HANDLERS
// =============================================

function initConfigHandlers() {
    document.querySelectorAll('.config-btn').forEach(btn => {
        btn.addEventListener('click', handleConfigChange);
    });
    dom.totalSticksInput.addEventListener('input', handleInputChange);
    dom.totalSticksInput.addEventListener('blur', validateInputs);
    dom.maxMoveInput.addEventListener('input', handleInputChange);
    dom.maxMoveInput.addEventListener('blur', validateInputs);
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.addEventListener('click', handleModeChange);
    });
    dom.startBtn.addEventListener('click', startGame);
    dom.homeBtn.addEventListener('click', resetToConfig);
    dom.resetBtn.addEventListener('click', resetGame);
    dom.playAgainBtn.addEventListener('click', resetToConfig);
    dom.soundToggle.addEventListener('click', handleSoundToggle);
    dom.misereMode.addEventListener('change', handleMisereToggle);
    dom.undoBtn.addEventListener('click', undoMove);
    dom.redoBtn.addEventListener('click', redoMove);

    // Unlock audio on first interaction
    document.addEventListener('click', () => AudioSystem.unlock(), { once: true });
    document.addEventListener('touchstart', () => AudioSystem.unlock(), { once: true });
}

function handleConfigChange(e) {
    AudioSystem.play('click');
    VFX.hapticFeedback('light');
    const action = e.target.dataset.action;
    const target = e.target.dataset.target;
    if (target === 'totalSticks') {
        let value = parseInt(dom.totalSticksInput.value) || 20;
        if (action === 'increase' && value < 100) value++;
        else if (action === 'decrease' && value > 5) value--;
        state.totalSticks = value;
        dom.totalSticksInput.value = value;
    } else if (target === 'maxMove') {
        let value = parseInt(dom.maxMoveInput.value) || 3;
        if (action === 'increase' && value < 10) value++;
        else if (action === 'decrease' && value > 2) value--;
        state.maxMove = value;
        dom.maxMoveInput.value = value;
    }
}

function handleInputChange(e) {
    const input = e.target;
    let value = parseInt(input.value);
    if (input.id === 'totalSticksInput' && !isNaN(value)) state.totalSticks = value;
    else if (input.id === 'maxMoveInput' && !isNaN(value)) state.maxMove = value;
}

function validateInputs() {
    let n = parseInt(dom.totalSticksInput.value);
    if (isNaN(n) || n < 5) n = 5;
    if (n > 100) n = 100;
    state.totalSticks = n;
    dom.totalSticksInput.value = n;
    let m = parseInt(dom.maxMoveInput.value);
    if (isNaN(m) || m < 2) m = 2;
    if (m > 10) m = 10;
    state.maxMove = m;
    dom.maxMoveInput.value = m;
}

function handleModeChange(e) {
    AudioSystem.play('click');
    VFX.hapticFeedback('light');
    const mode = e.target.dataset.mode;
    state.mode = mode === 'pvp' ? GameMode.PVP : GameMode.PVAI;
    document.querySelectorAll('.mode-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.mode === mode);
    });
}

function handleSoundToggle() {
    const enabled = AudioSystem.toggle();
    dom.soundToggle.classList.toggle('muted', !enabled);
    dom.soundToggle.textContent = enabled ? '🔊' : '🔇';
    VFX.hapticFeedback('light');
}

function handleMisereToggle() {
    state.misereMode = dom.misereMode.checked;
    dom.misereToggle.classList.toggle('active', state.misereMode);

    // Update subtitle based on mode
    if (state.misereMode) {
        dom.gameSubtitle.textContent = '⚠️ Strike the last stick and LOSE!';
        dom.gameSubtitle.style.color = '#ff006e';
    } else {
        dom.gameSubtitle.textContent = 'Strike the last stick to win';
        dom.gameSubtitle.style.color = '';
    }

    AudioSystem.play('toggle');
    VFX.hapticFeedback('light');
}

// =============================================
// LAYOUT CALCULATIONS
// =============================================

function calculateGridLayout(totalSticks) {
    const sticksPerGroup = 5;
    const totalGroups = Math.ceil(totalSticks / sticksPerGroup);
    let cols;
    const sqrt = Math.sqrt(totalGroups);
    if (Number.isInteger(sqrt)) cols = sqrt;
    else cols = Math.ceil(sqrt);
    const isMobile = window.innerWidth < 600;
    if (isMobile) cols = Math.min(cols, 3);
    cols = Math.max(2, cols);
    return { groupsPerRow: cols, totalGroups };
}

// =============================================
// UNDO/REDO SYSTEM
// =============================================

function saveState() {
    const snapshot = {
        sticks: [...state.sticks],
        remainingSticks: state.remainingSticks,
        currentPlayer: state.currentPlayer
    };
    // Remove any future states if we're in the middle of history
    state.history = state.history.slice(0, state.historyIndex + 1);
    state.history.push(snapshot);
    state.historyIndex++;
    updateUndoRedoButtons();
}

function undoMove() {
    if (state.historyIndex <= 0 || state.isAnimating) return;
    if (state.phase !== GamePhase.PLAYING) return;

    // In PvAI mode, undo is only allowed during player's turn
    if (state.mode === GameMode.PVAI && state.currentPlayer === PlayerTurn.PLAYER2) return;

    AudioSystem.play('undo');
    VFX.hapticFeedback('medium');

    // In PvAI mode, undo twice (player's last move + AI's last move)
    // This brings the game back to player's previous turn state
    if (state.mode === GameMode.PVAI && state.historyIndex >= 2) {
        state.historyIndex -= 2;
    } else {
        // In PvP mode, just undo one move (which was the other player's move)
        state.historyIndex--;
    }

    restoreState(state.history[state.historyIndex]);
    updateUndoRedoButtons();
}

function redoMove() {
    if (state.historyIndex >= state.history.length - 1 || state.isAnimating) return;
    if (state.phase !== GamePhase.PLAYING) return;

    // In PvAI mode, redo is only allowed during player's turn
    if (state.mode === GameMode.PVAI && state.currentPlayer === PlayerTurn.PLAYER2) return;

    AudioSystem.play('redo');
    VFX.hapticFeedback('medium');

    // In PvAI mode, redo twice (player + AI)
    if (state.mode === GameMode.PVAI && state.historyIndex < state.history.length - 2) {
        state.historyIndex += 2;
    } else {
        // In PvP mode, just redo one move
        state.historyIndex++;
    }

    restoreState(state.history[state.historyIndex]);
    updateUndoRedoButtons();
}

function restoreState(snapshot) {
    state.sticks = [...snapshot.sticks];
    state.remainingSticks = snapshot.remainingSticks;
    state.currentPlayer = snapshot.currentPlayer;
    dom.remainingValue.textContent = state.remainingSticks;
    renderSticks();
    updateStickStates();
    updateTurnIndicator();
}

function updateUndoRedoButtons() {
    // Base conditions for undo/redo availability
    let canUndo = state.historyIndex > 0 && state.phase === GamePhase.PLAYING;
    let canRedo = state.historyIndex < state.history.length - 1 && state.phase === GamePhase.PLAYING;

    // In PvAI mode, disable undo/redo during AI's turn
    if (state.mode === GameMode.PVAI && state.currentPlayer === PlayerTurn.PLAYER2) {
        canUndo = false;
        canRedo = false;
    }

    // In PvAI mode, need at least 2 history entries to undo (player + AI moves)
    if (state.mode === GameMode.PVAI && state.historyIndex < 2) {
        canUndo = false;
    }

    dom.undoBtn.disabled = !canUndo;
    dom.redoBtn.disabled = !canRedo;
}

// =============================================
// GAME FLOW
// =============================================

function startGame() {
    validateInputs();
    AudioSystem.play('click');
    VFX.hapticFeedback('medium');

    state.player1Name = dom.player1NameInput.value.trim().toUpperCase() || 'PLAYER 1';
    state.player2Name = dom.player2NameInput.value.trim().toUpperCase() ||
        (state.mode === GameMode.PVAI ? 'AI' : 'PLAYER 2');

    state.phase = GamePhase.PLAYING;
    state.remainingSticks = state.totalSticks;
    state.currentPlayer = PlayerTurn.PLAYER1;
    state.highlightedCount = 0;
    state.isAnimating = false;
    state.sticks = Array(state.totalSticks).fill(true);

    // Reset history
    state.history = [];
    state.historyIndex = -1;
    saveState();

    const layout = calculateGridLayout(state.totalSticks);
    state.groupsPerRow = layout.groupsPerRow;

    dom.configPanel.classList.add('hidden');
    dom.gameArena.classList.add('active');
    dom.remainingValue.textContent = state.remainingSticks;

    // Update game mode indicator
    if (state.misereMode) {
        dom.gameModeIndicator.textContent = '⚠️ MISÈRE MODE - Last stick LOSES!';
        dom.gameModeIndicator.classList.add('misere');
    } else {
        dom.gameModeIndicator.textContent = '';
        dom.gameModeIndicator.classList.remove('misere');
    }

    renderSticks();
    updateStickStates();
    updateTurnIndicator();
}

function resetGame() {
    AudioSystem.play('click');
    VFX.hapticFeedback('medium');

    state.remainingSticks = state.totalSticks;
    state.currentPlayer = PlayerTurn.PLAYER1;
    state.highlightedCount = 0;
    state.isAnimating = false;
    state.sticks = Array(state.totalSticks).fill(true);
    state.phase = GamePhase.PLAYING;

    // Reset history
    state.history = [];
    state.historyIndex = -1;
    saveState();

    dom.remainingValue.textContent = state.remainingSticks;
    dom.gameOverOverlay.classList.remove('active');

    renderSticks();
    updateStickStates();
    updateTurnIndicator();
    updateUndoRedoButtons();
}

function resetToConfig() {
    AudioSystem.play('click');
    state.phase = GamePhase.CONFIG;
    dom.gameOverOverlay.classList.remove('active');
    dom.gameArena.classList.remove('active');
    dom.configPanel.classList.remove('hidden');
    dom.ambientGlow.classList.remove('player2');
    dom.sticksBox.classList.remove('player2');
    document.getElementById('confettiContainer').innerHTML = '';
}

function endGame(winner) {
    state.phase = GamePhase.GAME_OVER;
    const isPlayer2 = winner === PlayerTurn.PLAYER2;
    const winnerName = isPlayer2 ? state.player2Name : state.player1Name;

    dom.winnerText.textContent = `${winnerName} WINS`;
    dom.winnerText.classList.toggle('player2', isPlayer2);

    if (state.misereMode) {
        dom.gameOverSubtitle.textContent = 'They avoided the last strike!';
    } else {
        dom.gameOverSubtitle.textContent = 'The last strike was decisive';
    }

    // Trophy changes based on winner
    dom.trophyIcon.style.filter = isPlayer2
        ? 'drop-shadow(0 0 20px rgba(255, 0, 110, 0.6))'
        : 'drop-shadow(0 0 20px rgba(0, 245, 255, 0.6))';

    // Play victory/defeat sound
    const humanPlayer = state.mode === GameMode.PVAI ? PlayerTurn.PLAYER1 : null;
    if (humanPlayer) {
        if (winner === humanPlayer) AudioSystem.play('victory');
        else AudioSystem.play('defeat');
    } else {
        AudioSystem.play('victory');
    }

    VFX.hapticFeedback('heavy');
    VFX.launchConfetti(isPlayer2 ? 'player2' : 'player1');

    setTimeout(() => {
        dom.gameOverOverlay.classList.add('active');
    }, 600);
}

function switchTurn() {
    state.currentPlayer = state.currentPlayer === PlayerTurn.PLAYER1
        ? PlayerTurn.PLAYER2 : PlayerTurn.PLAYER1;
    updateTurnIndicator();
    updateUndoRedoButtons();
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
    document.documentElement.style.setProperty('--current-color',
        isPlayer2 ? 'var(--player2-color)' : 'var(--player1-color)');
    document.documentElement.style.setProperty('--current-glow',
        isPlayer2 ? 'var(--player2-glow)' : 'var(--player1-glow)');
}

// =============================================
// AI LOGIC (Perfect Play)
// =============================================

function calculateAIMove() {
    const N = state.remainingSticks;
    const M = state.maxMove;
    const mod = M + 1;

    // Helper for random move in losing positions
    const getRandomMove = () => {
        const feasibleMax = Math.min(N, M);
        return Math.floor(Math.random() * feasibleMax) + 1;
    };

    if (state.misereMode) {
        // Misère Mode: Losing condition is N % (M+1) == 1
        const remainder = (N - 1) % mod;

        if (N === 1) return 1;

        if (remainder === 0) {
            return getRandomMove();
        } else {
            return remainder;
        }
    } else {
        // Normal Mode: Losing condition is N % (M+1) == 0
        const remainder = N % mod;

        if (remainder === 0) {
            return getRandomMove();
        } else {
            return remainder;
        }
    }
}

function executeAIMove() {
    if (state.phase !== GamePhase.PLAYING || state.isAnimating) return;
    const moveCount = calculateAIMove();
    const sticksToStrike = [];
    for (let i = 0; i < state.sticks.length && sticksToStrike.length < moveCount; i++) {
        if (state.sticks[i]) sticksToStrike.push(i);
    }
    highlightSticks(sticksToStrike.length);
    setTimeout(() => strikeSticks(sticksToStrike), 300);
}

// =============================================
// STICK RENDERING
// =============================================

function updateStickStates() {
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
    const layout = calculateGridLayout(stickCount);
    dom.sticksContainer.style.setProperty('--grid-cols', layout.groupsPerRow);
    let stickIndex = 0;

    for (let g = 0; g < totalGroups; g++) {
        const group = document.createElement('div');
        group.className = 'stick-group';
        const sticksInGroup = Math.min(sticksPerGroup, stickCount - g * sticksPerGroup);

        for (let s = 0; s < sticksInGroup; s++) {
            const stick = document.createElement('div');
            stick.className = 'stick';
            stick.dataset.index = stickIndex;

            if (!state.sticks[stickIndex]) {
                stick.classList.add('struck');
                stick.style.opacity = '0';
            }

            const currentIndex = stickIndex;
            stick.addEventListener('mouseenter', () => handleStickHover(currentIndex));
            stick.addEventListener('mouseleave', clearHighlights);
            stick.addEventListener('click', () => handleStickClick(currentIndex));
            stick.addEventListener('touchstart', (e) => {
                e.preventDefault();
                handleStickHover(currentIndex);
            }, { passive: false });
            stick.addEventListener('touchend', (e) => {
                e.preventDefault();
                handleStickClick(currentIndex);
            }, { passive: false });

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

    let positionInActive = 0;
    for (let i = 0; i <= index && i < state.sticks.length; i++) {
        if (state.sticks[i]) positionInActive++;
    }

    if (positionInActive > state.maxMove) {
        clearHighlights();
        return;
    }

    AudioSystem.play('hover');
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

    AudioSystem.play('click');
    VFX.hapticFeedback('medium');

    const sticksToStrike = [];
    for (let i = 0; i < state.sticks.length && sticksToStrike.length < state.highlightedCount; i++) {
        if (state.sticks[i]) sticksToStrike.push(i);
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
    const color = isPlayer2 ? '#ff006e' : '#00f5ff';

    // Screen shake
    VFX.screenShake();
    AudioSystem.play('strike');

    // Create slash line
    const firstStick = stickElements[indices[0]];
    const lastStick = stickElements[indices[indices.length - 1]];

    if (firstStick && lastStick) {
        const firstRect = firstStick.getBoundingClientRect();
        const lastRect = lastStick.getBoundingClientRect();

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
        requestAnimationFrame(() => slashLine.classList.add('animate'));
        setTimeout(() => slashLine.remove(), 400);

        // Explosion at center
        const centerX = (firstRect.left + lastRect.right) / 2;
        const centerY = firstRect.top + firstRect.height / 2;
        VFX.createExplosion(centerX, centerY, color);
        VFX.createRipple(centerX, centerY, color);
    }

    // Mark sticks as struck
    indices.forEach((i, idx) => {
        setTimeout(() => {
            state.sticks[i] = false;
            stickElements[i].classList.add('struck');
        }, idx * 30);
    });

    // Update state after animations
    setTimeout(() => {
        state.remainingSticks -= indices.length;
        dom.remainingValue.textContent = state.remainingSticks;
        VFX.pulseCounter();

        // Determine winner
        if (state.remainingSticks === 0) {
            state.isAnimating = false;
            // Save final state
            saveState();

            if (state.misereMode) {
                // Last player to strike loses
                endGame(state.currentPlayer === PlayerTurn.PLAYER1
                    ? PlayerTurn.PLAYER2 : PlayerTurn.PLAYER1);
            } else {
                endGame(state.currentPlayer);
            }
        } else {
            state.isAnimating = false;
            clearHighlights();
            switchTurn();
            saveState();
            updateStickStates();
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
    }
}

// =============================================
// INITIALIZATION
// =============================================

function init() {
    cacheDom();
    initConfigHandlers();
    AudioSystem.init();
    VFX.createParticles();
    VFX.createBokeh();

    dom.totalSticksInput.value = state.totalSticks;
    dom.maxMoveInput.value = state.maxMove;

    window.addEventListener('resize', handleResize);
}

document.addEventListener('DOMContentLoaded', init);
