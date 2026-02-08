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

// =========================
//  AUDIO
// =========================
const engineSound = new Audio("sounds/engine-loop.mp3");
engineSound.loop = true;
engineSound.volume = 1;

const crashSound = new Audio("sounds/crash.mp3");
crashSound.volume = 1;

let isMuted = false;

// =========================
//  UI CONTROLS
// =========================
const muteBtn = document.getElementById("muteBtn");
const volumeSlider = document.getElementById("volumeSlider");

muteBtn.addEventListener("click", () => {
  isMuted = !isMuted;

  if (isMuted) {
    engineSound.muted = true;
    crashSound.muted = true;
    muteBtn.textContent = "Unmute";
  } else {
    engineSound.muted = false;
    crashSound.muted = false;
    muteBtn.textContent = "Mute";
  }
});

volumeSlider.addEventListener("input", () => {
  const vol = volumeSlider.value;
  engineSound.volume = vol;
  crashSound.volume = vol;
});

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
//  GAME VARIABLES
// =========================
let roadY = 0;
let enemyCars = [];
let gameSpeed = 10;
let score = 0;
let gameOver = false;

// =========================
//  CONTROLS
// =========================
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a") player.moveLeft = true;
  if (e.key === "ArrowRight" || e.key === "d") player.moveRight = true;
});

document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a") player.moveLeft = false;
  if (e.key === "ArrowRight" || e.key === "d") player.moveRight = false;
});

// =========================
//  ENEMY SPAWNING
// =========================
function spawnEnemy() {
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
//  UPDATE LOOP
// =========================
function update() {
  if (gameOver) return;

  // Start engine sound once
  if (engineSound.paused && !isMuted) {
    engineSound.play();
  }

  // Player movement
  if (player.moveLeft) player.x -= player.speed;
  if (player.moveRight) player.x += player.speed;

  // Keep inside screen
  player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));

  // Road scroll
  roadY += gameSpeed;
  if (roadY >= canvas.height) roadY = 0;

  // Speed scaling
  gameSpeed += 0.002;

  // Score
  score += gameSpeed * 0.1;

  // Move enemies
  enemyCars.forEach((car, index) => {
    car.y += car.speed;

    // Remove off-screen cars
    if (car.y > canvas.height + 200) {
      enemyCars.splice(index, 1);
    }

    // Collision
    if (checkCollision(player, car)) {
      crashSound.play();
      engineSound.pause();
      engineSound.currentTime = 0;
      gameOver = true;
    }
  });
}

// =========================
//  DRAW LOOP
// =========================
function draw() {
  // Road (draw twice for infinite scroll)
  ctx.drawImage(roadImg, 0, roadY, canvas.width, canvas.height);
  ctx.drawImage(roadImg, 0, roadY - canvas.height, canvas.width, canvas.height);

  // Player
  ctx.drawImage(playerImg, player.x, player.y, player.width, player.height);

  // Enemies
  enemyCars.forEach((car) => {
    ctx.drawImage(car.img, car.x, car.y, car.width, car.height);
  });

  // Score
  ctx.fillStyle = "#fff";
  ctx.font = "28px Arial";
  ctx.fillText("Score: " + Math.floor(score), 20, 40);

  // Game Over Screen
  if (gameOver) {
    ctx.fillStyle = "rgba(0,0,0,0.7)";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.fillStyle = "#ff0066";
    ctx.font = "70px Arial";
    ctx.textAlign = "center";
    ctx.fillText("GAME OVER", canvas.width / 2, canvas.height / 2 - 40);

    ctx.fillStyle = "#fff";
    ctx.font = "32px Arial";
    ctx.fillText("Score: " + Math.floor(score), canvas.width / 2, canvas.height / 2 + 20);

    ctx.font = "26px Arial";
    ctx.fillText("Refresh to play again", canvas.width / 2, canvas.height / 2 + 80);
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
