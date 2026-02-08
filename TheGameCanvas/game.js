// =========================
//  CANVAS SETUP
// =========================
const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// =========================
//  IMAGES
// =========================
const roadImg = new Image();
roadImg.src = "road.png";

const playerImg = new Image();
playerImg.src = "car.png";

const enemyBlue = new Image();
enemyBlue.src = "enemy-blue.png";

const enemyYellow = new Image();
enemyYellow.src = "enemy-yellow.png";

const enemyImages = [enemyBlue, enemyYellow];

const policeImg = new Image();
policeImg.src = "police.png"; // police car sprite

// Explosion sprite sheet: multiple frames horizontally
const explosionImg = new Image();
explosionImg.src = "explosion.png"; // e.g. 8 frames in one row

const EXPLOSION_FRAMES = 8;
const EXPLOSION_FRAME_WIDTH = 256;  // adjust to your sprite
const EXPLOSION_FRAME_HEIGHT = 256; // adjust to your sprite

// =========================
//  AUDIO
// =========================
const engineSound = new Audio("sounds/engine-loop.mp3");
engineSound.loop = true;

const crashSound = new Audio("sounds/crash.mp3");
const music = new Audio("sounds/music.mp3");
music.loop = true;

const nitroSound = new Audio("sounds/nitro.mp3");
const sirenSound = new Audio("sounds/siren.mp3");
sirenSound.loop = true;

let isMuted = false;

// =========================
//  UI CONTROLS
// =========================
const startBtn = document.getElementById("startBtn");
const restartBtn = document.getElementById("restartBtn");
const muteBtn = document.getElementById("muteBtn");
const volumeSlider = document.getElementById("volumeSlider");

// Initial UI state
restartBtn.style.display = "none";

// =========================
//  GAME STATE
// =========================
let gameState = "menu"; // "menu" | "playing" | "gameover"

let roadY = 0;
let enemyCars = [];
let gameSpeed = 10;
let baseSpeed = 10;
let score = 0;
let highScore = Number(localStorage.getItem("highScore") || 0);

let nitroActive = false;
let nitroCooldown = false;
let nitroTimer = 0;
let nitroDuration = 120; // frames
let nitroCooldownTime = 240; // frames

let policeActive = false;
let police = {
  x: canvas.width / 2 - 40,
  y: -200,
  width: 80,
  height: 160,
  speed: 12
};

let explosionActive = false;
let explosionX = 0;
let explosionY = 0;
let explosionFrame = 0;

// =========================
//  PLAYER
// =========================
const player = {
  x: canvas.width / 2 - 40,
  y: canvas.height - 200,
  width: 80,
  height: 160,
  speed: 10,
  moveLeft: false,
  moveRight: false
};

// =========================
//  INPUT HANDLERS
// =========================
document.addEventListener("keydown", (e) => {
  if (gameState !== "playing") return;

  if (e.key === "ArrowLeft" || e.key === "a") player.moveLeft = true;
  if (e.key === "ArrowRight" || e.key === "d") player.moveRight = true;

  // Nitro (Shift or Space)
  if ((e.key === "Shift" || e.key === " ") && !nitroCooldown && !nitroActive) {
    nitroActive = true;
    nitroTimer = 0;
    baseSpeed = gameSpeed;
    gameSpeed += 8;
    nitroSound.currentTime = 0;
    if (!isMuted) nitroSound.play();
  }
});

document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a") player.moveLeft = false;
  if (e.key === "ArrowRight" || e.key === "d") player.moveRight = false;
});

// =========================
//  BUTTON HANDLERS
// =========================
startBtn.addEventListener("click", () => {
  if (gameState === "menu") {
    startGame();
  }
});

restartBtn.addEventListener("click", () => {
  if (gameState === "gameover") {
    resetGame();
    startGame();
  }
});

muteBtn.addEventListener("click", () => {
  isMuted = !isMuted;

  [engineSound, crashSound, music, nitroSound, sirenSound].forEach((s) => {
    s.muted = isMuted;
  });

  muteBtn.textContent = isMuted ? "Unmute" : "Mute";
});

