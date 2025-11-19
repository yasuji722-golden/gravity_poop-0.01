// Game Configuration
const CONFIG = {
    fps: 30,
    autoSaveInterval: 10000, // 10 seconds
    goldenPoopSpawnChance: 0.0033, // Approx once every 5 mins (assuming 1 check per second) -> actually let's use a timer
    goldenPoopDuration: 10000, // 10 seconds on screen
    goldenPoopBonusDuration: 60000, // 60 seconds bonus
    goldenPoopMultiplier: 2,
};

// Game State
let gameState = {
    poopCount: 0,
    pps: 0,
    items: {
        toilet: {
            id: 'toilet',
            name: 'Toilet',
            baseCost: 10,
            pps: 0.1,
            count: 0,
            icon: 'toilet_icon.png'
        },
        cow: {
            id: 'cow',
            name: 'Cow',
            baseCost: 100,
            pps: 1,
            count: 0,
            icon: 'cow_icon.png'
        }
    },
    modifiers: {
        globalMultiplier: 1
    }
};

// DOM Elements
const els = {
    poopCount: document.getElementById('poop-count'),
    ppsCount: document.getElementById('pps-count'),
    poopButton: document.getElementById('poop-button'),
    store: document.getElementById('store'),
    goldenPoopContainer: document.getElementById('golden-poop-container')
};

// Initialization
function init() {
    loadGame();
    renderStore();
    updateUI();

    // Event Listeners
    els.poopButton.addEventListener('click', clickPoop);

    // Game Loop
    // Game Loop removed (logic handled in passiveIncome and event listeners)

    // Passive Income Loop (separate from render loop for stability)
    setInterval(passiveIncome, 100); // Run 10 times a second

    // Auto Save
    setInterval(saveGame, CONFIG.autoSaveInterval);

    // Golden Poop Spawner
    // Check every second if we should spawn one (simple random check)
    // 5 mins = 300 seconds. 1/300 chance per second.
    setInterval(trySpawnGoldenPoop, 1000);
}

// Core Mechanics
function clickPoop(e) {
    const amount = 1 * gameState.modifiers.globalMultiplier;
    addPoop(amount);

    // Visual feedback
    createFloatingNumber(e.clientX, e.clientY, `+${formatNumber(amount)}`);

    // Animation trigger
    els.poopButton.style.transform = 'scale(0.95)';
    setTimeout(() => els.poopButton.style.transform = 'scale(1)', 50);
}

function addPoop(amount) {
    gameState.poopCount += amount;
    updateUI();
}

function passiveIncome() {
    if (gameState.pps > 0) {
        const amount = (gameState.pps * gameState.modifiers.globalMultiplier) / 10;
        addPoop(amount);
    }
}

function calculateCost(item) {
    return Math.floor(item.baseCost * Math.pow(1.15, item.count));
}

function buyItem(itemId) {
    const item = gameState.items[itemId];
    const cost = calculateCost(item);

    if (gameState.poopCount >= cost) {
        gameState.poopCount -= cost;
        item.count++;
        recalculatePpS();
        updateUI();
        renderStore(); // Re-render to update costs and visual states
        saveGame();
    }
}

function recalculatePpS() {
    let pps = 0;
    for (const key in gameState.items) {
        pps += gameState.items[key].count * gameState.items[key].pps;
    }
    gameState.pps = pps;
}

// Golden Poop Logic
function trySpawnGoldenPoop() {
    // 1 in 300 chance (approx every 5 mins)
    if (Math.random() < (1 / 300)) {
        spawnGoldenPoop();
    }
}

function spawnGoldenPoop() {
    const gp = document.createElement('div');
    gp.className = 'golden-poop';

    // Random position
    const x = Math.random() * (window.innerWidth - 100);
    const y = Math.random() * (window.innerHeight - 100);
    gp.style.left = `${x}px`;
    gp.style.top = `${y}px`;

    const img = document.createElement('img');
    img.src = 'golden_poop_icon.png';
    gp.appendChild(img);

    gp.onclick = () => {
        activateGoldenBonus();
        gp.remove();
    };

    els.goldenPoopContainer.appendChild(gp);

    // Remove after duration
    setTimeout(() => {
        if (gp.parentNode) gp.remove();
    }, CONFIG.goldenPoopDuration);
}

function activateGoldenBonus() {
    // Visual feedback
    alert('GOLDEN POOP! PpS x2 for 60 seconds!');

    gameState.modifiers.globalMultiplier *= CONFIG.goldenPoopMultiplier;
    updateUI();

    setTimeout(() => {
        gameState.modifiers.globalMultiplier /= CONFIG.goldenPoopMultiplier;
        updateUI();
    }, CONFIG.goldenPoopBonusDuration);
}

// UI & Rendering
function updateUI() {
    els.poopCount.textContent = formatNumber(Math.floor(gameState.poopCount));

    // Show effective PpS
    const effectivePpS = gameState.pps * gameState.modifiers.globalMultiplier;
    els.ppsCount.textContent = formatNumber(effectivePpS.toFixed(1));

    // Update store buttons enable/disable state
    for (const key in gameState.items) {
        const item = gameState.items[key];
        const cost = calculateCost(item);
        const itemEl = document.getElementById(`item-${key}`);
        if (itemEl) {
            if (gameState.poopCount >= cost) {
                itemEl.classList.remove('disabled');
            } else {
                itemEl.classList.add('disabled');
            }
        }
    }
}

function renderStore() {
    els.store.innerHTML = '';

    for (const key in gameState.items) {
        const item = gameState.items[key];
        const cost = calculateCost(item);

        const itemEl = document.createElement('div');
        itemEl.className = 'store-item';
        itemEl.id = `item-${key}`;
        if (gameState.poopCount < cost) itemEl.classList.add('disabled');

        itemEl.innerHTML = `
            <div class="item-icon">
                <img src="${item.icon}" alt="${item.name}">
            </div>
            <div class="item-details">
                <div class="item-name">${item.name}</div>
                <div class="item-cost">💩 ${formatNumber(cost)}</div>
                <div class="item-pps">+${item.pps} PpS</div>
            </div>
            <div class="item-count">${item.count}</div>
        `;

        itemEl.onclick = () => buyItem(key);

        els.store.appendChild(itemEl);
    }
}

function createFloatingNumber(x, y, text) {
    const el = document.createElement('div');
    el.className = 'floating-number';
    el.textContent = text;
    el.style.left = `${x}px`;
    el.style.top = `${y}px`;
    document.body.appendChild(el);

    setTimeout(() => el.remove(), 1000);
}

function formatNumber(num) {
    return num.toLocaleString();
}

// Save/Load System
function saveGame() {
    const saveData = {
        poopCount: gameState.poopCount,
        items: {}
    };

    // Only save counts, static data is in code
    for (const key in gameState.items) {
        saveData.items[key] = gameState.items[key].count;
    }

    localStorage.setItem('gravityPoopSave', JSON.stringify(saveData));
}

function loadGame() {
    const saved = localStorage.getItem('gravityPoopSave');
    if (saved) {
        try {
            const data = JSON.parse(saved);
            gameState.poopCount = data.poopCount || 0;

            if (data.items) {
                for (const key in data.items) {
                    if (gameState.items[key]) {
                        gameState.items[key].count = data.items[key];
                    }
                }
            }
            recalculatePpS();
        } catch (e) {
            console.error("Failed to load save", e);
        }
    }
}

// Start
init();
