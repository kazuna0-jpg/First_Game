// Game Core States
let hp = 100;
let hunger = 100;
let gold = 50;
let floor = 1;
let baseAtk = 12;

// Features State
let activeWeapon = 'sword'; // 'sword' o 'bow'
let currentSkin = 'Default Swordsman';
let potions = 1;
let activeMission = null;

const logBox = document.getElementById('log-box');

// 🔊 Text-To-Speech System para sa AI Voice Acting / Sounds nang walang panlabas na audio files
function speakVoice(text) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Patigilin ang nakaraang boses para walang patong-patong
        let utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = 'en-US'; // Mas maganda pakinggan sa English ang fantasy game text
        utterance.rate = 1.1; // Bilis ng boses
        window.speechSynthesis.speak(utterance);
    }
}

function log(message) {
    logBox.innerHTML += `<p style="margin: 4px 0;">${message}</p>`;
    logBox.scrollTop = logBox.scrollHeight;
}

// 💾 SAVE SYSTEM: Isinusulat ang data sa browser memory
function saveGame() {
    const dataToSave = { hp, hunger, gold, floor, baseAtk, activeWeapon, currentSkin, potions };
    localStorage.setItem('aincrad_save', JSON.stringify(dataToSave));
    log("💾 [System] Game saved successfully!");
}

// 📂 LOAD SYSTEM: Binabasa ang huling laro pagkabukas ng page
function loadGame() {
    const savedData = localStorage.getItem('aincrad_save');
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
    localStorage.removeItem('aincrad_save');
    location.reload(); // I-refresh ang laro para bumalik sa simula
}

// UPDATE INTERFACE
function updateUI() {
    // Kunin ang kalkulasyon ng lakas base sa armas at skin
    let weaponBonus = (activeWeapon === 'sword') ? 5 : 3; // Mas malakas ang sword, pero may hiwalay na perk ang bow sa survival
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
        speakVoice("Game over. Link Start Interrupted.");
        disableButtons();
    }
}

function disableButtons() {
    document.querySelectorAll('button').forEach(btn => btn.disabled = true);
}

// ACTION: WEAPON SWITCH
function switchWeapon(type) {
    activeWeapon = type;
    log(`🔄 Nagpalit ka ng armas! Gamit mo na ngayon ang **${type.toUpperCase()}**.`);
    speakVoice(`Equipped ${type}`);
    updateUI();
    saveGame(); // Auto save tuwing nagpapalit ng equipment
}

// ACTION: BUY SKIN
function buySkin(skinName, cost) {
    if (gold >= cost) {
        gold -= cost;
        currentSkin = skinName;
        log(`👗 [SHOP] Salamat sa pagbili! Isinuot mo na ang skin na: **${skinName}** (+Stats Included)`);
        speakVoice(`New skin activated`);
        updateUI();
        saveGame();
    } else {
        log("❌ Kulang ang iyong Col (Gold) para sa skin na ito!");
        speakVoice("Not enough money");
    }
}

// ACTION: EXPLORE AREA
function explore() {
    if (hunger <= 0) {
        log("⚠️ Gutom na gutom ka na! Bawas 15 HP kada galaw.");
        hp -= 15;
        updateUI();
        return;
    }

    hunger -= 10;
    let roll = Math.random();

    if (roll < 0.50) {
        // Battle
        let mHp = 15 + (floor * 10);
        // Kung Bow ang gamit mo, mas malayo ka kaya mas bawas ang matatanggap mong pinsala (Ranged Advantage)
        let mAtk = (activeWeapon === 'bow') ? (2 + (floor * 1)) : (5 + (floor * 2));
        let reward = 25 + (floor * 5);

        hp -= mAtk;
        gold += reward;
        log(`⚔️ Inatake ka ng **Floor ${floor} Kobold**! Nabawasan ka ng ${mAtk} HP. Napatay mo ito gamit ang iyong ${activeWeapon}! +${reward} Col.`);
        speakVoice("Enemy detected. Battle engaged.");

        if (activeMission && activeMission.type === 'hunt') {
            activeMission.progress++;
            if (activeMission.progress >= activeMission.target) {
                log(`🎉 [MISSION SUCCESS] Kumpleto na ang Hunt mission! +${activeMission.reward} Col!`);
                speakVoice("Mission accomplished.");
                gold += activeMission.reward;
                activeMission = null;
                document.getElementById('mission-content').innerText = "Walang aktibong mission. Maghanap sa board.";
            } else {
                document.getElementById('mission-content').innerText = `🎯 Hunt Target: ${activeMission.progress}/${activeMission.target} Kobolds slain.`;
            }
        }
    } else {
        log("🌲 Payapa mong natingnan ang paligid ng kagubatan.");
    }
    updateUI();
}

// ACTION: MISSIONS
function checkMissions() {
    if (activeMission) {
        log("❌ May ginagawa ka pang Mission kasalukuyan!");
        return;
    }
    activeMission = { type: 'hunt', progress: 0, target: 2, reward: 50 };
    log("📜 [MISSION ACCEPTED]: Patayin ang 2 Kobolds para sa dagdag na 50 Col.");
    speakVoice("Mission accepted.");
    document.getElementById('mission-content').innerText = `🎯 Hunt Target: 0/2 Kobolds slain.`;
}

// ACTION: USE POTION
function usePotion() {
    if (potions > 0) {
        potions--;
        hp = Math.min(100, hp + 40);
        log("🧪 Ininom mo ang Potion! Naibalik ang 40 HP.");
        speakVoice("Potion consumed.");
    } else {
        log("❌ Wala ka nang Potion!");
    }
    updateUI();
}

// ACTION: BUY SUPPLIES
function buySupplies() {
    if (gold >= 30) {
        gold -= 30;
        hunger = Math.min(100, hunger + 50);
        log("🛒 Bumili ka ng rasyon ng pagkain. Naibalik ang 50 Hunger.");
        speakVoice("Supplies purchased.");
    } else {
        log("❌ Kulang ang Col mo!");
    }
    updateUI();
}

// ACTION: FLOOR BOSS RAID
function startRaid() {
    log(`📢 **[RAID START] Pumasok ka na sa Floor ${floor} Boss Room kasama ang iyong Raid Team!**`);
    speakVoice("Raid group entering boss room.");

    let bossHp = 60 + (floor * 35);
    let partySupport = Math.floor(Math.random() * 25) + 15;
    let weaponBonus = (activeWeapon === 'sword') ? 5 : 3;
    let skinBonus = (currentSkin === 'Dual Wielder') ? 15 : (currentSkin === 'Knights of the Blood' ? 8 : 0);
    let myTotalAtk = baseAtk + weaponBonus + skinBonus;

    let totalDmg = myTotalAtk + partySupport;

    if (totalDmg >= bossHp) {
        log(`🏆 **VICTORY!** Natalo ninyo ang Boss! Nakaakyat ka sa **Floor ${floor + 1}**!`);
        speakVoice("Congratulations. Floor cleared.");
        floor++;
        hp = 100;
        hunger = 100;
        saveGame(); // Auto-save pag-akyat ng bagong floor
    } else {
        let penalty = 40 + (floor * 5);
        hp -= penalty;
        log(`💥 **RAID FAILED!** Napakalakas ng Boss counter-attack. Sugatan ka ng ${penalty} HP at napaurong ang team.`);
        speakVoice("Raid failed. Warning. Critical damage taken.");
    }
    updateUI();
}

// Pagkabukas ng laro, i-load ang save file
loadGame();
