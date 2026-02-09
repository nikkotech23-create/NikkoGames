/* ============================================
   SECTION 0: CANVAS & BASIC SETUP
   ============================================ */
const canvas = document.getElementById("game-canvas");
const ctx = canvas.getContext("2d");

function resizeCanvas() {
  const rect = canvas.getBoundingClientRect();
  canvas.width = rect.width * window.devicePixelRatio;
  canvas.height = rect.height * window.devicePixelRatio;
  ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
}
window.addEventListener("resize", resizeCanvas);
resizeCanvas();

/* ============================================
   SECTION 1: ASSETS (IMAGES & AUDIO)
   ============================================ */
const IMAGES = {
  player: new Image(),
  enemyTriangle: new Image(),
  enemyCrab: new Image(),
  enemyUfo: new Image(),
  boss1: new Image(),
  boss2: new Image(),
  boss3: new Image(),
  boss4: new Image(),
  boss5: new Image()
};

IMAGES.player.src = "assets/ships/player_ship.png";
IMAGES.enemyTriangle.src = "assets/ships/enemy_triangle.png";
IMAGES.enemyCrab.src = "assets/ships/enemy_crab.png";
IMAGES.enemyUfo.src = "assets/ships/enemy_ufo.png";

IMAGES.boss1.src = "assets/bosses/boss1.png";
IMAGES.boss2.src = "assets/bosses/boss2.png";
IMAGES.boss3.src = "assets/bosses/boss3.png";
IMAGES.boss4.src = "assets/bosses/boss4.png";
IMAGES.boss5.src = "assets/bosses/boss5.png";

const sounds = {
  music: new Audio("assets/audio/music_bg.mp3"),
  laser: new Audio("assets/audio/laser.wav"),
  explosion: new Audio("assets/audio/explosion.wav"),
  bossLaser: new Audio("assets/audio/boss_laser.wav")
};
sounds.music.loop = true;
sounds.music.volume = 0.5;

/* ============================================
   SECTION 2: GLOBAL GAME STATE
   ============================================ */
let gameState = "title";
// title | story | dialogue | cutscene | play | boss | warp | landing | paradise | endless | gameover

let isPaused = false;
let musicOn = true;
let controlMode = "touch";

let player = {
  x: 200,
  y: 400,
  angle: -Math.PI / 2,
  vx: 0,
  vy: 0,
  radius: 20,
  alive: true,
  shield: 0,
  weaponLevel: 1
};

let moveInput = { x: 0, y: 0 }; // steady directional movement

let bullets = [];
let bulletCooldown = 0;
let bulletCooldownBase = 0.2;

let enemies = [];
let enemySpawnTimer = 0;

let bosses = [null, null, null, null, null]; // index 0..4
let currentBossIndex = -1;
let miniBoss = null;

let bossBullets = [];

let explosions = [];
let powerups = [];

let score = 0;
let lives = 3;
let highScore = 0;

let currentLevel = 1;
let currentStoryIndex = 0;
let currentCutscene = null;

let warpTime = 0;
let landingTime = 0;

let killsThisLevel = 0;
let miniBossSpawned = false;

let endlessMode = false;

/* screen shake */
let shakeTime = 0;
let shakeIntensity = 0;

/* ============================================
   SECTION 3: LEVELS, STORY, CUTSCENES
   ============================================ */
const levelConfigs = [
  { id: 1, spawnRate: 1.2, enemySpeed: 1 },
  { id: 2, spawnRate: 1.0, enemySpeed: 1.2 },
  { id: 3, spawnRate: 0.9, enemySpeed: 1.4 },
  { id: 4, spawnRate: 0.8, enemySpeed: 1.6 },
  { id: 5, spawnRate: 0.7, enemySpeed: 1.8 }
];

const storyScreens = [
  "You leave the ruins of the Outer Belt...",
  "The Nebula of Echoes hums with forgotten wars...",
  "Beyond the Rift, a new threat awakens...",
  "The guardians of Paradise grow stronger...",
  "The final path to Paradise opens..."
];

const cutscenes = {
  afterBoss1: { type: "afterBoss1", time: 0, duration: 3 },
  afterBoss2: { type: "afterBoss2", time: 0, duration: 3 },
  afterBoss3: { type: "afterBoss3", time: 0, duration: 3 },
  afterBoss4: { type: "afterBoss4", time: 0, duration: 3 },
  afterBoss5: { type: "afterBoss5", time: 0, duration: 3 }
};

const bossDialogues = {
  1: "Boss 1: You shall not pass the Outer Belt!",
  2: "Boss 2: The Nebula of Echoes will be your grave.",
  3: "Boss 3: Beyond the Rift, only void awaits you.",
  4: "Boss 4: Paradise is not for mortals.",
  5: "Final Boss: You are not worthy of Paradise!"
};

let currentDialogue = null;

/* ============================================
   SECTION 4: PARALLAX STARFIELD
   ============================================ */
const stars = [];
function initStars() {
  stars.length = 0;
  const w = canvas.width / window.devicePixelRatio;
  const h = canvas.height / window.devicePixelRatio;
  for (let i = 0; i < 120; i++) {
    stars.push({
      x: Math.random() * w,
      y: Math.random() * h,
      z: 0.3 + Math.random() * 0.7,
      speed: 20 + Math.random() * 40
    });
  }
}
initStars();

/* ============================================
   SECTION 5: UI ELEMENTS & SAVE SLOTS
   ============================================ */
const btnPause = document.getElementById("btn-pause");
const btnRestart = document.getElementById("btn-restart");
const btnOptions = document.getElementById("btn-options");
const btnExit = document.getElementById("btn-exit");
const btnMusic = document.getElementById("btn-music");
const optionsPanel = document.getElementById("options-panel");
const optionsClose = document.getElementById("options-close");
const volumeSlider = document.getElementById("volume-slider");
const controlModeSelect = document.getElementById("control-mode");
const gamepadStatus = document.getElementById("gamepad-status");

const saveSlots = [null, null, null];

