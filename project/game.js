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

// ====== GAME STATE ======
let isPaused = false;
let musicOn = true;
let controlMode = "touch";

let player = { x: 200, y: 400, angle: 0 };

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
  isPaused = !isPaused;
  btnPause.textContent = isPaused ? "Resume" : "Pause";
};

btnRestart.onclick = () => {
  player.x = canvas.width / 2 / window.devicePixelRatio;
  player.y = canvas.height / 2 / window.devicePixelRatio;
  isPaused = false;
  btnPause.textContent = "Pause";
};

btnOptions.onclick = () => optionsPanel.style.display = "block";
optionsClose.onclick = () => optionsPanel.style.display = "none";

btnExit.onclick = () => alert("Exit requested.");

btnMusic.onclick = () => {
  musicOn = !musicOn;
  btnMusic.textContent = musicOn ? "Music: On" : "Music: Off";
};

volumeSlider.oninput = () => {
  console.log("Volume:", volumeSlider.value);
};

controlModeSelect.onchange = () => {
  controlMode = controlModeSelect.value;
};

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
  player.x += (pos.x - touchMoveCenter.x) * 0.05;
  player.y += (pos.y - touchMoveCenter.y) * 0.05;
}, { passive: false });

touchMove.addEventListener("touchend", () => touchMoveActive = false);

// Fire button
touchFire.addEventListener("touchstart", e => {
  if (controlMode !== "touch") return;
  e.preventDefault();
  console.log("Touch fire!");
}, { passive: false });

// ====== KEYBOARD ======
const keys = {};
window.addEventListener("keydown", e => keys[e.code] = true);
window.addEventListener("keyup", e => keys[e.code] = false);

function handleKeyboard(dt) {
  if (controlMode !== "keyboard") return;
  const speed = 200 * dt;
  if (keys["ArrowLeft"] || keys["KeyA"]) player.x -= speed;
  if (keys["ArrowRight"] || keys["KeyD"]) player.x += speed;
  if (keys["ArrowUp"] || keys["KeyW"]) player.y -= speed;
  if (keys["ArrowDown"] || keys["KeyS"]) player.y += speed;
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
  if (controlMode !== "gamepad" || gamepadIndex === null) return;
  const gp = navigator.getGamepads()[gamepadIndex];
  if (!gp) return;

  const speed = 200 * dt;
  player.x += gp.axes[0] * speed;
  player.y += gp.axes[1] * speed;

  if (gp.buttons[0].pressed) {
    console.log("Gamepad fire!");
  }
}

// ====== DRAWING ======
function drawPlayer() {
  ctx.save();
  ctx.translate(player.x, player.y);
  ctx.strokeStyle = "rgba(0, 255, 255, 0.9)";
  ctx.lineWidth = 2;
  ctx.shadowBlur = 15;
  ctx.shadowColor = "#00ffff";

  ctx.beginPath();
  ctx.moveTo(0, -16);
  ctx.lineTo(12, 12);
  ctx.lineTo(-12, 12);
  ctx.closePath();
  ctx.stroke();

  ctx.restore();
}

function drawBackground() {
  ctx.fillStyle = "black";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = "rgba(255,255,255,0.4)";
  for (let i = 0; i < 40; i++) {
    ctx.fillRect(Math.random() * canvas.width, Math.random() * canvas.height, 1, 1);
  }
}

// ====== GAME LOOP ======
let lastTime = performance.now();

function gameLoop(t) {
  const dt = (t - lastTime) / 1000;
  lastTime = t;

  if (!isPaused) {
    handleKeyboard(dt);
    handleGamepad(dt);
  }

  drawBackground();
  drawPlayer();

  requestAnimationFrame(gameLoop);
}

requestAnimationFrame(gameLoop);
