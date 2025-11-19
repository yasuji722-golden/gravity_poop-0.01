// Game Configuration
const CONFIG = {
    fps: 30,
    autoSaveInterval: 10000, // 10 seconds
    goldenPoopSpawnChance: 0.0033, // Approx once every 5 mins
    goldenPoopDuration: 10000, // 10 seconds on screen
    goldenPoopBonusDuration: 60000, // 60 seconds bonus
    goldenPoopMultiplier: 2,
    prestigeThreshold: 1000000, // 1 Million total poop to unlock prestige
    goldEssenceBonus: 0.1, // 10% per essence
};

// Game State
let gameState = {
    poopCount: 0,
    totalPoopProduced: 0, // Track for prestige
    goldEssence: 0, // Prestige currency
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
        },
        space_station: {
            id: 'space_station',
            name: 'Space Station',
            baseCost: 1000,
            pps: 10,
            count: 0,
            icon: 'space_station_icon.png'
        },
        portal: {
            id: 'portal',
            name: 'Dimensional Portal',
            baseCost: 10000,
            pps: 100,
            count: 0,
            icon: 'portal_icon.png'
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
    goldEssenceCount: document.getElementById('gold-essence-count'),
    poopButton: document.getElementById('poop-button'),
    store: document.getElementById('store'),
    goldenPoopContainer: document.getElementById('golden-poop-container'),
    prestigeButton: document.getElementById('prestige-button')
};

// Initialization
function init() {
    loadGame();
    renderStore();
    updateUI();

    // Event Listeners
    els.poopButton.addEventListener('click', clickPoop);
    els.prestigeButton.addEventListener('click', doPrestige);

    // Passive Income Loop
    setInterval(passiveIncome, 100); // Run 10 times a second

    // Auto Save
    setInterval(saveGame, CONFIG.autoSaveInterval);

    // Golden Poop Spawner
    setInterval(trySpawnGoldenPoop, 1000);
}

// Core Mechanics
function clickPoop(e) {
    const amount = 1 * getGlobalMultiplier();
    addPoop(amount);

    // Visual feedback
    createFloatingNumber(e.clientX, e.clientY, `+${formatNumber(amount)}`);
    createParticles(e.clientX, e.clientY);

    // Animation trigger
    els.poopButton.style.transform = 'scale(0.95)';
    setTimeout(() => els.poopButton.style.transform = 'scale(1)', 50);
}

function addPoop(amount) {
    gameState.poopCount += amount;
    gameState.totalPoopProduced += amount;
    updateUI();
    checkPrestigeCondition();
}

function passiveIncome() {
    if (gameState.pps > 0) {
        const amount = (gameState.pps * getGlobalMultiplier()) / 10;
        addPoop(amount);
    }
}

function getGlobalMultiplier() {
    // Base multiplier * Golden Poop Multiplier * (1 + Gold Essence Bonus)
    const essenceBonus = 1 + (gameState.goldEssence * CONFIG.goldEssenceBonus);
    return gameState.modifiers.globalMultiplier * essenceBonus;
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

// Prestige System
function checkPrestigeCondition() {
    if (gameState.totalPoopProduced >= CONFIG.prestigeThreshold) {
        els.prestigeButton.classList.remove('hidden');
        els.prestigeButton.disabled = false;
    } else {
        // Keep it visible if unlocked once? Or hide? 
        // Requirement says "active when total > 1M". Let's hide if not met initially, show when met.
        // If already prestiged, maybe keep it visible but disabled until next threshold?
        // For simplicity based on prompt: "Active when ... > 1,000,000".
        if (gameState.totalPoopProduced < CONFIG.prestigeThreshold) {
            els.prestigeButton.classList.add('hidden');
        }
    }
}

function doPrestige() {
    if (confirm("Are you sure you want to PRESTIGE? You will lose all progress but gain 1 Gold Essence (+10% permanent bonus).")) {
        // 1. Add Gold Essence
        gameState.goldEssence += 1;

        // 2. Reset Game State (except Essence)
        gameState.poopCount = 0;
        gameState.totalPoopProduced = 0;
        gameState.pps = 0;
        gameState.modifiers.globalMultiplier = 1; // Reset golden poop bonus if active

        // Reset Items
        for (const key in gameState.items) {
            gameState.items[key].count = 0;
        }

        // 3. Save and Reload
        saveGame();
        renderStore();
        updateUI();
        checkPrestigeCondition(); // Will hide button

        alert("PRESTIGE SUCCESSFUL! You now have " + gameState.goldEssence + " Gold Essence.");
    }
}

// Golden Poop Logic
function trySpawnGoldenPoop() {
    if (Math.random() < (1 / 300)) {
        spawnGoldenPoop();
    }
}

function spawnGoldenPoop() {
    const gp = document.createElement('div');
    gp.className = 'golden-poop';

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

    setTimeout(() => {
        if (gp.parentNode) gp.remove();
    }, CONFIG.goldenPoopDuration);
}

function activateGoldenBonus() {
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

    const effectivePpS = gameState.pps * getGlobalMultiplier();
    els.ppsCount.textContent = formatNumber(effectivePpS.toFixed(1));

    els.goldEssenceCount.textContent = gameState.goldEssence;

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

function createParticles(x, y) {
    for (let i = 0; i < 5; i++) {
        const p = document.createElement('div');
        p.className = 'poop-particle';
        p.style.left = `${x}px`;
        p.style.top = `${y}px`;

        const angle = Math.random() * Math.PI * 2;
        const velocity = Math.random() * 50 + 20;
        const tx = Math.cos(angle) * velocity;
        const ty = Math.sin(angle) * velocity;

        p.style.transition = 'transform 0.5s ease-out, opacity 0.5s ease-out';
        document.body.appendChild(p);

        // Trigger animation next frame
        requestAnimationFrame(() => {
            p.style.transform = `translate(${tx}px, ${ty}px)`;
            p.style.opacity = '0';
        });

        setTimeout(() => p.remove(), 500);
    }
}

function formatNumber(num) {
    return num.toLocaleString();
}

// Save/Load System
function saveGame() {
    const saveData = {
        poopCount: gameState.poopCount,
        totalPoopProduced: gameState.totalPoopProduced,
        goldEssence: gameState.goldEssence,
        items: {}
    };

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
            gameState.totalPoopProduced = data.totalPoopProduced || 0;

            // Migration for old saves or if total is less than current (sanity check)
            if (gameState.totalPoopProduced < gameState.poopCount) {
                gameState.totalPoopProduced = gameState.poopCount;
            }

            gameState.goldEssence = data.goldEssence || 0;

            if (data.items) {
                for (const key in data.items) {
                    if (gameState.items[key]) {
                        gameState.items[key].count = data.items[key];
                    }
                }
            }
            recalculatePpS();
            checkPrestigeCondition();
        } catch (e) {
            console.error("Failed to load save", e);
        }
    }
}

// Start
init();