function loadSaveSlots() {
  for (let i = 0; i < 3; i++) {
    try {
      const data = localStorage.getItem("neon_shooter_save_" + i);
      if (data) saveSlots[i] = JSON.parse(data);
    } catch (e) {}
  }
}
function saveToSlot(slotIndex) {
  const data = {
    level: currentLevel,
    score,
    weaponLevel: player.weaponLevel,
    shield: player.shield,
    lives
  };
  saveSlots[slotIndex] = data;
  try {
    localStorage.setItem("neon_shooter_save_" + slotIndex, JSON.stringify(data));
  } catch (e) {}
}
function loadFromSlot(slotIndex) {
  const data = saveSlots[slotIndex];
  if (!data) return;
  currentLevel = data.level;
  score = data.score;
  player.weaponLevel = data.weaponLevel;
  player.shield = data.shield;
  lives = data.lives;
}

try {
  const savedHigh = localStorage.getItem("neon_shooter_highscore");
  if (savedHigh) highScore = parseInt(savedHigh, 10) || 0;
} catch (e) {}

/* ============================================
   SECTION 6: ACHIEVEMENTS
   ============================================ */
const achievements = {
  firstBlood: false,
  bossSlayer1: false,
  bossSlayer2: false,
  bossSlayer3: false,
  bossSlayer4: false,
  bossSlayer5: false,
  paradiseFound: false
};
let achievementPopups = [];

function unlockAchievement(key, label) {
  if (achievements[key]) return;
  achievements[key] = true;
  achievementPopups.push({ label, time: 0, duration: 3 });
  try {
    localStorage.setItem("neon_shooter_achievements", JSON.stringify(achievements));
  } catch (e) {}
}
function loadAchievements() {
  try {
    const data = localStorage.getItem("neon_shooter_achievements");
    if (data) {
      const parsed = JSON.parse(data);
      Object.assign(achievements, parsed);
    }
  } catch (e) {}
}
loadAchievements();

/* ============================================
   SECTION 7: BUTTON HANDLERS
   ============================================ */
btnPause.onclick = () => {
  if (["title", "paradise", "story", "cutscene", "dialogue"].includes(gameState)) return;
  isPaused = !isPaused;
  btnPause.textContent = isPaused ? "Resume" : "Pause";
};

btnRestart.onclick = () => {
  // After Paradise, treat Restart as Endless mode start
  if (gameState === "paradise") {
    endlessMode = true;
    currentLevel = 1;
    resetGame();
    gameState = "endless";
    if (musicOn) sounds.music.play();
  } else {
    endlessMode = false;
    startGame(true);
  }
};

btnOptions.onclick = () => optionsPanel.style.display = "block";
optionsClose.onclick = () => optionsPanel.style.display = "none";

btnExit.onclick = () => alert("Exit requested.");

btnMusic.onclick = () => {
  musicOn = !musicOn;
  btnMusic.textContent = musicOn ? "Music: On" : "Music: Off";
  if (musicOn) sounds.music.play();
  else sounds.music.pause();
};

volumeSlider.oninput = () => {
  const vol = parseFloat(volumeSlider.value);
  sounds.music.volume = vol;
  sounds.laser.volume = vol;
  sounds.explosion.volume = vol;
  sounds.bossLaser.volume = vol;
};

controlModeSelect.onchange = () => {
  controlMode = controlModeSelect.value;
};

/* ============================================
   SECTION 8: TOUCH CONTROLS & JOYSTICK GRAPHICS
   ============================================ */
const touchMove = document.getElementById("touch-move");
const touchFire = document.getElementById("touch-fire");

let touchMoveActive = false;
let touchMoveCenter = { x: 0, y: 0 };
let touchMoveOffset = { x: 0, y: 0 };

function getTouchPos(touch, element) {
  const rect = element.getBoundingClientRect();
  return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
}

touchMove.addEventListener("touchstart", e => {
  if (controlMode !== "touch") return;
  e.preventDefault();
  touchMoveActive = true;
  touchMoveCenter = getTouchPos(e.touches[0], touchMove);
  touchMoveOffset = { x: 0, y: 0 };
}, { passive: false });

touchMove.addEventListener("touchmove", e => {
  if (!touchMoveActive || controlMode !== "touch") return;
  e.preventDefault();
  const pos = getTouchPos(e.touches[0], touchMove);
  const dx = pos.x - touchMoveCenter.x;
  const dy = pos.y - touchMoveCenter.y;
  touchMoveOffset = { x: dx, y: dy };

  const len = Math.hypot(dx, dy);
  if (len > 10) {
    moveInput.x = dx / len;
    moveInput.y = dy / len;
  } else {
    moveInput.x = 0;
    moveInput.y = 0;
  }
}, { passive: false });

touchMove.addEventListener("touchend", () => {
  touchMoveActive = false;
  touchMoveOffset = { x: 0, y: 0 };
  moveInput.x = 0;
  moveInput.y = 0;
});

touchFire.addEventListener("touchstart", e => {
  if (controlMode !== "touch") return;
  e.preventDefault();
  if (gameState === "title") {
    startGame(true);
  } else if (gameState === "story") {
    advanceStory();
  } else if (gameState === "cutscene") {
    skipCutscene();
  } else if (gameState === "dialogue") {
    endDialogueAndSpawnBoss();
  } else if (gameState === "paradise") {
    // tap fire on Paradise -> endless mode
    endlessMode = true;
    currentLevel = 1;
    resetGame();
    gameState = "endless";
  } else {
    tryShoot();
  }
}, { passive: false });

/* ============================================
   SECTION 9: KEYBOARD & GAMEPAD
   ============================================ */
const keys = {};
window.addEventListener("keydown", e => {
  keys[e.code] = true;
  if (gameState === "title" && (e.code === "Space" || e.code === "Enter")) {
    startGame(true);
  } else if (gameState === "story" && (e.code === "Space" || e.code === "Enter")) {
    advanceStory();
  } else if (gameState === "cutscene" && (e.code === "Space" || e.code === "Enter")) {
    skipCutscene();
  } else if (gameState === "dialogue" && (e.code === "Space" || e.code === "Enter")) {
    endDialogueAndSpawnBoss();
  } else if (gameState === "paradise" && (e.code === "Space" || e.code === "Enter")) {
    endlessMode = true;
    currentLevel = 1;
    resetGame();
    gameState = "endless";
  }
});
window.addEventListener("keyup", e => keys[e.code] = false);

