const STORAGE_KEY = "zeus-y-apolo-top-scores";
const LEADERBOARD_LIMIT = 10;
const canvas = document.getElementById("game-canvas");
const context = canvas.getContext("2d");
const scoreElement = document.getElementById("score");
const liveScoreValueElement = document.getElementById("live-score-value");
const bestScoreElement = document.getElementById("best-score");
const leaderboardElement = document.getElementById("leaderboard");
const overlay = document.getElementById("overlay");
const overlayTitle = document.getElementById("overlay-title");
const overlayMessage = document.getElementById("overlay-message");
const startButton = document.getElementById("start-button");
const fullscreenButton = document.getElementById("fullscreen-button");
const saveScoreForm = document.getElementById("save-score-form");
const playerNameInput = document.getElementById("player-name");
const startInstructions = document.getElementById("start-instructions");
const resultsPanel = document.getElementById("results-panel");
const touchControls = document.getElementById("touch-controls");
const touchLeft = document.getElementById("touch-left");
const touchRight = document.getElementById("touch-right");

const imagePaths = {
  zeus: "./public/assets/zeus.png",
  apollo: "./public/assets/apolo.png",
  bolt: "./public/assets/rayo.png",
  cloud: "./public/assets/cloud.svg",
  background: "./public/assets/background.svg",
};

const images = {};
const inputState = {
  left: false,
  right: false,
};

const gameState = {
  running: false,
  score: 0,
  animationFrameId: 0,
  lastTime: 0,
  raySpawnTimer: 0,
  raySpawnInterval: 880,
  apollo: null,
  zeus: null,
  rays: [],
  width: 0,
  height: 0,
};

function loadImage(path) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error(`No se pudo cargar ${path}`));
    image.src = path;
  });
}

async function preloadAssets() {
  const entries = await Promise.all(
    Object.entries(imagePaths).map(async ([key, path]) => [key, await loadImage(path)])
  );

  for (const [key, image] of entries) {
    images[key] = image;
  }
}

function isMobileDevice() {
  return window.matchMedia("(pointer: coarse), (max-width: 900px)").matches;
}

function toggleTouchControls() {
  const showTouch = isMobileDevice();
  touchControls.classList.toggle("hidden", !showTouch);
  touchControls.setAttribute("aria-hidden", String(!showTouch));
}

