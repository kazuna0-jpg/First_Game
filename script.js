// Game Core States
let hp = 100;
let hunger = 100;
let gold = 50;
let floor = 1;
let baseAtk = 12;

let activeWeapon = 'sword'; 
let currentSkin = 'Default Swordsman';
let potions = 1;
let activeMission = null;

const logBox = document.getElementById('log-box');

// 🎨 2D CANVAS ANIMATION INITIALIZATION
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d');

// Animation positions
let playerX = 80;
let playerY = 120;
let enemyX = 450;
let enemyY = 120;
let isAttacking = false;
let attackFrame = 0;
let currentEnemyType = 'none'; // 'none', 'kobold', 'boss'

// 🔊 Voice System
function speakVoice(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        let utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US';
        utterance.rate = 1.1;
        window.speechSynthesis.speak(utterance);
    }
}

function log(message) {
    logBox.innerHTML += `<p style="margin: 4px 0;">${message}</p>`;
    logBox.scrollTop = logBox.scrollHeight;
}

// 💾 SAVE & LOAD SYSTEM
function saveGame() {
    const dataToSave = { hp, hunger, gold, floor, baseAtk, activeWeapon, currentSkin, potions };
    localStorage.setItem('aincrad_2d_save', JSON.stringify(dataToSave));
    log("💾 [System] Game saved successfully!");
}

function loadGame() {
    const savedData = localStorage.getItem('aincrad_2d_save');
    if (savedData) {
        const parsed = JSON.parse(savedData);
        hp = parsed.hp;
        hunger = parsed.hunger;
        gold = parsed.gold;
        floor = parsed.floor;
        baseAtk = parsed.baseAtk;
        activeWeapon = parsed.activeWeapon || 'sword';
        currentSkin = parsed.currentSkin || 'Default Swordsman';
        potions = parsed.potions;
    }
    updateUI();
}

function clearSave() {
    localStorage.removeItem('aincrad_2d_save');
    location.reload();
}

// 🔄 2D DRAWING ENGINE (Patuloy na nag-a-animate sa background)
function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height); // Burahin ang nakaraang frame

    // 1. Draw Floor/Ground Background
    ctx.fillStyle = '#1f2937';
    ctx.fillRect(0, 140, canvas.width, 40);
    ctx.fillStyle = '#4b5563';
    ctx.fillRect(0, 140, canvas.width, 4);

    // 2. Determine Player Color base sa Skin
    let playerColor = '#38bdf8'; // Default Blue
    if (currentSkin === 'Knights of the Blood') playerColor = '#ef4444'; // Red/White
    if (currentSkin === 'Dual Wielder') playerColor = '#a855f7'; // Purple

    // Trigger basic advance push movement animation kapag umaatake
    let currentX = playerX;
    if (isAttacking) {
        currentX += (10 - Math.abs(attackFrame - 10)) * 4;
        attackFrame++;
        if (attackFrame > 20) {
            isAttacking = false;
            attackFrame = 0;
            currentEnemyType = 'none'; // I-clear ang kalaban pagkatapos ng atake
        }
    }

    // 3. Draw Player 2D Figure (Simple Character Vector Style)
    ctx.fillStyle = playerColor;
    ctx.fillRect(currentX, playerY - 40, 25, 40); // Body
    ctx.fillStyle = '#f3f4f6';
    ctx.beginPath();
    ctx.arc(currentX + 12.5, playerY - 50, 10, 0, Math.PI * 2); // Head
    ctx.fill();

    // Draw Weapon Line (Sword / Bow)
    ctx.strokeStyle = (activeWeapon === 'sword') ? '#ffffff' : '#f59e0b';
    ctx.lineWidth = 3;
    ctx.beginPath();
    if (activeWeapon === 'sword') {
        ctx.moveTo(currentX + 25, playerY - 20);
        ctx.lineTo(currentX + 45, playerY - 35); // Sword pointing forward
    } else {
        ctx.arc(currentX + 25, playerY - 20, 12, -Math.PI/2, Math.PI/2); // Bow arc
    }
    ctx.stroke();

    // 4. Draw Enemy Figure if present
    if (currentEnemyType !== 'none') {
        let enemyColor = (currentEnemyType === 'boss') ? '#be123c' : '#10b981';
        let enemySize = (currentEnemyType === 'boss') ? 55 : 35;

        ctx.fillStyle = enemyColor;
        ctx.fillRect(enemyX, playerY - enemySize, 30, enemySize); // Enemy Body
        ctx.fillStyle = '#cfd8dc';
        ctx.beginPath();
        ctx.arc(enemyX + 15, playerY - enemySize - 10, 10, 0, Math.PI * 2); // Enemy Head
        ctx.fill();
    }

    requestAnimationFrame(drawGame); // Tawagin ulit ang susunod na frame
}