function handleKeyboard(dt) {
  if (controlMode !== "keyboard") return;
  if (!["play", "boss", "endless"].includes(gameState)) return;

  moveInput.x = 0;
  moveInput.y = 0;

  if (keys["ArrowLeft"] || keys["KeyA"]) moveInput.x -= 1;
  if (keys["ArrowRight"] || keys["KeyD"]) moveInput.x += 1;
  if (keys["ArrowUp"] || keys["KeyW"]) moveInput.y -= 1;
  if (keys["ArrowDown"] || keys["KeyS"]) moveInput.y += 1;

  const len = Math.hypot(moveInput.x, moveInput.y);
  if (len > 0) {
    moveInput.x /= len;
    moveInput.y /= len;
  }

  if (keys["Space"]) {
    tryShoot();
  }
}

let gamepadIndex = null;

window.addEventListener("gamepadconnected", e => {
  gamepadIndex = e.gamepad.index;
  gamepadStatus.textContent = "Connected";
});

window.addEventListener("gamepaddisconnected", () => {
  gamepadIndex = null;
  gamepadStatus.textContent = "Not connected";
});

function handleGamepad(dt) {
  if (controlMode !== "gamepad") return;
  if (!["play", "boss", "endless"].includes(gameState)) return;
  if (gamepadIndex === null) return;

  const gp = navigator.getGamepads()[gamepadIndex];
  if (!gp) return;

  const axisX = gp.axes[0] || 0;
  const axisY = gp.axes[1] || 0;

  moveInput.x = Math.abs(axisX) > 0.2 ? axisX : 0;
  moveInput.y = Math.abs(axisY) > 0.2 ? axisY : 0;

  const len = Math.hypot(moveInput.x, moveInput.y);
  if (len > 1) {
    moveInput.x /= len;
    moveInput.y /= len;
  }

  if (gp.buttons[0].pressed) {
    tryShoot();
  }
}

/* ============================================
   SECTION 10: CORE GAME FLOW
   ============================================ */
function startGame(fromTitle) {
  resetGame();
  if (fromTitle) {
    currentLevel = 1;
    currentStoryIndex = 0;
    endlessMode = false;
    gameState = "story";
  } else {
    gameState = "play";
  }
  if (musicOn) sounds.music.play();
}

function resetGame() {
  const w = canvas.width / window.devicePixelRatio;
  const h = canvas.height / window.devicePixelRatio;

  player.x = w / 2;
  player.y = h * 0.75;
  player.vx = 0;
  player.vy = 0;
  player.angle = -Math.PI / 2;
  player.alive = true;
  player.shield = 0;
  player.weaponLevel = 1;

  bullets = [];
  enemies = [];
  bossBullets = [];
  explosions = [];
  powerups = [];
  bosses = [null, null, null, null, null];
  currentBossIndex = -1;
  miniBoss = null;

  score = endlessMode ? score : 0;
  lives = 3;
  enemySpawnTimer = 0;
  bulletCooldown = 0;
  bulletCooldownBase = 0.2;
  warpTime = 0;
  landingTime = 0;
  killsThisLevel = 0;
  miniBossSpawned = false;
  moveInput.x = 0;
  moveInput.y = 0;
  shakeTime = 0;
  shakeIntensity = 0;

  isPaused = false;
  btnPause.textContent = "Pause";
  initStars();
}

function advanceStory() {
  currentStoryIndex++;
  if (currentStoryIndex >= storyScreens.length) {
    gameState = "play";
  } else {
    gameState = "play";
  }
}

function startCutscene(name) {
  currentCutscene = { ...cutscenes[name], time: 0 };
  gameState = "cutscene";
}
function skipCutscene() {
  if (!currentCutscene) return;
  if (currentCutscene.type === "afterBoss5") {
    gameState = "warp";
    warpTime = 0;
  } else {
    gameState = "play";
  }
  currentCutscene = null;
}

/* dialogue before boss */
function startBossDialogue(level) {
  currentDialogue = {
    level,
    text: bossDialogues[level] || "An unknown threat approaches..."
  };
  gameState = "dialogue";
}
function endDialogueAndSpawnBoss() {
  if (!currentDialogue) return;
  const level = currentDialogue.level;
  currentDialogue = null;
  spawnBossForLevel(level);
}

/* ============================================
   SECTION 11: SHOOTING, ENEMIES, BOSSES, POWERUPS
   ============================================ */
function tryShoot() {
  if (!player.alive) return;
  if (!["play", "boss", "endless"].includes(gameState)) return;
  if (bulletCooldown > 0) return;

  const speed = 400;
  const patterns = [];
  if (player.weaponLevel === 1) {
    patterns.push(0);
  } else if (player.weaponLevel === 2) {
    patterns.push(-0.1, 0.1);
  } else if (player.weaponLevel === 3) {
    patterns.push(-0.15, 0, 0.15);
  } else if (player.weaponLevel >= 4) {
    patterns.push(-0.2, -0.07, 0.07, 0.2);
  }

  for (const offset of patterns) {
    const angle = -Math.PI / 2 + offset; // always shoot up
    const dx = Math.cos(angle);
    const dy = Math.sin(angle);
    bullets.push({
      x: player.x + dx * 24,
      y: player.y + dy * 24,
      vx: dx * speed,
      vy: dy * speed,
      radius: 4
    });
  }

  bulletCooldown = bulletCooldownBase;
  sounds.laser.currentTime = 0;
  sounds.laser.play();
}

function spawnEnemy() {
  const cfg = levelConfigs.find(l => l.id === currentLevel) || levelConfigs[0];
  const types = ["triangle", "crab", "ufo"];
  const type = types[Math.floor(Math.random() * types.length)];
  const w = canvas.width / window.devicePixelRatio;
  const x = 40 + Math.random() * (w - 80);
  const y = -40;
  const baseSpeed = 40 + Math.random() * 60;

  enemies.push({
    type,
    x,
    y,
    vy: baseSpeed * (cfg.enemySpeed || 1),
    radius: 20,
    hp: 1
  });
}

function spawnMiniBoss(level) {
  const w = canvas.width / window.devicePixelRatio;
  const hpBase = 20 + level * 10;
  miniBoss = {
    level,
    x: w / 2,
    y: 80,
    vx: 60 + level * 10,
    radius: 40,
    hp: hpBase,
    maxHp: hpBase,
    fireCooldown: 0.8,
    img: IMAGES["boss" + Math.max(1, level - 1)]
  };
}

