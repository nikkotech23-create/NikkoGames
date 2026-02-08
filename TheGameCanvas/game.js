const canvas = document.getElementById("gameCanvas");
const ctx = canvas.getContext("2d");

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Load images
const roadImg = new Image();
roadImg.src = "images/road.png";

const carImg = new Image();
carImg.src = "images/car.png";

// Player car
const player = {
  x: canvas.width / 2 - 40,
  y: canvas.height - 180,
  width: 80,
  height: 160,
  speed: 8,
  moveLeft: false,
  moveRight: false
};

// Road scroll
let roadY = 0;

// Controls
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a") player.moveLeft = true;
  if (e.key === "ArrowRight" || e.key === "d") player.moveRight = true;
});

document.addEventListener("keyup", (e) => {
  if (e.key === "ArrowLeft" || e.key === "a") player.moveLeft = false;
  if (e.key === "ArrowRight" || e.key === "d") player.moveRight = false;
});

// Game loop
function update() {
  // Move player
  if (player.moveLeft) player.x -= player.speed;
  if (player.moveRight) player.x += player.speed;

  // Keep inside screen
  player.x = Math.max(0, Math.min(canvas.width - player.width, player.x));

  // Scroll road
  roadY += 10;
  if (roadY >= canvas.height) roadY = 0;
}

function draw() {
  // Draw scrolling road twice for seamless loop
  ctx.drawImage(roadImg, 0, roadY, canvas.width, canvas.height);
  ctx.drawImage(roadImg, 0, roadY - canvas.height, canvas.width, canvas.height);

  // Draw player car
  ctx.drawImage(carImg, player.x, player.y, player.width, player.height);
}

function gameLoop() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  update();
  draw();
  requestAnimationFrame(gameLoop);
}

gameLoop();
