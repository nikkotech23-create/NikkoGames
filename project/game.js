// ====== CANVAS SETUP ======
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

// ====== IMAGE ASSETS ======
const IMAGES = {
  player: new Image(),
  enemyTriangle: new Image(),
  enemyCrab: new Image(),
  enemyUfo: new Image()
};

IMAGES.player.src = "assets/ships/player_ship.png";
IMAGES.enemyTriangle.src = "assets/ships/enemy_triangle.png";
IMAGES.enemyCrab.src = "assets/ships/enemy_crab.png";
IMAGES.enemyUfo.src = "assets/ships/enemy_ufo.png";

// ====== AUDIO ======
const sounds = {
  music: new Audio("assets/audio/music_bg.mp3"),
  laser: new Audio("assets/audio/laser.wav"),
  explosion: new Audio("assets/audio/explosion.wav")
};
sounds.music.loop = true;
sounds.music.volume = 0.5;

// ====== GAME STATE ======
let gameState = "title"; // title | play | boss | warp | landing | paradise | gameover
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
  shield: 0
};

let bullets = [];
let bulletCooldown = 0;
let bulletCooldownBase = 0.2;

let enemies = [];
let enemySpawnTimer = 0;

let boss = null;
const BOSS_TRIGGER_SCORE = 3000;

let explosions = [];
let powerups = [];

let score = 0;
let lives = 3;
let highScore = 0;

let warpTime = 0;
let landingTime = 0;

// ====== PARALLAX STARFIELD ======
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

// ====== UI ELEMENTS ======
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

// ====== BUTTON HANDLERS ======
btnPause.onclick = () => {
  if (gameState === "title" || gameState === "paradise") return;
  isPaused = !isPaused;
  btnPause.textContent = isPaused ? "Resume" : "Pause";
};

btnRestart.onclick = () => {
  startGame();
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
};

controlModeSelect.onchange = () => {
  controlMode = controlModeSelect.value;
};

// ====== HIGH SCORE ======
try {
  const saved = localStorage.getItem("neon_shooter_highscore");
  if (saved) highScore = parseInt(saved, 10) || 0;
} catch (e) {}

// ====== TOUCH CONTROLS ======
const touchMove = document.getElementById("touch-move");
const touchFire = document.getElementById("touch-fire");

let touchMoveActive = false;
let touchMoveCenter = { x: 0, y: 0 };

function getTouchPos(touch, element) {
  const rect = element.getBoundingClientRect();
  return { x: touch.clientX - rect.left, y: touch.clientY - rect.top };
}

touchMove.addEventListener("touchstart", e => {
  if (controlMode !== "touch") return;
  e.preventDefault();
  touchMoveActive = true;
  touchMoveCenter = getTouchPos(e.touches[0], touchMove);
}, { passive: false });

touchMove.addEventListener("touchmove", e => {
  if (!touchMoveActive || controlMode !== "touch") return;
  e.preventDefault();
  const pos = getTouchPos(e.touches[0], touchMove);
  const dx = pos.x - touchMoveCenter.x;
  const dy = pos.y - touchMoveCenter.y;

  player.angle = Math.atan2(dy, dx) + Math.PI / 2;
  const strength = Math.min(Math.hypot(dx, dy) / 40, 1);
  const thrust = 200 * strength;
  player.vx += Math.cos(player.angle - Math.PI / 2) * thrust * 0.016;
  player.vy += Math.sin(player.angle - Math.PI / 2) * thrust * 0.016;
}, { passive: false });

touchMove.addEventListener("touchend", () => touchMoveActive = false);

touchFire.addEventListener("touchstart", e => {
  if (controlMode !== "touch") return;
  e.preventDefault();
  if (gameState === "title") {
    startGame();
  } else {
    tryShoot();
  }
}, { passive: false });

// ====== KEYBOARD ======
const keys = {};
window.addEventListener("keydown", e => {
  keys[e.code] = true;
  if (gameState === "title" && (e.code === "Space" || e.code === "Enter")) {
    startGame();
  }
});
window.addEventListener("keyup", e => keys[e.code] = false);