function spawnPowerup(x, y) {
  const types = ["shield", "score", "rapid", "weapon"];
  const type = types[Math.floor(Math.random() * types.length)];
  powerups.push({
    type,
    x,
    y,
    vy: 40,
    radius: 14
  });
}

function applyPowerup(p) {
  if (p.type === "shield") {
    player.shield = Math.min(player.shield + 1, 3);
  } else if (p.type === "score") {
    score += 500;
  } else if (p.type === "rapid") {
    bulletCooldownBase = 0.08;
    setTimeout(() => {
      bulletCooldownBase = 0.2;
    }, 8000);
  } else if (p.type === "weapon") {
    player.weaponLevel = Math.min(player.weaponLevel + 1, 4);
  }
}

function spawnBossForLevel(level) {
  const w = canvas.width / window.devicePixelRatio;
  const imgKey = "boss" + level;
  const hpBase = 80 + (level - 1) * 30;
  const radius = 60 + (level - 1) * 5;

  const boss = {
    level,
    x: w / 2,
    y: 120,
    vx: 50 + level * 10,
    radius,
    hp: hpBase,
    maxHp: hpBase,
    fireCooldown: 0,
    fireRate: 1.2 - level * 0.1,
    img: IMAGES[imgKey],
    patternTime: 0
  };
  bosses[level - 1] = boss;
  currentBossIndex = level - 1;
  gameState = "boss";
}

function bossFirePattern(boss, dt) {
  boss.patternTime += dt;
  const speedBase = 220 + boss.level * 30;

  // unique patterns per level
  if (boss.level === 1) {
    // aimed shots at player
    const angle = Math.atan2(player.y - boss.y, player.x - boss.x);
    const speed = speedBase;
    bossBullets.push({
      x: boss.x,
      y: boss.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 6
    });
  } else if (boss.level === 2) {
    // horizontal wave
    const count = 8;
    for (let i = 0; i < count; i++) {
      const offsetX = -80 + (160 / (count - 1)) * i;
      bossBullets.push({
        x: boss.x + offsetX,
        y: boss.y,
        vx: 0,
        vy: speedBase,
        radius: 6
      });
    }
  } else if (boss.level === 3) {
    // spiral
    const angle = boss.patternTime * 4;
    const speed = speedBase;
    bossBullets.push({
      x: boss.x,
      y: boss.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 6
    });
  } else if (boss.level === 4) {
    // rotating ring
    const count = 12;
    const baseAngle = boss.patternTime * 2;
    for (let i = 0; i < count; i++) {
      const angle = baseAngle + (Math.PI * 2 * i) / count;
      bossBullets.push({
        x: boss.x,
        y: boss.y,
        vx: Math.cos(angle) * speedBase,
        vy: Math.sin(angle) * speedBase,
        radius: 6
      });
    }
  } else if (boss.level === 5) {
    // mixed: ring + aimed
    const count = 10;
    const baseAngle = boss.patternTime * 3;
    for (let i = 0; i < count; i++) {
      const angle = baseAngle + (Math.PI * 2 * i) / count;
      bossBullets.push({
        x: boss.x,
        y: boss.y,
        vx: Math.cos(angle) * (speedBase * 0.8),
        vy: Math.sin(angle) * (speedBase * 0.8),
        radius: 6
      });
    }
    const angleAimed = Math.atan2(player.y - boss.y, player.x - boss.x);
    bossBullets.push({
      x: boss.x,
      y: boss.y,
      vx: Math.cos(angleAimed) * (speedBase * 1.2),
      vy: Math.sin(angleAimed) * (speedBase * 1.2),
      radius: 7
    });
  }

  sounds.bossLaser.currentTime = 0;
  sounds.bossLaser.play();
}

function miniBossFire(mini) {
  const speed = 200 + mini.level * 20;
  const count = 6;
  for (let i = 0; i < count; i++) {
    const angle = (Math.PI * 2 * i) / count;
    bossBullets.push({
      x: mini.x,
      y: mini.y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      radius: 5
    });
  }
  sounds.bossLaser.currentTime = 0;
  sounds.bossLaser.play();
}

/* ============================================
   SECTION 12: UPDATE LOGIC (LEVELS, BOSSES, WARP, LANDING)
   ============================================ */
function update(dt) {
  if (["play", "boss", "endless"].includes(gameState)) {
    updatePlay(dt);
  } else if (gameState === "warp") {
    updateWarp(dt);
  } else if (gameState === "landing") {
    updateLanding(dt);
  } else if (gameState === "cutscene") {
    updateCutscene(dt);
  } else if (gameState === "story") {
    updateStars(dt, 1);
  } else if (gameState === "dialogue") {
    updateStars(dt, 1);
  }
}

