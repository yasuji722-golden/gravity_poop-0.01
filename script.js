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

// Achievement Data
const ACHIEVEMENTS = [
    {
        id: 'ACH01',
        title: 'First Click!',
        description: 'Click the poop for the first time.',
        condition: (state) => state.clickCount >= 1
    },
    {
        id: 'ACH02',
        title: 'Toilet Master',
        description: 'Own 50 Toilets.',
        condition: (state) => state.items.toilet.count >= 50
    },
    {
        id: 'ACH03',
        title: 'Tycoon',
        description: 'Generate 1,000,000 total poop.',
        condition: (state) => state.totalPoopProduced >= 1000000
    },
    {
        id: 'ACH04',
        title: 'Time Traveler',
        description: 'Perform a Prestige reset.',
        condition: (state) => state.goldEssence >= 1
    }
];

// Game State
let gameState = {
    poopCount: 0,
    totalPoopProduced: 0,
    clickCount: 0, // Track manual clicks
    goldEssence: 0,
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
        },
        solar_generator: {
            id: 'solar_generator',
            name: 'Solar Poop Generator',
            baseCost: 100000,
            pps: 1000,
            count: 0,
            icon: 'solar_generator_icon.png'
        },
        cosmic_temple: {
            id: 'cosmic_temple',
            name: 'Cosmic Poop Temple',
            baseCost: 1000000,
            pps: 10000,
            count: 0,
            icon: 'cosmic_temple_icon.png'
        }
    },
    modifiers: {
        globalMultiplier: 1
    },
    unlockedAchievements: [] // Store IDs of unlocked achievements
};

// DOM Elements
const els = {
    poopCount: document.getElementById('poop-count'),
    ppsCount: document.getElementById('pps-count'),
    goldEssenceCount: document.getElementById('gold-essence-count'),
    poopButton: document.getElementById('poop-button'),
    store: document.getElementById('store'),
    achievementsList: document.getElementById('achievements-list'),
    goldenPoopContainer: document.getElementById('golden-poop-container'),
    prestigeButton: document.getElementById('prestige-button'),
    notificationContainer: document.getElementById('notification-container')
};

// Initialization
function init() {
    loadGame();
    renderStore();
    renderAchievements();
    updateUI();

    // Event Listeners
    els.poopButton.addEventListener('click', clickPoop);
    els.prestigeButton.addEventListener('click', doPrestige);

    // Passive Income Loop
    setInterval(passiveIncome, 100);

    // Auto Save
    setInterval(saveGame, CONFIG.autoSaveInterval);

    // Golden Poop Spawner
    setInterval(trySpawnGoldenPoop, 1000);

    // Achievement Check Loop
    setInterval(checkAchievements, 1000);
}

// Core Mechanics
function clickPoop(e) {
    const amount = 1 * getGlobalMultiplier();
    gameState.clickCount++; // Increment click count
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
        renderStore();
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
    els.prestigeButton.classList.remove('hidden');

    if (gameState.totalPoopProduced >= CONFIG.prestigeThreshold) {
        els.prestigeButton.disabled = false;
        els.prestigeButton.textContent = "Prestige Available!";
        els.prestigeButton.title = "Reset for Gold Essence";
    } else {
        els.prestigeButton.disabled = true;
        const percent = Math.floor((gameState.totalPoopProduced / CONFIG.prestigeThreshold) * 100);
        els.prestigeButton.textContent = `Prestige: ${percent}%`;
        els.prestigeButton.title = `Unlock at ${formatNumber(CONFIG.prestigeThreshold)} Total Poops`;
    }
}

function doPrestige() {
    if (confirm("Are you sure you want to PRESTIGE? You will lose all progress but gain 1 Gold Essence (+10% permanent bonus).")) {
        gameState.goldEssence += 1;

        gameState.poopCount = 0;
        gameState.totalPoopProduced = 0;
        gameState.clickCount = 0; // Optional: reset click count? Let's keep it for stats if needed, but reset for gameplay feel? Usually prestige resets run stats. Let's reset it.
        gameState.pps = 0;
        gameState.modifiers.globalMultiplier = 1;

        for (const key in gameState.items) {
            gameState.items[key].count = 0;
        }

        saveGame();
        renderStore();
        updateUI();
        checkPrestigeCondition();

        alert("PRESTIGE SUCCESSFUL! You now have " + gameState.goldEssence + " Gold Essence.");
    }
}

// Achievement System
function checkAchievements() {
    ACHIEVEMENTS.forEach(ach => {
        if (!gameState.unlockedAchievements.includes(ach.id)) {
            if (ach.condition(gameState)) {
                unlockAchievement(ach);
            }
        }
    });
}

function unlockAchievement(achievement) {
    gameState.unlockedAchievements.push(achievement.id);
    showNotification(achievement.title);
    renderAchievements(); // Update UI to show unlocked state
    saveGame();
}

function showNotification(title) {
    const notif = document.createElement('div');
    notif.className = 'notification';
    notif.innerHTML = `
        <h4>Achievement Unlocked!</h4>
        <p>${title}</p>
    `;
    els.notificationContainer.appendChild(notif);

    // Remove after 5 seconds
    setTimeout(() => {
        notif.style.opacity = '0';
        notif.style.transform = 'translateX(100%)';
        setTimeout(() => notif.remove(), 500);
    }, 5000);
}

function renderAchievements() {
    els.achievementsList.innerHTML = '';
    ACHIEVEMENTS.forEach(ach => {
        const isUnlocked = gameState.unlockedAchievements.includes(ach.id);
        const el = document.createElement('div');
        el.className = `achievement-item ${isUnlocked ? 'unlocked' : ''}`;
        el.innerHTML = `
            <div class="achievement-title">${ach.title} ${isUnlocked ? '✅' : '🔒'}</div>
            <div class="achievement-desc">${ach.description}</div>
        `;
        els.achievementsList.appendChild(el);
    });
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
        clickCount: gameState.clickCount,
        goldEssence: gameState.goldEssence,
        unlockedAchievements: gameState.unlockedAchievements,
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
            gameState.clickCount = data.clickCount || 0;

            if (gameState.totalPoopProduced < gameState.poopCount) {
                gameState.totalPoopProduced = gameState.poopCount;
            }

            gameState.goldEssence = data.goldEssence || 0;
            gameState.unlockedAchievements = data.unlockedAchievements || [];

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