volumeSlider.addEventListener("input", () => {
  const vol = Number(volumeSlider.value);
  [engineSound, crashSound, music, nitroSound, sirenSound].forEach((s) => {
    s.volume = vol;
  });
});

// =========================
//  GAME CONTROL FUNCTIONS
// =========================
function startGame() {
  gameState = "playing";
  startBtn.style.display = "none";
  restartBtn.style.display = "none";

  if (!isMuted) {
    music.currentTime = 0;
    music.play();
    engineSound.currentTime = 0;
    engineSound.play();
  }
}

function resetGame() {
  roadY = 0;
  enemyCars = [];
  gameSpeed = 10;
  baseSpeed = 10;
  score = 0;
  nitroActive = false;
  nitroCooldown = false;
  nitroTimer = 0;
  policeActive = false;
  explosionActive = false;
  explosionFrame = 0;
  player.x = canvas.width / 2 - 40;
  player.y = canvas.height - 200;
}

// =========================
//  ENEMY SPAWNING
// =========================
function spawnEnemy() {
  if (gameState !== "playing") return;

  const laneWidth = canvas.width / 3;
  const lane = Math.floor(Math.random() * 3);

  enemyCars.push({
    x: lane * laneWidth + laneWidth / 2 - 40,
    y: -200,
    width: 80,
    height: 160,
    speed: gameSpeed * 0.8,
    img: enemyImages[Math.floor(Math.random() * enemyImages.length)]
  });
}

setInterval(spawnEnemy, 1200);

// =========================
//  POLICE CHASE
// =========================
function maybeStartPoliceChase() {
  if (policeActive || gameState !== "playing") return;

  // Small chance each second to start a chase
  if (Math.random() < 0.01) {
    policeActive = true;
    police.x = canvas.width / 2 - 40;
    police.y = -200;
    if (!isMuted) {
      sirenSound.currentTime = 0;
      sirenSound.play();
    }
  }
}

// =========================
//  COLLISION CHECK
// =========================
function checkCollision(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

// =========================
//  EXPLOSION
// =========================
function triggerExplosion(x, y) {
  explosionActive = true;
  explosionX = x + player.width / 2 - EXPLOSION_FRAME_WIDTH / 2;
  explosionY = y + player.height / 2 - EXPLOSION_FRAME_HEIGHT / 2;
  explosionFrame = 0;
}

// =========================
//  UPDATE LOOP
// =========================
function update() {
  if (gameState !== "playing") return;

  // Player movement
  if (player.moveLeft) player.x -= player.speed;
  if (player.moveRight) player.x += player.speed;

  // Keep inside screen
  player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));

  // Road scroll
  roadY += gameSpeed;
  if (roadY >= canvas.height) roadY = 0;

  // Speed scaling (base)
  if (!nitroActive) {
    gameSpeed += 0.002;
    baseSpeed = gameSpeed;
  }

  // Nitro handling
  if (nitroActive) {
    nitroTimer++;
    if (nitroTimer >= nitroDuration) {
      nitroActive = false;
      nitroCooldown = true;
      gameSpeed = baseSpeed;
      nitroTimer = 0;
    }
  } else if (nitroCooldown) {
    nitroTimer++;
    if (nitroTimer >= nitroCooldownTime) {
      nitroCooldown = false;
      nitroTimer = 0;
    }
  }

  // Score
  score += gameSpeed * 0.1;

  // Move enemies
  enemyCars.forEach((car, index) => {
    car.y += car.speed;

    // Remove off-screen cars
    if (car.y > canvas.height + 200) {
      enemyCars.splice(index, 1);
    }

    // Collision with player
    if (checkCollision(player, car)) {
      handleCrash();
    }
  });

  // Police chase logic
  maybeStartPoliceChase();

  if (policeActive) {
    // Simple follow AI
    if (police.x + police.width / 2 < player.x + player.width / 2) {
      police.x += police.speed * 0.5;
    } else if (police.x + police.width / 2 > player.x + player.width / 2) {
      police.x -= police.speed * 0.5;
    }
    police.y += police.speed;

    if (police.y > canvas.height + 200) {
      policeActive = false;
      sirenSound.pause();
      sirenSound.currentTime = 0;
    }

    if (checkCollision(player, police)) {
      handleCrash();
    }
  }

  // Explosion animation progress
  if (explosionActive) {
    explosionFrame++;
    if (explosionFrame >= EXPLOSION_FRAMES) {
      explosionActive = false;
    }
  }
}