function updatePlay(dt) {
  if (!player.alive) {
    gameState = "gameover";
    handleHighScore();
    return;
  }

  const w = canvas.width / window.devicePixelRatio;
  const h = canvas.height / window.devicePixelRatio;

  // steady movement
  const speed = 260;
  player.x += moveInput.x * speed * dt;
  player.y += moveInput.y * speed * dt;

  // clamp to screen
  const margin = 20;
  player.x = Math.max(margin, Math.min(w - margin, player.x));
  player.y = Math.max(margin, Math.min(h - margin, player.y));

  bulletCooldown = Math.max(0, bulletCooldown - dt);
  bullets = bullets.filter(b => {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    return b.x > -40 && b.x < w + 40 && b.y > -40 && b.y < h + 40;
  });

  const cfg = levelConfigs.find(l => l.id === currentLevel) || levelConfigs[0];

  if (gameState === "play" || gameState === "endless") {
    enemySpawnTimer -= dt;
    const spawnRate = endlessMode ? 0.7 : (cfg.spawnRate || 1.2);
    if (enemySpawnTimer <= 0) {
      spawnEnemy();
      enemySpawnTimer = spawnRate;
    }
  }

  enemies = enemies.filter(e => {
    e.y += e.vy * dt;
    return e.y < h + 60;
  });

  powerups = powerups.filter(p => {
    p.y += p.vy * dt;
    return p.y < h + 60;
  });

  // enemy vs bullets
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    for (let j = bullets.length - 1; j >= 0; j--) {
      const b = bullets[j];
      if (circleHit(e.x, e.y, e.radius, b.x, b.y, b.radius)) {
        bullets.splice(j, 1);
        e.hp -= 1;
        if (!achievements.firstBlood) unlockAchievement("firstBlood", "First Blood");
        if (e.hp <= 0) {
          enemies.splice(i, 1);
          addExplosion(e.x, e.y);
          score += 100;
          killsThisLevel++;
          if (Math.random() < 0.25) spawnPowerup(e.x, e.y);

          // mini-boss at 5 kills (once per level)
          if (!miniBossSpawned && killsThisLevel >= 5 && !miniBoss && !endlessMode) {
            miniBossSpawned = true;
            spawnMiniBoss(currentLevel);
          }

          // boss at 10 kills (primary trigger)
          if (!endlessMode && killsThisLevel >= 10 && currentBossIndex < currentLevel - 1 && !bosses[currentLevel - 1] && !currentDialogue && miniBoss === null) {
            enemies = [];
            startBossDialogue(currentLevel);
          }
        }
        break;
      }
    }
  }

  // safety: ensure boss dialogue still triggers if conditions are met
  if (
    !endlessMode &&
    killsThisLevel >= 10 &&
    !bosses[currentLevel - 1] &&
    currentBossIndex < 0 &&
    !currentDialogue &&
    miniBoss === null
  ) {
    enemies = [];
    startBossDialogue(currentLevel);
  }

  // powerups vs player
  for (let i = powerups.length - 1; i >= 0; i--) {
    const p = powerups[i];
    if (circleHit(p.x, p.y, p.radius, player.x, player.y, player.radius)) {
      powerups.splice(i, 1);
      applyPowerup(p);
    }
  }

  // enemies vs player
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (circleHit(e.x, e.y, e.radius, player.x, player.y, player.radius)) {
      enemies.splice(i, 1);
      addExplosion(player.x, player.y);
      triggerShake(0.4, 8);
      if (player.shield > 0) {
        player.shield -= 1;
      } else {
        lives -= 1;
        if (lives <= 0) {
          player.alive = false;
          gameState = "gameover";
          handleHighScore();
        }
      }
    }
  }

  // mini-boss update (guard against null)
  if (miniBoss !== null) {
    updateMiniBoss(dt, miniBoss);
  }

  // main boss update
  if (gameState === "boss" && currentBossIndex >= 0) {
    updateBoss(dt, bosses[currentBossIndex]);
  }

  // boss bullets
  bossBullets = bossBullets.filter(bb => {
    bb.x += bb.vx * dt;
    bb.y += bb.vy * dt;
    const inside = bb.x > -40 && bb.x < w + 40 && bb.y > -40 && bb.y < h + 40;
    if (inside && circleHit(bb.x, bb.y, bb.radius, player.x, player.y, player.radius)) {
      addExplosion(player.x, player.y);
      triggerShake(0.4, 8);
      if (player.shield > 0) {
        player.shield -= 1;
      } else {
        lives -= 1;
        if (lives <= 0) {
          player.alive = false;
          gameState = "gameover";
          handleHighScore();
        }
      }
      return false;
    }
    return inside;
  });

  updateStars(dt, 1);
  updateShake(dt);
}

function updateMiniBoss(dt, mini) {
  const w = canvas.width / window.devicePixelRatio;

  mini.x += mini.vx * dt;
  if (mini.x < 60 || mini.x > w - 60) mini.vx *= -1;

  mini.fireCooldown -= dt;
  if (mini.fireCooldown <= 0) {
    miniBossFire(mini);
    mini.fireCooldown = 1.2;
  }

  // bullets vs mini-boss
  for (let j = bullets.length - 1; j >= 0; j--) {
    const b = bullets[j];
    if (circleHit(mini.x, mini.y, mini.radius, b.x, b.y, b.radius)) {
      bullets.splice(j, 1);
      mini.hp -= 1;
      addExplosion(b.x, b.y);
      score += 15;
      if (mini.hp <= 0) {
        addExplosion(mini.x, mini.y);
        triggerShake(0.5, 10);
        miniBoss = null;          // remove mini-boss
        // miniBossSpawned stays true so it won't respawn this level
      }
      break;
    }
  }

  // mini-boss vs player
  if (circleHit(mini.x, mini.y, mini.radius, player.x, player.y, player.radius)) {
    addExplosion(player.x, player.y);
    triggerShake(0.5, 10);
    if (player.shield > 0) {
      player.shield -= 1;
    } else {
      lives -= 1;
      if (lives <= 0) {
        player.alive = false;
        gameState = "gameover";
        handleHighScore();
      }
    }
  }
}

function updateBoss(dt, boss) {
  const w = canvas.width / window.devicePixelRatio;

  boss.x += boss.vx * dt;
  if (boss.x < 80 || boss.x > w - 80) boss.vx *= -1;

  boss.fireCooldown -= dt;
  if (boss.fireCooldown <= 0) {
    bossFirePattern(boss, dt);
    boss.fireCooldown = Math.max(0.4, boss.fireRate);
  }

  for (let j = bullets.length - 1; j >= 0; j--) {
    const b = bullets[j];
    if (circleHit(boss.x, boss.y, boss.radius, b.x, b.y, b.radius)) {
      bullets.splice(j, 1);
      boss.hp -= 1;
      addExplosion(b.x, b.y);
      triggerShake(0.3, 6);
      score += 20;
      if (boss.hp <= 0) {
        addExplosion(boss.x, boss.y);
        triggerShake(0.7, 12);
        const idx = boss.level - 1;
        bosses[idx] = null;
        currentBossIndex = -1;
        unlockAchievement("bossSlayer" + boss.level, "Boss Slayer " + boss.level);

        if (!endlessMode) {
          currentLevel++;
          killsThisLevel = 0;
          miniBossSpawned = false;
          miniBoss = null;

          if (currentLevel <= 5) {
            startCutscene("afterBoss" + boss.level);
          } else {
            startCutscene("afterBoss5");
          }
        } else {
          // endless: could scale difficulty here
        }
      }
      break;
    }
  }

  if (circleHit(boss.x, boss.y, boss.radius, player.x, player.y, player.radius)) {
    addExplosion(player.x, player.y);
    triggerShake(0.7, 12);
    if (player.shield > 0) {
      player.shield -= 1;
    } else {
      lives -= 1;
      if (lives <= 0) {
        player.alive = false;
        gameState = "gameover";
        handleHighScore();
      }
    }
  }
}