function handleKeyboard(dt) {
  if (controlMode !== "keyboard") return;
  if (gameState !== "play" && gameState !== "boss") return;

  const rotSpeed = 3;
  const thrust = 250;

  if (keys["ArrowLeft"] || keys["KeyA"]) player.angle -= rotSpeed * dt;
  if (keys["ArrowRight"] || keys["KeyD"]) player.angle += rotSpeed * dt;
  if (keys["ArrowUp"] || keys["KeyW"]) {
    player.vx += Math.cos(player.angle - Math.PI / 2) * thrust * dt;
    player.vy += Math.sin(player.angle - Math.PI / 2) * thrust * dt;
  }
  if (keys["Space"]) {
    tryShoot();
  }
}

// ====== GAMEPAD ======
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
  if (gameState !== "play" && gameState !== "boss") return;
  if (gamepadIndex === null) return;

  const gp = navigator.getGamepads()[gamepadIndex];
  if (!gp) return;

  const axisX = gp.axes[0] || 0;
  const axisY = gp.axes[1] || 0;
  const thrust = 250;

  if (Math.hypot(axisX, axisY) > 0.2) {
    player.angle = Math.atan2(axisY, axisX) + Math.PI / 2;
    player.vx += axisX * thrust * dt;
    player.vy += axisY * thrust * dt;
  }

  if (gp.buttons[0].pressed) {
    tryShoot();
  }
}

// ====== CORE GAME FLOW ======
function startGame() {
  resetGame();
  gameState = "play";
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

  bullets = [];
  enemies = [];
  explosions = [];
  powerups = [];
  boss = null;

  score = 0;
  lives = 3;
  enemySpawnTimer = 0;
  bulletCooldown = 0;
  bulletCooldownBase = 0.2;
  warpTime = 0;
  landingTime = 0;
  isPaused = false;
  btnPause.textContent = "Pause";
  initStars();
}

// Shooting
function tryShoot() {
  if (!player.alive) return;
  if (gameState !== "play" && gameState !== "boss") return;
  if (bulletCooldown > 0) return;

  const speed = 400;
  const dirX = Math.cos(player.angle - Math.PI / 2);
  const dirY = Math.sin(player.angle - Math.PI / 2);

  bullets.push({
    x: player.x + dirX * 24,
    y: player.y + dirY * 24,
    vx: dirX * speed,
    vy: dirY * speed,
    radius: 4
  });

  bulletCooldown = bulletCooldownBase;
  sounds.laser.currentTime = 0;
  sounds.laser.play();
}

// Enemy spawning
function spawnEnemy() {
  const types = ["triangle", "crab", "ufo"];
  const type = types[Math.floor(Math.random() * types.length)];
  const w = canvas.width / window.devicePixelRatio;
  const x = 40 + Math.random() * (w - 80);
  const y = -40;
  const speed = 40 + Math.random() * 60;

  enemies.push({
    type,
    x,
    y,
    vy: speed,
    radius: 20,
    hp: 1
  });
}

// Power-ups
function spawnPowerup(x, y) {
  const types = ["shield", "score", "rapid"];
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
  }
}

// Boss
function spawnBoss() {
  const w = canvas.width / window.devicePixelRatio;
  boss = {
    x: w / 2,
    y: 120,
    vx: 60,
    radius: 60,
    hp: 60,
    maxHp: 60
  };
}