function getTopScores() {
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function setTopScores(scores) {
  window.localStorage.setItem(STORAGE_KEY, JSON.stringify(scores.slice(0, LEADERBOARD_LIMIT)));
}

function qualifiesForLeaderboard(score) {
  const scores = getTopScores();
  if (scores.length < LEADERBOARD_LIMIT) {
    return score > 0;
  }

  const lowestSavedScore = scores[scores.length - 1]?.score ?? 0;
  return score > lowestSavedScore;
}

function renderLeaderboard() {
  const scores = getTopScores();
  leaderboardElement.innerHTML = "";

  if (!scores.length) {
    const emptyItem = document.createElement("li");
    emptyItem.textContent = "Sin puntuaciones guardadas";
    leaderboardElement.appendChild(emptyItem);
    bestScoreElement.textContent = "0";
    return;
  }

  scores.forEach(({ name, score }, index) => {
    const item = document.createElement("li");
    item.innerHTML = `<strong>${index + 1}. ${escapeHtml(name)}</strong><span>${score} pts</span>`;
    leaderboardElement.appendChild(item);
  });

  bestScoreElement.textContent = String(scores[0].score);
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

function resizeCanvas() {
  const frame = canvas.parentElement;
  const rect = frame.getBoundingClientRect();
  const dpr = window.devicePixelRatio || 1;
  canvas.width = Math.floor(rect.width * dpr);
  canvas.height = Math.floor(rect.height * dpr);
  context.setTransform(dpr, 0, 0, dpr, 0, 0);
  gameState.width = rect.width;
  gameState.height = rect.height;

  if (gameState.apollo && gameState.zeus) {
    gameState.apollo.y = gameState.height - 96;
    gameState.zeus.y = Math.max(34, gameState.height * 0.15);
  }
}

function resetGame() {
  gameState.score = 0;
  gameState.lastTime = 0;
  gameState.raySpawnTimer = 0;
  gameState.raySpawnInterval = 880;
  gameState.rays = [];
  gameState.apollo = {
    x: gameState.width / 2 - 42,
    y: gameState.height - 96,
    width: 84,
    height: 84,
    speed: isMobileDevice() ? 360 : 480,
  };
  gameState.zeus = {
    x: gameState.width / 2 - 72,
    y: Math.max(34, gameState.height * 0.15),
    width: 144,
    height: 144,
    speed: 230,
    direction: Math.random() > 0.5 ? 1 : -1,
  };
  updateScore();
}

function startGame() {
  resetGame();
  saveScoreForm.classList.add("hidden");
  resultsPanel.classList.add("hidden");
  startInstructions.classList.add("hidden");
  overlay.classList.remove("visible");
  startButton.textContent = "Reintentar";
  gameState.running = true;
  cancelAnimationFrame(gameState.animationFrameId);
  gameState.animationFrameId = requestAnimationFrame(gameLoop);
}

function stopGame() {
  gameState.running = false;
  cancelAnimationFrame(gameState.animationFrameId);
}

function updateScore() {
  scoreElement.textContent = String(gameState.score);
  liveScoreValueElement.textContent = String(gameState.score);
}

function spawnRay() {
  const zeusCenter = gameState.zeus.x + gameState.zeus.width / 2;
  gameState.rays.push({
    x: zeusCenter - 18,
    y: gameState.zeus.y + gameState.zeus.height - 12,
    width: 36,
    height: 78,
    speed: 320 + Math.min(gameState.score * 8, 260),
  });
}

function updateApollo(deltaSeconds) {
  if (inputState.left && !inputState.right) {
    gameState.apollo.x -= gameState.apollo.speed * deltaSeconds;
  }

  if (inputState.right && !inputState.left) {
    gameState.apollo.x += gameState.apollo.speed * deltaSeconds;
  }

  gameState.apollo.x = Math.max(8, Math.min(gameState.width - gameState.apollo.width - 8, gameState.apollo.x));
}

function updateZeus(deltaSeconds) {
  gameState.zeus.x += gameState.zeus.speed * gameState.zeus.direction * deltaSeconds;

  if (gameState.zeus.x <= 12) {
    gameState.zeus.x = 12;
    gameState.zeus.direction = 1;
  }

  if (gameState.zeus.x + gameState.zeus.width >= gameState.width - 12) {
    gameState.zeus.x = gameState.width - gameState.zeus.width - 12;
    gameState.zeus.direction = -1;
  }

  gameState.raySpawnTimer += deltaSeconds * 1000;
  if (gameState.raySpawnTimer >= gameState.raySpawnInterval) {
    gameState.raySpawnTimer = 0;
    spawnRay();
    gameState.raySpawnInterval = Math.max(300, gameState.raySpawnInterval - 12);
  }
}

function intersects(a, b) {
  return (
    a.x < b.x + b.width &&
    a.x + a.width > b.x &&
    a.y < b.y + b.height &&
    a.y + a.height > b.y
  );
}

function updateRays(deltaSeconds) {
  const apolloHitbox = {
    x: gameState.apollo.x + 12,
    y: gameState.apollo.y + 10,
    width: gameState.apollo.width - 24,
    height: gameState.apollo.height - 14,
  };

  for (let index = gameState.rays.length - 1; index >= 0; index -= 1) {
    const ray = gameState.rays[index];
    ray.y += ray.speed * deltaSeconds;

    if (intersects(ray, apolloHitbox)) {
      finishGame();
      return;
    }

    if (ray.y > gameState.height) {
      gameState.rays.splice(index, 1);
      gameState.score += 1;
      updateScore();
    }
  }
}

function drawBackground() {
  context.drawImage(images.background, 0, 0, gameState.width, gameState.height);
}

function drawCharacters() {
  const cloudWidth = gameState.zeus.width * 1.65;
  const cloudHeight = gameState.zeus.height * 0.72;
  const cloudX = gameState.zeus.x + (gameState.zeus.width - cloudWidth) / 2;
  const cloudY = gameState.zeus.y + gameState.zeus.height - cloudHeight * 0.38;

  context.drawImage(images.cloud, cloudX, cloudY, cloudWidth, cloudHeight);
  context.drawImage(images.zeus, gameState.zeus.x, gameState.zeus.y, gameState.zeus.width, gameState.zeus.height);
  context.drawImage(images.apollo, gameState.apollo.x, gameState.apollo.y, gameState.apollo.width, gameState.apollo.height);
}

function drawRays() {
  for (const ray of gameState.rays) {
    context.save();
    context.shadowColor = "rgba(255, 215, 64, 0.8)";
    context.shadowBlur = 18;
    context.drawImage(images.bolt, ray.x, ray.y, ray.width, ray.height);
    context.restore();
  }
}

function drawScene() {
  context.clearRect(0, 0, gameState.width, gameState.height);
  drawBackground();
  drawCharacters();
  drawRays();
}

function gameLoop(timestamp) {
  if (!gameState.running) {
    return;
  }

  const deltaSeconds = Math.min((timestamp - (gameState.lastTime || timestamp)) / 1000, 0.032);
  gameState.lastTime = timestamp;

  updateApollo(deltaSeconds);
  updateZeus(deltaSeconds);
  updateRays(deltaSeconds);
  drawScene();

  if (gameState.running) {
    gameState.animationFrameId = requestAnimationFrame(gameLoop);
  }
}

function saveTopScore(name, score) {
  const trimmedName = name.trim().slice(0, 18) || "Anonimo";
  const updatedScores = [...getTopScores(), { name: trimmedName, score }]
    .sort((left, right) => right.score - left.score)
    .slice(0, LEADERBOARD_LIMIT);

  setTopScores(updatedScores);
  renderLeaderboard();
}

function finishGame() {
  stopGame();
  const score = gameState.score;
  const isTopScore = qualifiesForLeaderboard(score);

  renderLeaderboard();
  overlay.classList.add("visible");
  overlayTitle.textContent = "Apolo ha caido";
  overlayMessage.textContent = `Has esquivado ${score} rayos.`;
  startInstructions.classList.add("hidden");
  resultsPanel.classList.remove("hidden");
  saveScoreForm.classList.toggle("hidden", !isTopScore);
  playerNameInput.value = "";
  if (isTopScore) {
    playerNameInput.focus();
  }
}

function setMovement(active, direction) {
  inputState[direction] = active;
}

function bindKeyboardControls() {
  window.addEventListener("keydown", (event) => {
    if (["ArrowLeft", "a", "A"].includes(event.key)) {
      setMovement(true, "left");
    }
    if (["ArrowRight", "d", "D"].includes(event.key)) {
      setMovement(true, "right");
    }
  });

  window.addEventListener("keyup", (event) => {
    if (["ArrowLeft", "a", "A"].includes(event.key)) {
      setMovement(false, "left");
    }
    if (["ArrowRight", "d", "D"].includes(event.key)) {
      setMovement(false, "right");
    }
  });
}

function bindTouchButton(button, direction) {
  const activate = (event) => {
    event.preventDefault();
    setMovement(true, direction);
  };
  const deactivate = (event) => {
    event.preventDefault();
    setMovement(false, direction);
  };

  button.addEventListener("pointerdown", activate);
  button.addEventListener("pointerup", deactivate);
  button.addEventListener("pointerleave", deactivate);
  button.addEventListener("pointercancel", deactivate);
}

async function requestFullscreen() {
  const root = document.documentElement;
  if (!document.fullscreenElement) {
    await root.requestFullscreen?.();
    return;
  }

  await document.exitFullscreen?.();
}

async function init() {
  await preloadAssets();
  toggleTouchControls();
  renderLeaderboard();
  resizeCanvas();
  resetGame();
  drawScene();
  resultsPanel.classList.add("hidden");
  startInstructions.classList.remove("hidden");
  bindKeyboardControls();
  bindTouchButton(touchLeft, "left");
  bindTouchButton(touchRight, "right");

  window.addEventListener("resize", () => {
    toggleTouchControls();
    resizeCanvas();
    if (!gameState.running) {
      drawScene();
    }
  });

  startButton.addEventListener("click", startGame);
  fullscreenButton.addEventListener("click", () => {
    requestFullscreen().catch(() => {});
  });

  saveScoreForm.addEventListener("submit", (event) => {
    event.preventDefault();
    saveTopScore(playerNameInput.value, gameState.score);
    saveScoreForm.classList.add("hidden");
    resultsPanel.classList.remove("hidden");
    overlayMessage.textContent = `Has esquivado ${gameState.score} rayos. Puntuacion guardada.`;
  });
}

init().catch((error) => {
  overlay.classList.add("visible");
  overlayTitle.textContent = "Error al cargar el juego";
  overlayMessage.textContent = error.message;
  startButton.disabled = true;
});