function updateWarp(dt) {
  warpTime += dt;
  updateStars(dt, 6);
  if (warpTime > 3) {
    gameState = "landing";
    landingTime = 0;
  }
}

function updateLanding(dt) {
  landingTime += dt;
  updateStars(dt, 0.5);
  if (landingTime > 2) {
    gameState = "paradise";
    unlockAchievement("paradiseFound", "Paradise Found");
  }
}

function updateCutscene(dt) {
  if (!currentCutscene) return;
  currentCutscene.time += dt;
  updateStars(dt, 1);
  if (currentCutscene.time >= currentCutscene.duration) {
    skipCutscene();
  }
}

/* ============================================
   SECTION 13: COLLISION, EXPLOSIONS, SHAKE, HIGH SCORE
   ============================================ */
function circleHit(x1, y1, r1, x2, y2, r2) {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return dx * dx + dy * dy <= (r1 + r2) * (r1 + r2);
}

function addExplosion(x, y) {
  explosions.push({
    x,
    y,
    time: 0,
    duration: 0.5
  });
  sounds.explosion.currentTime = 0;
  sounds.explosion.play();
}

function handleHighScore() {
  if (score > highScore) {
    highScore = score;
    try {
      localStorage.setItem("neon_shooter_highscore", String(highScore));
    } catch (e) {}
  }
}

function triggerShake(time, intensity) {
  shakeTime = Math.max(shakeTime, time);
  shakeIntensity = Math.max(shakeIntensity, intensity);
}

function updateShake(dt) {
  if (shakeTime > 0) {
    shakeTime -= dt;
    if (shakeTime <= 0) {
      shakeTime = 0;
      shakeIntensity = 0;
    }
  }
}

/* ============================================
   SECTION 14: DRAWING (NEON EFFECTS, HUD, SCENES)
   ============================================ */
function applyCameraShake() {
  if (shakeTime > 0 && shakeIntensity > 0) {
    const dx = (Math.random() - 0.5) * shakeIntensity;
    const dy = (Math.random() - 0.5) * shakeIntensity;
    ctx.translate(dx, dy);
  }
}

function drawPlayer() {
  if (!player.alive) return;
  if (!IMAGES.player.complete) return;

  ctx.save();
  ctx.translate(player.x, player.y);

  ctx.globalCompositeOperation = "lighter";
  ctx.shadowBlur = 25;
  ctx.shadowColor = "#00ffff";
  ctx.drawImage(IMAGES.player, -32, -32, 64, 64);

  if (player.shield > 0) {
    ctx.strokeStyle = "rgba(0, 255, 255, 0.8)";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
  ctx.globalCompositeOperation = "source-over";
}

function drawEnemyTriangle(x, y) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.shadowBlur = 15;
  ctx.shadowColor = "#ff0000";
  ctx.drawImage(IMAGES.enemyTriangle, x - 24, y - 24, 48, 48);
  ctx.restore();
  ctx.globalCompositeOperation = "source-over";
}

function drawEnemyCrab(x, y) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.shadowBlur = 15;
  ctx.shadowColor = "#ff00ff";
  ctx.drawImage(IMAGES.enemyCrab, x - 24, y - 24, 48, 48);
  ctx.restore();
  ctx.globalCompositeOperation = "source-over";
}

function drawEnemyUfo(x, y) {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.shadowBlur = 15;
  ctx.shadowColor = "#00ff99";
  ctx.drawImage(IMAGES.enemyUfo, x - 24, y - 24, 48, 48);
  ctx.restore();
  ctx.globalCompositeOperation = "source-over";
}

function drawEnemies() {
  for (const e of enemies) {
    if (e.type === "triangle") drawEnemyTriangle(e.x, e.y);
    if (e.type === "crab") drawEnemyCrab(e.x, e.y);
    if (e.type === "ufo") drawEnemyUfo(e.x, e.y);
  }
}

function drawBossSprite(boss) {
  if (!boss || !boss.img || !boss.img.complete) return;
  ctx.save();
  ctx.translate(boss.x, boss.y);
  ctx.rotate(Math.PI); // assume PNG faces down
  ctx.globalCompositeOperation = "lighter";
  ctx.shadowBlur = 30;
  ctx.shadowColor = "#ff0044";
  const size = boss.radius * 2;
  ctx.drawImage(boss.img, -size / 2, -size / 2, size, size);
  ctx.restore();
  ctx.globalCompositeOperation = "source-over";

  const w = canvas.width / window.devicePixelRatio;
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(w / 2 - 120, 20, 240, 12);
  const ratio = boss.hp / boss.maxHp;
  ctx.fillStyle = "#ff0044";
  ctx.fillRect(w / 2 - 120, 20, 240 * ratio, 12);
  ctx.restore();
}

function drawMiniBossSprite(mini) {
  if (!mini || !mini.img || !mini.img.complete) return;
  ctx.save();
  ctx.translate(mini.x, mini.y);
  ctx.rotate(Math.PI);
  ctx.globalCompositeOperation = "lighter";
  ctx.shadowBlur = 20;
  ctx.shadowColor = "#ff8800";
  const size = mini.radius * 2;
  ctx.drawImage(mini.img, -size / 2, -size / 2, size, size);
  ctx.restore();
  ctx.globalCompositeOperation = "source-over";
}

function drawBullets() {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = "rgba(0, 255, 255, 0.9)";
  ctx.shadowBlur = 10;
  ctx.shadowColor = "#00ffff";
  for (const b of bullets) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.globalCompositeOperation = "source-over";
}

function drawBossBullets() {
  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.fillStyle = "rgba(255, 0, 0, 0.9)";
  ctx.shadowBlur = 15;
  ctx.shadowColor = "#ff0000";
  for (const b of bossBullets) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
  ctx.globalCompositeOperation = "source-over";
}