// ====== UPDATE ======
function update(dt) {
  if (gameState === "play" || gameState === "boss") {
    updatePlay(dt);
  } else if (gameState === "warp") {
    updateWarp(dt);
  } else if (gameState === "landing") {
    updateLanding(dt);
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

  // Player physics
  player.x += player.vx * dt;
  player.y += player.vy * dt;
  const friction = 0.98;
  player.vx *= friction;
  player.vy *= friction;

  // Screen wrap
  if (player.x < -30) player.x = w + 30;
  if (player.x > w + 30) player.x = -30;
  if (player.y < -30) player.y = h + 30;
  if (player.y > h + 30) player.y = -30;

  // Bullets
  bulletCooldown = Math.max(0, bulletCooldown - dt);
  bullets = bullets.filter(b => {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    return b.x > -20 && b.x < w + 20 && b.y > -20 && b.y < h + 20;
  });

  // Enemies
  enemySpawnTimer -= dt;
  if (enemySpawnTimer <= 0) {
    spawnEnemy();
    enemySpawnTimer = 1.2;
  }

  enemies = enemies.filter(e => {
    e.y += e.vy * dt;
    return e.y < h + 60;
  });

  // Powerups
  powerups = powerups.filter(p => {
    p.y += p.vy * dt;
    return p.y < h + 60;
  });

  // Collisions: bullets vs enemies
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    for (let j = bullets.length - 1; j >= 0; j--) {
      const b = bullets[j];
      if (circleHit(e.x, e.y, e.radius, b.x, b.y, b.radius)) {
        bullets.splice(j, 1);
        e.hp -= 1;
        if (e.hp <= 0) {
          enemies.splice(i, 1);
          addExplosion(e.x, e.y);
          score += 100;
          if (Math.random() < 0.25) spawnPowerup(e.x, e.y);
        }
        break;
      }
    }
  }

  // Collisions: powerups vs player
  for (let i = powerups.length - 1; i >= 0; i--) {
    const p = powerups[i];
    if (circleHit(p.x, p.y, p.radius, player.x, player.y, player.radius)) {
      powerups.splice(i, 1);
      applyPowerup(p);
    }
  }

  // Collisions: enemies vs player
  for (let i = enemies.length - 1; i >= 0; i--) {
    const e = enemies[i];
    if (circleHit(e.x, e.y, e.radius, player.x, player.y, player.radius)) {
      enemies.splice(i, 1);
      addExplosion(player.x, player.y);
      if (player.shield > 0) {
        player.shield -= 1;
      } else {
        lives -= 1;
        if (lives <= 0) {
          player.alive = false;
        }
      }
    }
  }

  // Boss trigger
  if (score >= BOSS_TRIGGER_SCORE && !boss) {
    spawnBoss();
    gameState = "boss";
  }

  // Stars
  updateStars(dt, 1);
}

function updateBoss(dt) {
  if (!boss) return;
  const w = canvas.width / window.devicePixelRatio;

  boss.x += boss.vx * dt;
  if (boss.x < 80 || boss.x > w - 80) boss.vx *= -1;

  // Boss collisions with bullets
  for (let j = bullets.length - 1; j >= 0; j--) {
    const b = bullets[j];
    if (circleHit(boss.x, boss.y, boss.radius, b.x, b.y, b.radius)) {
      bullets.splice(j, 1);
      boss.hp -= 1;
      addExplosion(b.x, b.y);
      score += 20;
      if (boss.hp <= 0) {
        addExplosion(boss.x, boss.y);
        boss = null;
        gameState = "warp";
        warpTime = 0;
        handleHighScore(); // in case score beats record
      }
    }
  }

  // Boss vs player
  if (boss && circleHit(boss.x, boss.y, boss.radius, player.x, player.y, player.radius)) {
    addExplosion(player.x, player.y);
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
  updateStars(dt, 6); // much faster
  if (warpTime > 4) {
    gameState = "landing";
    landingTime = 0;
  }
}

function updateLanding(dt) {
  landingTime += dt;
  updateStars(dt, 0.5);
  if (landingTime > 3) {
    gameState = "paradise";
  }
}

// Stars update
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

// Circle collision helper
function circleHit(x1, y1, r1, x2, y2, r2) {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return dx * dx + dy * dy <= (r1 + r2) * (r1 + r2);
}

// Explosions
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

// High score
function handleHighScore() {
  if (score > highScore) {
    highScore = score;
    try {
      localStorage.setItem("neon_shooter_highscore", String(highScore));
    } catch (e) {}
  }
}

// ====== DRAWING ======
function drawPlayer() {
  if (!player.alive) return;
  if (!IMAGES.player.complete) return;

  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.rotate(player.angle);
  ctx.drawImage(IMAGES.player, -32, -32, 64, 64);

  if (player.shield > 0) {
    ctx.strokeStyle = "rgba(0, 255, 255, 0.8)";
    ctx.lineWidth = 3;
    ctx.shadowBlur = 15;
    ctx.shadowColor = "#00ffff";
    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, Math.PI * 2);
    ctx.stroke();
  }

  ctx.restore();
}

function drawEnemyTriangle(x, y) {
  ctx.drawImage(IMAGES.enemyTriangle, x - 24, y - 24, 48, 48);
}

function drawEnemyCrab(x, y) {
  ctx.drawImage(IMAGES.enemyCrab, x - 24, y - 24, 48, 48);
}

function drawEnemyUfo(x, y) {
  ctx.drawImage(IMAGES.enemyUfo, x - 24, y - 24, 48, 48);
}