function handleCrash() {
  if (gameState !== "playing") return;

  gameState = "gameover";

  if (!isMuted) {
    crashSound.currentTime = 0;
    crashSound.play();
  }

  engineSound.pause();
  engineSound.currentTime = 0;

  music.pause();

  sirenSound.pause();
  sirenSound.currentTime = 0;

  triggerExplosion(player.x, player.y);

  // High score update
  if (score > highScore) {
    highScore = Math.floor(score);
    localStorage.setItem("highScore", highScore.toString());
  }

  restartBtn.style.display = "inline-block";
}

// =========================
//  DRAW LOOP
// =========================
function draw() {
  // Road (draw twice for infinite scroll)
  ctx.drawImage(roadImg, 0, roadY, canvas.width, canvas.height);
  ctx.drawImage(roadImg, 0, roadY - canvas.height, canvas.width, canvas.height);

  // Player
  if (gameState !== "gameover") {
    ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);
  }

  // Enemies
  enemyCars.forEach((car) => {
    ctx.drawImage(car.img, car.x, car.y, car.width, car.height);
  });

  // Police
  if (policeActive) {
    ctx.drawImage(policeImg, police.x, police.y, police.width, police.height);
  }

  // Nitro flame effect
  if (nitroActive && gameState === "playing") {
    ctx.fillStyle = "#00ccff";
    ctx.fillRect(
      player.x + player.width / 2 - 10,
      player.y + player.height,
      20,
      40
    );
  }

  // Explosion
  if (explosionActive) {
    const frameX = explosionFrame * EXPLOSION_FRAME_WIDTH;
    ctx.drawImage(
      explosionImg,
      frameX,
      0,
      EXPLOSION_FRAME_WIDTH,
      EXPLOSION_FRAME_HEIGHT,
      explosionX,
      explosionY,
      EXPLOSION_FRAME_WIDTH,
      EXPLOSION_FRAME_HEIGHT
    );
  }

  // Score + High Score
  ctx.fillStyle = "#fff";
  ctx.font = "24px Arial";
  ctx.textAlign = "left";
  ctx.fillText("Score: " + Math.floor(score), 20, 40);
  ctx.fillText("High Score: " + highScore, 20, 70);

  // Nitro status
  ctx.fillText(
    nitroCooldown ? "Nitro: Cooling" : nitroActive ? "Nitro: ACTIVE" : "Nitro: Ready",
    20,
    100
  );

  // Menu overlay
  if (gameState === "menu") {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#ff0066";
    ctx.font = "64px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Nikko Neon Racer", canvas.width / 2, canvas.height / 2 - 60);

    ctx.fillStyle = "#fff";
    ctx.font = "28px Arial";
    ctx.fillText("Use ← → or A / D to move", canvas.width / 2, canvas.height / 2);
    ctx.fillText("Hold Shift or Space for NITRO", canvas.width / 2, canvas.height / 2 + 40);
    ctx.fillText("Click START to begin", canvas.width / 2, canvas.height / 2 + 80);
  }

  // Game Over overlay
  if (gameState === "gameover") {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#ff0066";
    ctx.font = "70px Arial";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 40);

    ctx.fillStyle = "#fff";
    ctx.font = "32px Arial";
    ctx.fillText("Score: " + Math.floor(score), canvas.width / 2, canvas.height / 2 + 10);
    ctx.fillText("High Score: " + highScore, canvas.width / 2, canvas.height / 2 + 50);
    ctx.font = "24px Arial";
    ctx.fillText("Click RESTART to play again", canvas.width / 2, canvas.height / 2 + 90);
  }
}

// =========================
//  GAME LOOP
// =========================
function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
