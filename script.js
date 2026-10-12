// Simple Pong game
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const W = canvas.width;
const H = canvas.height;

// Game settings
const PADDLE_WIDTH = 12;
const PADDLE_HEIGHT = 110;
const BALL_RADIUS = 8;
const WIN_SCORE = 10;

// Left paddle (player)
const left = {
  x: 16,
  y: (H - PADDLE_HEIGHT) / 2,
  w: PADDLE_WIDTH,
  h: PADDLE_HEIGHT,
  speed: 6,
  dy: 0
};

// Right paddle (computer)
const right = {
  x: W - 16 - PADDLE_WIDTH,
  y: (H - PADDLE_HEIGHT) / 2,
  w: PADDLE_WIDTH,
  h: PADDLE_HEIGHT,
  speed: 4 // AI max speed
};

let mouseY = null;
let mouseActive = false;
const keys = {};

// Ball
const ball = {
  x: W / 2,
  y: H / 2,
  r: BALL_RADIUS,
  speed: 5,
  vx: 0,
  vy: 0
};

let score = { left: 0, right: 0 };
let lastTime = 0;
let running = true;

// Helpers
function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

function resetBall(servingToRight = Math.random() < 0.5) {
  ball.x = W / 2;
  ball.y = H / 2;
  ball.speed = 5;
  // Random angle between -30 to 30 degrees
  const angle = (Math.random() * Math.PI / 3) - (Math.PI / 6);
  ball.vx = (servingToRight ? 1 : -1) * Math.cos(angle) * ball.speed;
  ball.vy = Math.sin(angle) * ball.speed;
}

// Collision detection between ball and paddle
function paddleCollision(p) {
  const withinX = ball.x - ball.r <= p.x + p.w && ball.x + ball.r >= p.x;
  const withinY = ball.y + ball.r >= p.y && ball.y - ball.r <= p.y + p.h;
  return withinX && withinY;
}

function handlePaddleBounce(p, isLeftPaddle) {
  // Compute normalized hit position: -1 (top) to 1 (bottom)
  const relativeY = (ball.y - (p.y + p.h / 2));
  const normalized = relativeY / (p.h / 2);
  const maxBounce = Math.PI / 3; // 60 degrees
  const bounceAngle = normalized * maxBounce;

  const speed = Math.min(12, ball.speed * 1.05); // slightly increase speed
  ball.speed = speed;

  // Direction depends on which paddle
  const direction = isLeftPaddle ? 1 : -1;
  ball.vx = Math.cos(bounceAngle) * speed * direction;
  ball.vy = Math.sin(bounceAngle) * speed;
}

function update(dt) {
  if (!running) return;

  // Player paddle: keyboard movement
  if (keys['ArrowUp']) left.y -= left.speed;
  if (keys['ArrowDown']) left.y += left.speed;

  // Mouse control: if active and not using keyboard, follow mouse
  if (mouseActive && !keys['ArrowUp'] && !keys['ArrowDown']) {
    left.y = mouseY - left.h / 2;
  }

  left.y = clamp(left.y, 0, H - left.h);

  // AI paddle: simple tracking
  const aiCenter = right.y + right.h / 2;
  const delta = ball.y - aiCenter;
  if (Math.abs(delta) > 8) {
    right.y += clamp(delta, -right.speed, right.speed);
  }
  right.y = clamp(right.y, 0, H - right.h);

  // Move ball
  ball.x += ball.vx;
  ball.y += ball.vy;

  // Wall collision
  if (ball.y - ball.r <= 0) {
    ball.y = ball.r;
    ball.vy = -ball.vy;
  } else if (ball.y + ball.r >= H) {
    ball.y = H - ball.r;
    ball.vy = -ball.vy;
  }

  // Paddle collisions
  if (paddleCollision(left) && ball.vx < 0) {
    // push ball out to avoid sticking
    ball.x = left.x + left.w + ball.r + 0.5;
    handlePaddleBounce(left, true);
  } else if (paddleCollision(right) && ball.vx > 0) {
    ball.x = right.x - ball.r - 0.5;
    handlePaddleBounce(right, false);
  }

  // Scoring
  if (ball.x < -ball.r) {
    // right scores
    score.right += 1;
    if (score.right >= WIN_SCORE) {
      running = false;
    }
    resetBall(true);
  } else if (ball.x > W + ball.r) {
    // left scores
    score.left += 1;
    if (score.left >= WIN_SCORE) {
      running = false;
    }
    resetBall(false);
  }
}

function drawNet() {
  ctx.fillStyle = '#ffffff22';
  const step = 14;
  const w = 4;
  for (let y = 8; y < H; y += step) {
    ctx.fillRect((W - w) / 2, y, w, step / 2);
  }
}

function draw() {
  // Clear
  ctx.clearRect(0, 0, W, H);

  // Background subtle panel
  ctx.fillStyle = '#ffffff03';
  ctx.fillRect(0, 0, W, H);

  // Net
  drawNet();

  // Paddles
  ctx.fillStyle = '#39a7d8';
  roundRect(ctx, left.x, left.y, left.w, left.h, 6);
  roundRect(ctx, right.x, right.y, right.w, right.h, 6);

  // Ball
  ctx.beginPath();
  ctx.fillStyle = '#e6e6e6';
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fill();

  // Scores
  ctx.fillStyle = '#e6e6e6';
  ctx.font = '36px "Segoe UI", Roboto, Arial';
  ctx.textAlign = 'center';
  ctx.fillText(score.left, W / 2 - 60, 48);
  ctx.fillText(score.right, W / 2 + 60, 48);

  // Pause/End message
  if (!running) {
    ctx.fillStyle = 'rgba(0,0,0,0.6)';
    ctx.fillRect(W/4, H/2 - 50, W/2, 100);
    ctx.fillStyle = '#fff';
    ctx.font = '24px "Segoe UI"';
    ctx.textAlign = 'center';
    const winner = score.left > score.right ? 'You win!' : 'Computer wins';
    ctx.fillText(winner, W/2, H/2 - 6);
    ctx.font = '16px "Segoe UI"';
    ctx.fillText('Refresh page to play again', W/2, H/2 + 26);
  }
}

// Utility: rounded rect
function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
  ctx.fill();
}

function loop(timestamp) {
  const dt = (timestamp - lastTime) / 16.67; // ~60fps baseline
  lastTime = timestamp;
  update(dt);
  draw();
  requestAnimationFrame(loop);
}

// Input handlers
canvas.addEventListener('mousemove', (e) => {
  const rect = canvas.getBoundingClientRect();
  mouseY = (e.clientY - rect.top);
  mouseActive = true;
});

canvas.addEventListener('mouseleave', () => {
  mouseActive = false;
});

window.addEventListener('keydown', (e) => {
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    keys[e.key] = true;
    e.preventDefault();
  }
  if (e.key === ' ') {
    // toggle pause
    running = !running;
  }
});

window.addEventListener('keyup', (e) => {
  if (e.key === 'ArrowUp' || e.key === 'ArrowDown') {
    keys[e.key] = false;
    e.preventDefault();
  }
});

// Initialize
resetBall(Math.random() < 0.5);
requestAnimationFrame(loop);