function drawEnemies() {
  for (const e of enemies) {
    if (e.type === "triangle") drawEnemyTriangle(e.x, e.y);
    if (e.type === "crab") drawEnemyCrab(e.x, e.y);
    if (e.type === "ufo") drawEnemyUfo(e.x, e.y);
  }
}

function drawBoss() {
  if (!boss) return;
  ctx.save();
  ctx.translate(boss.x, boss.y);
  ctx.strokeStyle = "rgba(255, 0, 255, 0.9)";
  ctx.lineWidth = 4;
  ctx.shadowBlur = 25;
  ctx.shadowColor = "#ff00ff";
  ctx.beginPath();
  ctx.arc(0, 0, boss.radius, 0, Math.PI * 2);
  ctx.stroke();
  ctx.restore();

  // Boss HP bar
  const w = canvas.width / window.devicePixelRatio;
  ctx.save();
  ctx.fillStyle = "rgba(0,0,0,0.6)";
  ctx.fillRect(w / 2 - 120, 20, 240, 12);
  const ratio = boss.hp / boss.maxHp;
  ctx.fillStyle = "#ff00ff";
  ctx.fillRect(w / 2 - 120, 20, 240 * ratio, 12);
  ctx.restore();
}

function drawBullets() {
  ctx.save();
  ctx.fillStyle = "rgba(0, 255, 255, 0.9)";
  ctx.shadowBlur = 10;
  ctx.shadowColor = "#00ffff";
  for (const b of bullets) {
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();
}

function drawExplosions() {
  explosions = explosions.filter(ex => {
    ex.time += 1 / 60;
    const t = ex.time / ex.duration;
    if (t >= 1) return false;
    const radius = 10 + 40 * t;
    const alpha = 1 - t;

    ctx.save();
    ctx.strokeStyle = `rgba(255, 255, 0, ${alpha})`;
    ctx.lineWidth = 2;
    ctx.shadowBlur = 20;
    ctx.shadowColor = "yellow";
    ctx.beginPath();
    ctx.arc(ex.x, ex.y, radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
    return true;
  });
}

function drawPowerups() {
  for (const p of powerups) {
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.shadowBlur = 15;
    if (p.type === "shield") {
      ctx.strokeStyle = "#00ffff";
      ctx.shadowColor = "#00ffff";
    } else if (p.type === "score") {
      ctx.strokeStyle = "#ffff00";
      ctx.shadowColor = "#ffff00";
    } else {
      ctx.strokeStyle = "#ff00ff";
      ctx.shadowColor = "#ff00ff";
    }
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(0, 0, p.radius, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
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

  if (gameState === "gameover") {
    ctx.font = "24px system-ui";
    ctx.textAlign = "center";
    ctx.shadowColor = "#ff00ff";
    ctx.fillText("GAME OVER", w / 2, h / 2);
    ctx.font = "14px system-ui";
    ctx.fillText("Press Restart to play again", w / 2, h / 2 + 24);
  }

  ctx.restore();
}

function drawStars(multiplier = 1) {
  ctx.save();
  for (const s of stars) {
    const alpha = 0.3 + 0.7 * s.z;
    ctx.fillStyle = `rgba(255,255,255,${alpha})`;
    const len = (gameState === "warp") ? 8 * s.z : 2;
    ctx.fillRect(s.x, s.y, 1, len * multiplier);
  }
  ctx.restore();
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
  ctx.fillText("Press Restart to play again", w / 2, h / 2 + 220);
  ctx.restore();
}

// ====== GAME LOOP ======
let lastTime = performance.now();

function gameLoop(t) {
  const dt = (t - lastTime) / 1000;
  lastTime = t;

  if (!isPaused) {
    handleKeyboard(dt);
    handleGamepad(dt);

    if (gameState === "play") {
      updatePlay(dt);
    } else if (gameState === "boss") {
      updatePlay(dt);
      updateBoss(dt);
    } else if (gameState === "warp") {
      updateWarp(dt);
    } else if (gameState === "landing") {
      updateLanding(dt);
    } else if (gameState === "title" || gameState === "paradise" || gameState === "gameover") {
      updateStars(dt, 1);
    }
  }

  if (gameState === "title") {
    drawTitleScreen();
  } else if (gameState === "play" || gameState === "boss" || gameState === "gameover") {
    drawBackground();
    drawPlayer();
    drawEnemies();
    if (boss) drawBoss();
    drawBullets();
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

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
