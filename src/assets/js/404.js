function initSnakeGame() {
  const canvas = document.getElementById("snake404-game");
  if (!canvas) return;
  const ctx = canvas.getContext("2d");

  // Extract CSS variable colors once
  const rootStyle = getComputedStyle(document.documentElement);
  const colorVars = {
    background: rootStyle.getPropertyValue("--background").trim(),
    primary: rootStyle.getPropertyValue("--primary").trim(),
    secondary: rootStyle.getPropertyValue("--secondary").trim(),
    highlight: rootStyle.getPropertyValue("--highlight").trim(),
    surface: rootStyle.getPropertyValue("--surface").trim(),
  };

  const tileSize = 20;
  const tileCount = canvas.width / tileSize;

  let snake;
  let foodX;
  let foodY;
  let dx;
  let dy;
  let directionQueue;
  let gameOver;
  let foodEaten;
  let moveInterval;
  let moveTimerId;

  function resetGame() {
    snake = [
      { x: 5, y: 5 },
      { x: 4, y: 5 },
      { x: 3, y: 5 },
    ];
    dx = 1;
    dy = 0;
    directionQueue = [];
    gameOver = false;
    foodEaten = 0;
    moveInterval = 220;
    if (moveTimerId) clearInterval(moveTimerId);
    moveTimerId = null;
    placeFood();
    drawGame();
    updateSpeed();
  }

  function placeFood() {
    let nextFoodX, nextFoodY;
    let validPosition = false;
    while (!validPosition) {
      nextFoodX = Math.floor(Math.random() * tileCount);
      nextFoodY = Math.floor(Math.random() * tileCount);
      validPosition = true;
      for (const part of snake) {
        if (part.x === nextFoodX && part.y === nextFoodY) {
          validPosition = false;
          break;
        }
      }
    }

    // set new food position
    foodX = nextFoodX;
    foodY = nextFoodY;
  }

  function drawGrid() {
    ctx.strokeStyle = colorVars.surface;
    ctx.lineWidth = 1;
    for (let i = 0; i <= tileCount; i++) {
      const pos = i * tileSize;
      ctx.beginPath();
      ctx.moveTo(pos, 0);
      ctx.lineTo(pos, canvas.height);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(0, pos);
      ctx.lineTo(canvas.width, pos);
      ctx.stroke();
    }
  }

  function drawFood() {
    ctx.fillStyle = colorVars.highlight;
    ctx.fillRect(foodX * tileSize, foodY * tileSize, tileSize, tileSize);
  }

  function drawSnake() {
    for (let i = 0; i < snake.length; i++) {
      const part = snake[i];
      ctx.fillStyle = i === 0 ? colorVars.primary : colorVars.secondary;
      ctx.fillRect(part.x * tileSize, part.y * tileSize, tileSize, tileSize);
    }
  }

  function drawGameOver() {
    if (!gameOver) return;
    ctx.fillStyle = colorVars.background + "b3";
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = colorVars.primary;
    ctx.font = "40px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Game Over", canvas.width / 2, canvas.height / 2 - 10);
    ctx.font = "20px Arial";
    ctx.fillText(
      "Press R to restart",
      canvas.width / 2,
      canvas.height / 2 + 30,
    );
    ctx.textAlign = "left";
  }

  function drawGame() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawGrid();
    drawFood();
    drawSnake();
    drawGameOver();
  }

  function checkWallCollision(headX, headY) {
    return headX < 0 || headX >= tileCount || headY < 0 || headY >= tileCount;
  }

  function checkSelfCollision(headX, headY) {
    const willEatFood = headX === foodX && headY === foodY;
    const bodyToCheck = willEatFood ? snake : snake.slice(0, -1);
    for (const part of bodyToCheck) {
      if (part.x === headX && part.y === headY) return true;
    }
    return false;
  }

  function checkFoodCollision(headX, headY) {
    return headX === foodX && headY === foodY;
  }

  function updateSpeed() {
    const newInterval = Math.max(80, 220 - foodEaten * 10);
    const shouldRestart = moveTimerId == null || newInterval !== moveInterval;
    moveInterval = newInterval;
    if (shouldRestart) {
      if (moveTimerId) clearInterval(moveTimerId);
      moveTimerId = setInterval(() => {
        if (!gameOver) {
          moveSnake();
          drawGame();
        }
      }, moveInterval);
    }
  }

  function playTone(frequency, duration) {
    const AudioContextClass = window.AudioContext;
    if (!AudioContextClass) return;
    if (!playTone.audioContext) playTone.audioContext = new AudioContextClass();
    const audioContext = playTone.audioContext;
    if (audioContext.state === "suspended") audioContext.resume();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    oscillator.type = "square";
    oscillator.frequency.value = frequency;
    gainNode.gain.setValueAtTime(0.05, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(
      0.001,
      audioContext.currentTime + duration,
    );
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration);
  }

  function queueDirection(newDx, newDy) {
    let lastDx = dx;
    let lastDy = dy;
    if (directionQueue.length > 0) {
      const lastQueued = directionQueue[directionQueue.length - 1];
      lastDx = lastQueued.dx;
      lastDy = lastQueued.dy;
    }
    const isSameDirection = lastDx === newDx && lastDy === newDy;
    const isReverseDirection = lastDx === -newDx && lastDy === -newDy;
    if (isSameDirection || isReverseDirection) return;
    if (directionQueue.length < 2)
      directionQueue.push({ dx: newDx, dy: newDy });
  }

  function moveSnake() {
    if (gameOver) return;
    if (directionQueue.length > 0) {
      const nextDirection = directionQueue.shift();
      dx = nextDirection.dx;
      dy = nextDirection.dy;
    }
    const headX = snake[0].x + dx;
    const headY = snake[0].y + dy;
    if (checkWallCollision(headX, headY) || checkSelfCollision(headX, headY)) {
      gameOver = true;
      playTone(120, 0.3);
      return;
    }
    if (checkFoodCollision(headX, headY)) {
      foodEaten = foodEaten + 1;
      updateSpeed();
      placeFood();
      playTone(500, 0.08);
    } else {
      snake.pop();
    }

    const newHead = { x: headX, y: headY };
    snake.unshift(newHead);
  }

  document.addEventListener(
    "keydown",
    function (event) {
      // Prevent page scroll for arrow keys if the event would move the snake
      if (
        ["ArrowRight", "ArrowLeft", "ArrowUp", "ArrowDown"].includes(event.key)
      ) {
        event.preventDefault();
      }

      if (event.key === "r" || event.key === "R") {
        resetGame();
        return;
      }
      if (event.key === "ArrowRight") {
        queueDirection(1, 0);
      } else if (event.key === "ArrowLeft") {
        queueDirection(-1, 0);
      } else if (event.key === "ArrowUp") {
        queueDirection(0, -1);
      } else if (event.key === "ArrowDown") {
        queueDirection(0, 1);
      }
    },
    { passive: false },
  );

  resetGame();
}

initSnakeGame();