function drawExplosions() {
  explosions = explosions.filter(ex => {
    ex.time += 1 / 60;
    const t = ex.time / ex.duration;
    if (t >= 1) return false;
    const radius = 10 + 40 * t;
    const alpha = 1 - t;

    ctx.save();
    ctx.globalCompositeOperation = "lighter";
    ctx.strokeStyle = `rgba(255, 255, 0, ${alpha})`;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 20;
    ctx.shadowColor = "yellow";
    ctx.beginPath();
    ctx.arc(ex.x, ex.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    ctx.globalCompositeOperation = "source-over";
    return true;
  });
}

function drawPowerups() {
  for (const p of powerups) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.globalCompositeOperation = "lighter";
    if (p.type === "shield") {
      ctx.strokeStyle = "#00ffff";
      ctx.shadowColor = "#00ffff";
    } else if (p.type === "score") {
      ctx.strokeStyle = "#ffff00";
      ctx.shadowColor = "#ffff00";
    } else if (p.type === "rapid") {
      ctx.strokeStyle = "#ff00ff";
      ctx.shadowColor = "#ff00ff";
    } else {
      ctx.strokeStyle = "#00ff99";
      ctx.shadowColor = "#00ff99";
    }
    ctx.shadowBlur = 15;
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    ctx.globalCompositeOperation = "source-over";
  }
}

function drawHUD() {
  const w = canvas.width / window.devicePixelRatio;
  const h = canvas.height / window.devicePixelRatio;

  ctx.save();
  ctx.fillStyle = "white";
  ctx.font = "14px system-ui";
  ctx.shadowBlur = 10;
  ctx.shadowColor = "#00ffff";
  ctx.textAlign = "left";

  ctx.fillText(`Score: ${score}`, 16, 24);
  ctx.fillText(`High: ${highScore}`, 16, 44);
  ctx.fillText(`Lives: ${lives}`, 16, 64);
  ctx.fillText(`Shield: ${player.shield}`, 16, 84);
  ctx.fillText(`Weapon: ${player.weaponLevel}`, 16, 104);
  ctx.fillText(`Level: ${endlessMode ? "Endless" : currentLevel}`, 16, 124);
  ctx.fillText(`Kills: ${killsThisLevel}/10`, 16, 144);

  if (gameState === "gameover") {
    ctx.font = "24px system-ui";
    ctx.textAlign = "center";
    ctx.shadowColor = "#ff00ff";
    ctx.fillText("GAME OVER", w / 2, h / 2);
    ctx.font = "14px system-ui";
    ctx.fillText("Press Restart to play again", w / 2, h / 2 + 24);
  }

  ctx.restore();

  drawAchievementPopups();
}

function drawAchievementPopups() {
  const w = canvas.width / window.devicePixelRatio;
  achievementPopups = achievementPopups.filter(a => {
    a.time += 1 / 60;
    const t = a.time / a.duration;
    if (t >= 1) return false;
    const y = 80 + 40 * t;
    const alpha = 1 - t;

    ctx.save();
    ctx.globalAlpha = alpha;
    ctx.textAlign = "center";
    ctx.font = "14px system-ui";
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#ffff00";
    ctx.fillStyle = "#ffff00";
    ctx.fillText(`Achievement Unlocked: ${a.label}`, w / 2, y);
    ctx.restore();
    return true;
  });
}

function drawStars(multiplier = 1) {
  ctx.save();
  ctx.globalCompositeOperation = "screen";
  for (const s of stars) {
    const alpha = 0.3 + 0.7 * s.z;
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    const len = (gameState === "warp") ? 8 * s.z : 2;
    ctx.fillRect(s.x, s.y, 1, len * multiplier);
  }
  ctx.restore();
  ctx.globalCompositeOperation = "source-over";
}

function drawBackground() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawStars();
}

function drawTitleScreen() {
  const w = canvas.width / window.devicePixelRatio;
  const h = canvas.height / window.devicePixelRatio;

  drawBackground();

  ctx.save();
  ctx.textAlign = "center";
  ctx.shadowBlur = 20;

  ctx.font = "28px system-ui";
  ctx.shadowColor = "#00ffff";
  ctx.fillStyle = "#00ffff";
  ctx.fillText("Neon Vector Space Shooter", w / 2, h / 2 - 40);

  ctx.font = "16px system-ui";
  ctx.shadowColor = "#ff00ff";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("Tap Fire / Press Space to Start", w / 2, h / 2 + 10);

  ctx.font = "14px system-ui";
  ctx.fillText(`High Score: ${highScore}`, w / 2, h / 2 + 40);

  ctx.restore();
}

function drawStoryScreen() {
  const w = canvas.width / window.devicePixelRatio;
  const h = canvas.height / window.devicePixelRatio;

  drawBackground();

  const text = storyScreens[currentStoryIndex] || "";

  ctx.save();
  ctx.textAlign = "center";
  ctx.shadowBlur = 20;
  ctx.shadowColor = "#00ffff";
  ctx.fillStyle = "#ffffff";
  ctx.font = "18px system-ui";
  ctx.fillText(text, w / 2, h / 2);

  ctx.font = "14px system-ui";
  ctx.shadowColor = "#ff00ff";
  ctx.fillText("Tap Fire / Press Space to continue", w / 2, h / 2 + 40);
  ctx.restore();
}

function drawDialogue() {
  const w = canvas.width / window.devicePixelRatio;
  const h = canvas.height / window.devicePixelRatio;

  drawBackground();

  ctx.save();
  ctx.textAlign = "center";
  ctx.shadowBlur = 20;
  ctx.shadowColor = "#ff00ff";
  ctx.fillStyle = "#ffffff";
  ctx.font = "18px system-ui";

  const text = currentDialogue ? currentDialogue.text : "";
  ctx.fillText(text, w / 2, h / 2);

  ctx.font = "14px system-ui";
  ctx.shadowColor = "#00ffff";
  ctx.fillText("Tap Fire / Press Space to confront the boss", w / 2, h / 2 + 40);
  ctx.restore();
}