// UPDATE INTERFACE
function updateUI() {
    let weaponBonus = (activeWeapon === 'sword') ? 5 : 3;
    let skinBonus = (currentSkin === 'Dual Wielder') ? 15 : (currentSkin === 'Knights of the Blood' ? 8 : 0);
    let totalAtk = baseAtk + weaponBonus + skinBonus;

    document.getElementById('hp-display').innerText = hp;
    document.getElementById('hunger-display').innerText = hunger;
    document.getElementById('atk-display').innerText = totalAtk;
    document.getElementById('gold-display').innerText = gold;
    document.getElementById('potions-count').innerText = potions;
    document.getElementById('floor-display').innerText = `FLOOR: ${floor} / 100`;
    document.getElementById('skin-display').innerText = currentSkin;
    document.getElementById('weapon-display').innerText = activeWeapon.toUpperCase();

    if (hp <= 0) {
        log("💀 [GAME OVER] Link Start Interrupted. NerveGear disconnected.");
        speakVoice("Game over.");
        disableButtons();
    }
}

function disableButtons() {
    document.querySelectorAll('button').forEach(btn => btn.disabled = true);
}

// GAME ACTIONS WITH ANIMATION TRIGGERS
function triggerAttackAnimation(enemyType) {
    isAttacking = true;
    attackFrame = 0;
    currentEnemyType = enemyType;
}

function switchWeapon(type) {
    activeWeapon = type;
    log(`🔄 Nagpalit ng armas: **${type.toUpperCase()}**.`);
    speakVoice(`Equipped ${type}`);
    updateUI();
    saveGame();
}

function buySkin(skinName, cost) {
    if (gold >= cost) {
        gold -= cost;
        currentSkin = skinName;
        log(`👗 Ginamit ang skin na: **${skinName}**`);
        speakVoice(`Skin activated`);
        updateUI();
        saveGame();
    } else {
        log("❌ Kulang ang iyong Col!");
        speakVoice("Not enough money");
    }
}

function explore() {
    if (hunger <= 0) {
        log("⚠️ Gutom na gutom ka na! Bawas 15 HP.");
        hp -= 15;
        updateUI();
        return;
    }
    hunger -= 10;
    let roll = Math.random();

    if (roll < 0.60) {
        let mAtk = (activeWeapon === 'bow') ? (2 + (floor * 1)) : (5 + (floor * 2));
        let reward = 25 + (floor * 5);

        hp -= mAtk;
        gold += reward;
        log(`⚔️ Inatake ka ng **Floor ${floor} Kobold**! -${mAtk} HP. +${reward} Col.`);
        speakVoice("Enemy detected.");
        
        triggerAttackAnimation('kobold'); // 🌟 2D ATK TRIGGER

        if (activeMission && activeMission.type === 'hunt') {
            activeMission.progress++;
            if (activeMission.progress >= activeMission.target) {
                log(`🎉 [MISSION SUCCESS] +${activeMission.reward} Col!`);
                gold += activeMission.reward;
                activeMission = null;
                document.getElementById('mission-content').innerText = "Walang aktibong mission.";
            } else {
                document.getElementById('mission-content').innerText = `🎯 Hunt Target: ${activeMission.progress}/${activeMission.target} Kobolds slain.`;
            }
        }
    } else {
        log("🌲 Payapa mong natingnan ang paligid ng kagubatan.");
    }
    updateUI();
}

function checkMissions() {
    if (activeMission) return;
    activeMission = { type: 'hunt', progress: 0, target: 2, reward: 50 };
    log("📜 [MISSION] Patayin ang 2 Kobolds.");
    document.getElementById('mission-content').innerText = `🎯 Hunt Target: 0/2 Kobolds slain.`;
}

function usePotion() {
    if (potions > 0) {
        potions--;
        hp = Math.min(100, hp + 40);
        log("🧪 Ginamit ang Potion! +40 HP.");
    }
    updateUI();
}

function buySupplies() {
    if (gold >= 30) {
        gold -= 30;
        hunger = Math.min(100, hunger + 50);
        log("🛒 Bumili ka ng rasyon ng pagkain.");
    }
    updateUI();
}

function startRaid() {
    log(`📢 Entering Floor ${floor} Boss Room!`);
    let bossHp = 60 + (floor * 35);
    let partySupport = Math.floor(Math.random() * 25) + 15;
    let weaponBonus = (activeWeapon === 'sword') ? 5 : 3;
    let skinBonus = (currentSkin === 'Dual Wielder') ? 15 : (currentSkin === 'Knights of the Blood' ? 8 : 0);
    
    triggerAttackAnimation('boss'); // 🌟 2D BOSS ATK TRIGGER

    if ((baseAtk + weaponBonus + skinBonus + partySupport) >= bossHp) {
        log(`🏆 **VICTORY!** Nakaakyat sa **Floor ${floor + 1}**!`);
        floor++;
        hp = 100;
        hunger = 100;
        saveGame();
    } else {
        hp -= 45;
        log(`💥 **RAID FAILED!** Nasugatan ka ng malubha.`);
    }
    updateUI();
}

// Start Loops
loadGame();
drawGame(); // Simulan ang pag-render ng 2D animation panel