function drawCutscene() {
  const w = canvas.width / window.devicePixelRatio;
  const h = canvas.height / window.devicePixelRatio;

  drawBackground();

  if (!currentCutscene) return;
  const t = Math.min(currentCutscene.time / currentCutscene.duration, 1);

  ctx.save();
  ctx.textAlign = "center";
  ctx.shadowBlur = 20;
  ctx.shadowColor = "#00ffff";
  ctx.fillStyle = "#ffffff";
  ctx.font = "18px system-ui";

  let text = "";
  if (currentCutscene.type === "afterBoss1") text = "The path to deeper space opens...";
  else if (currentCutscene.type === "afterBoss2") text = "You pierce the Nebula of Echoes...";
  else if (currentCutscene.type === "afterBoss3") text = "The guardians grow desperate...";
  else if (currentCutscene.type === "afterBoss4") text = "Only one stands between you and Paradise...";
  else if (currentCutscene.type === "afterBoss5") text = "Paradise awaits beyond the warp...";

  const y = h * (0.5 - 0.1 * (1 - t));
  ctx.fillText(text, w / 2, y);

  ctx.font = "14px system-ui";
  ctx.shadowColor = "#ff00ff";
  ctx.fillText("Tap Fire / Press Space to skip", w / 2, h - 40);
  ctx.restore();
}

function drawWarp() {
  const w = canvas.width / window.devicePixelRatio;
  const h = canvas.height / window.devicePixelRatio;

  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  drawStars(4);

  ctx.save();
  ctx.textAlign = "center";
  ctx.font = "20px system-ui";
  ctx.shadowBlur = 20;
  ctx.shadowColor = "#00ffff";
  ctx.fillStyle = "#00ffff";
  ctx.fillText("Warping to Paradise...", w / 2, h / 2);
  ctx.restore();
}

function drawLanding() {
  const w = canvas.width / window.devicePixelRatio;
  const h = canvas.height / window.devicePixelRatio;

  const t = Math.min(landingTime / 3, 1);

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "#001020");
  grad.addColorStop(1, "#200010");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  const radius = 40 + 120 * t;
  ctx.save();
  ctx.shadowBlur = 40;
  ctx.shadowColor = "#ffeeaa";
  ctx.fillStyle = "#ffeeaa";
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.textAlign = "center";
  ctx.font = "18px system-ui";
  ctx.shadowBlur = 20;
  ctx.shadowColor = "#ff00ff";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("Approaching Paradise...", w / 2, h - 60);
  ctx.restore();
}

function drawParadise() {
  const w = canvas.width / window.devicePixelRatio;
  const h = canvas.height / window.devicePixelRatio;

  const grad = ctx.createLinearGradient(0, 0, 0, h);
  grad.addColorStop(0, "#00ffff");
  grad.addColorStop(1, "#ff00ff");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, w, h);

  ctx.save();
  ctx.shadowBlur = 40;
  ctx.shadowColor = "#ffffff";
  ctx.fillStyle = "#ffeeaa";
  ctx.beginPath();
  ctx.arc(w / 2, h / 2, 120, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();

  ctx.save();
  ctx.textAlign = "center";
  ctx.font = "28px system-ui";
  ctx.shadowBlur = 20;
  ctx.shadowColor = "#00ffff";
  ctx.fillStyle = "#ffffff";
  ctx.fillText("Welcome to Paradise", w / 2, h / 2 + 160);

  ctx.font = "16px system-ui";
  ctx.fillText("You beat the game!", w / 2, h / 2 + 190);
  ctx.fillText("Press Restart or Fire for Endless Mode", w / 2, h / 2 + 220);
  ctx.restore();
}

function drawJoystickOverlay() {
  const rect = touchMove.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;

  const canvasRect = canvas.getBoundingClientRect();
  const x = cx - canvasRect.left;
  const y = cy - canvasRect.top;

  ctx.save();
  ctx.globalCompositeOperation = "lighter";
  ctx.strokeStyle = "rgba(0,255,255,0.5)";
  ctx.lineWidth = 2;
  ctx.shadowBlur = 10;
  ctx.shadowColor = "#00ffff";
  ctx.beginPath();
  ctx.arc(x, y, rect.width / 2, 0, Math.PI * 2);
  ctx.stroke();

  const knobX = x + touchMoveOffset.x * 0.5;
  const knobY = y + touchMoveOffset.y * 0.5;
  ctx.fillStyle = "rgba(0,255,255,0.7)";
  ctx.beginPath();
  ctx.arc(knobX, knobY, rect.width / 6, 0, Math.PI * 2);
  ctx.fill();

  ctx.restore();
  ctx.globalCompositeOperation = "source-over";
}

/* ============================================
   SECTION 15: STARS UPDATE
   ============================================ */
function updateStars(dt, speedMultiplier) {
  const w = canvas.width / window.devicePixelRatio;
  const h = canvas.height / window.devicePixelRatio;
  for (const s of stars) {
    s.y += s.speed * s.z * dt * speedMultiplier;
    if (s.y > h) {
      s.y = 0;
      s.x = Math.random() * w;
      s.z = 0.3 + Math.random() * 0.7;
    }
  }
}

/* ============================================
   SECTION 16: MAIN GAME LOOP
   ============================================ */
let lastTime = performance.now();

function gameLoop(t) {
  const dt = (t - lastTime) / 1000;
  lastTime = t;

  if (!isPaused) {
    handleKeyboard(dt);
    handleGamepad(dt);
    update(dt);
  }

  ctx.save();
  applyCameraShake();

  if (gameState === "title") {
    updateStars(dt, 1);
    drawTitleScreen();
  } else if (gameState === "story") {
    drawStoryScreen();
  } else if (gameState === "dialogue") {
    drawDialogue();
  } else if (gameState === "cutscene") {
    drawCutscene();
  } else if (["play", "boss", "endless", "gameover"].includes(gameState)) {
    drawBackground();
    drawPlayer();
    drawEnemies();
    if (miniBoss !== null) drawMiniBossSprite(miniBoss);
    if (gameState === "boss" && currentBossIndex >= 0) {
      drawBossSprite(bosses[currentBossIndex]);
    }
    drawBullets();
    drawBossBullets();
    drawPowerups();
    drawExplosions();
    drawHUD();
  } else if (gameState === "warp") {
    drawWarp();
  } else if (gameState === "landing") {
    drawLanding();
  } else if (gameState === "paradise") {
    drawParadise();
  }

  ctx.restore();

  if (controlMode === "touch") {
    drawJoystickOverlay();
  }

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
