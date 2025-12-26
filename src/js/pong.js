const canvas = document.getElementById('c');
const ctx = canvas.getContext('2d');

// Read theme-aware colors from CSS custom properties (fall back to literals)
function _getVar(name) {
  const cs = getComputedStyle(document.documentElement);
  const v = cs.getPropertyValue(name);
  return v && v.trim();
}

function _readGameColors() {
  return {
    arena: _getVar('--secondary'),
    playerPaddle: _getVar('--primary'),
    cpuPaddle: _getVar('--primary'),
    ball: _getVar('--highlight'),
    highlight: _getVar('--highlight'),
    score: _getVar('--secondary'),
  };
}

const GAME_COLORS = _readGameColors();

// Simple WebAudio SFX for paddle bounce only
const audioCtx = (function () {
  try {
    return new (window.AudioContext || window.webkitAudioContext)();
  } catch {
    return null;
  }
})();
function sfxHit({
  freq = 900,
  type = 'triangle',
  dur = 0.06,
  vol = 0.06,
} = {}) {
  if (!audioCtx) return;
  const o = audioCtx.createOscillator();
  const g = audioCtx.createGain();
  o.type = type;
  o.frequency.value = freq;
  g.gain.value = vol;
  o.connect(g);
  g.connect(audioCtx.destination);
  const now = audioCtx.currentTime;
  o.start(now);
  g.gain.setValueAtTime(vol, now);
  g.gain.exponentialRampToValueAtTime(0.001, now + dur);
  o.stop(now + dur + 0.02);
}

// Watch for theme changes (data-theme attribute) and refresh colors live
const _themeObserver = new MutationObserver(() => {
  // recompute and copy values into GAME_COLORS so existing references update
  Object.assign(GAME_COLORS, _readGameColors());
});
_themeObserver.observe(document.documentElement, {
  attributes: true,
  // watch both data-theme (theme toggle) and inline style (applyTheme / randomTheme)
  attributeFilter: ['data-theme', 'style'],
});

// ensure game colors reflect any theme already applied before this script ran
Object.assign(GAME_COLORS, _readGameColors());

// --- Arena ---
const cx = canvas.width / 2;
const cy = canvas.height / 2;
const R = 240;

// --- Game state ---
let playerScore = 0;
let cpuScore = 0;
let running = false;
// Which side is expected to hit next. Flipped on each successful paddle hit.
let currentTurn = 'player';
// Last predicted hit computed at the moment of a paddle collision
let lastPredictedHit = null;

// --- Ball ---
const ball = {
  r: 8,
  x: cx,
  y: cy,
  vx: 0,
  vy: 0,
  speed: 360,
};

// --- Paddles ---
const paddleArcSize = 0.55;
const paddles = {
  player: {
    angle: Math.PI / 2,
    targetAngle: Math.PI / 2,
    turnSpeed: 3,
  },
  cpu: {
    angle: -Math.PI / 2,
    targetAngle: -Math.PI / 2,
    turnSpeed: 1,
  },
};

// --- Input (arrow keys only) ---
const input = { left: false, right: false };
window.addEventListener('keydown', e => {
  if (e.code === 'ArrowLeft') {
    input.left = true;
    e.preventDefault();
  } else if (e.code === 'ArrowRight') {
    input.right = true;
    e.preventDefault();
  }
});
window.addEventListener('keyup', e => {
  if (e.code === 'ArrowLeft') input.left = false;
  else if (e.code === 'ArrowRight') input.right = false;
});

// --- Helpers / timers ---
let serveTimeout = null;

function scheduleServe() {
  if (serveTimeout) clearTimeout(serveTimeout);
  serveTimeout = setTimeout(() => {
    serve();
    serveTimeout = null;
  }, 1000);
}

function serve() {
  // Aim the serve from the center toward whoever's turn it is to hit
  const baseAngle = paddles[currentTurn].angle;
  ball.vx = Math.cos(baseAngle) * ball.speed;
  ball.vy = Math.sin(baseAngle) * ball.speed;
  running = true;
  lastPredictedHit = computeNextHitInfo();
}

function resetPoint(loser) {
  running = false;
  ball.x = cx;
  ball.y = cy;
  ball.speed = 360;
  if (loser === 'player') cpuScore++;
  if (loser === 'cpu') playerScore++;
  lastPredictedHit = null;
  scheduleServe();
}

function wrapAngle(a) {
  while (a <= -Math.PI) a += Math.PI * 2;
  while (a > Math.PI) a -= Math.PI * 2;
  return a;
}

function angleDelta(from, to) {
  return wrapAngle(to - from);
}

function angleInArc(angle, center, size) {
  return Math.abs(angleDelta(center, angle)) <= size / 2;
}

function reflect(vx, vy, nx, ny) {
  const dot = vx * nx + vy * ny;
  return { vx: vx - 2 * dot * nx, vy: vy - 2 * dot * ny };
}

// Returns detailed info about the next intersection of the ball's linear
// trajectory with the arena circle (taking ball radius into account).
// If there's no future intersection, returns null. Otherwise returns an
// object: { t, x, y, angle } where `t` is seconds ahead, `x,y` are
// world coordinates of the hit, and `angle` is atan2(y-cy, x-cx).
function computeNextHitInfo() {
  const dx = ball.x - cx;
  const dy = ball.y - cy;
  const vx = ball.vx;
  const vy = ball.vy;
  const a = vx * vx + vy * vy;
  if (a === 0) return null;
  const b = 2 * (dx * vx + dy * vy);
  const radius = R - ball.r;
  const c = dx * dx + dy * dy - radius * radius;
  const disc = b * b - 4 * a * c;
  if (disc < 0) return null;
  const sq = Math.sqrt(disc);
  const t1 = (-b - sq) / (2 * a);
  const t2 = (-b + sq) / (2 * a);
  let t = null;
  if (t1 > 1e-6) t = t1;
  else if (t2 > 1e-6) t = t2;
  if (t === null) return null;
  const hx = dx + vx * t;
  const hy = dy + vy * t;
  const hitX = cx + hx;
  const hitY = cy + hy;
  return { t, x: hitX, y: hitY, angle: Math.atan2(hy, hx) };
}

// --- Game loop ---
let last = performance.now();
requestAnimationFrame(loop);
scheduleServe();

function loop(now) {
  const dt = Math.min(0.033, (now - last) / 1000);
  last = now;
  try {
    update(dt);
    draw();
  } catch (err) {
    console.error('Error during game loop:', err, err && err.stack);
    running = false;
    return;
  }
  requestAnimationFrame(loop);
}

function update(dt) {
  if (!running) return;

  const p = paddles.player;
  if (input.left) p.targetAngle += p.turnSpeed * dt;
  if (input.right) p.targetAngle -= p.turnSpeed * dt;
  p.angle += angleDelta(p.angle, p.targetAngle) * Math.min(1, 10 * dt);

  const c = paddles.cpu;

  if (currentTurn === 'cpu') {
    // CPU is on turn: prefer the stored prediction from the last paddle hit.
    c.targetAngle = wrapAngle(lastPredictedHit.angle);
  } else {
    // If it's not CPU's turn, hold position opposite the player.
    c.targetAngle = wrapAngle(paddles.player.angle + Math.PI);
  }

  const d = angleDelta(c.angle, c.targetAngle);
  const maxTurn = c.turnSpeed * dt;
  c.angle += Math.max(-maxTurn, Math.min(maxTurn, d));
  c.angle = wrapAngle(c.angle);

  ball.x += ball.vx * dt;
  ball.y += ball.vy * dt;

  const dx = ball.x - cx;
  const dy = ball.y - cy;
  const dist = Math.hypot(dx, dy);
  // ball reached border. check if player or cpu hit it
  if (dist + ball.r >= R) {
    const hitAngle = Math.atan2(dy, dx);
    const pad = paddles[currentTurn];
    // add a little bit exta so it's a bit more forgiving
    const effectiveArc = paddleArcSize * 1.2;
    const nx = dx / dist,
      ny = dy / dist;
    //   ball hit paddle
    if (angleInArc(hitAngle, pad.angle, effectiveArc)) {
      // check if the hit angle lies within the paddle arc
      // Normal reflection plus tangential impulse (spin) based on hit offset
      // reflect current velocity about surface normal (nx,ny)
      const r = reflect(ball.vx, ball.vy, nx, ny);
      // angular offset between paddle center and hit location
      const offsetAngle = angleDelta(pad.angle, hitAngle);
      // half the paddle arc size for normalization
      const half = paddleArcSize / 2;
      // normalized offset clamped to [-1,1]
      const norm = Math.max(-1, Math.min(1, offsetAngle / half));
      // tangent vector components (perpendicular to normal)
      const tx = -ny,
        ty = nx;
      // multiplier controlling how much tangential impulse is applied
      const spinStrength = 0.6;
      // add tangential (spin) impulse to reflected vx
      const newVx = r.vx + tx * norm * ball.speed * spinStrength;
      // add tangential (spin) impulse to reflected vy
      const newVy = r.vy + ty * norm * ball.speed * spinStrength;
      // current speed magnitude (fallback to ball.speed)
      const prevSpeed = Math.hypot(ball.vx, ball.vy) || ball.speed;
      // magnitude of the new velocity (fallback 1 to avoid div by zero)
      const newSpeed = Math.hypot(newVx, newVy) || 1;
      // scale factor to preserve pre-hit speed
      const scale = prevSpeed / newSpeed;
      // apply scaled vx back to ball
      ball.vx = newVx * scale;
      // apply scaled vy back to ball
      ball.vy = newVy * scale;
      // how far the ball penetrated past the arena radius
      const overlap = dist + ball.r - R;
      // compute minimum pushback distance to resolve overlap
      const push = Math.max(1.5, overlap + 1.5);
      // move ball out along the normal to avoid sticking in wall
      ball.x -= nx * push;
      // move ball out along the normal to avoid sticking in wall
      ball.y -= ny * push;
      // After a successful hit, always switch responsibility to the opposite side
      // determine the opposing side
      const otherSide = currentTurn === 'player' ? 'cpu' : 'player';
      // record which side hit last
      // record hit timestamp
      // Persist the turn flip so subsequent logic/highlight uses it
      // flip the turn to the other player
      currentTurn = otherSide;

      // Play hit SFX only
      sfxHit();

      // Store the post-hit predicted contact point so the renderer can show it
      // compute and save the next hit info for rendering/debug
      // Recompute prediction immediately after the hit so CPU can react this frame
      // predicted contact angle for the ball's next hit
      lastPredictedHit = computeNextHitInfo();
      if (lastPredictedHit?.angle !== null) {
        // if prediction available
        if (currentTurn === 'cpu') {
          // cpu should aim for predicted angle
          c.targetAngle = wrapAngle(lastPredictedHit.angle);
        } else {
          // otherwise face opposite of player
          c.targetAngle = wrapAngle(paddles.player.angle + Math.PI);
        }
      }
    } else {
      // Missed: the side whose turn it was failed to hit -> score for the opponent
      // award point to opponent and reset the point
      resetPoint(currentTurn);
    }
  }
}

function draw() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Arena (static circle)
  ctx.beginPath();
  ctx.arc(cx, cy, R, 0, Math.PI * 2);
  ctx.strokeStyle = GAME_COLORS.arena;
  ctx.lineWidth = 4;
  ctx.stroke();

  // for debug. show where next ball will hit
  const nextHit = lastPredictedHit;
  if (nextHit) {
    ctx.beginPath();

    ctx.arc(nextHit.x, nextHit.y, 5, 0, Math.PI * 2);
    ctx.fillStyle = GAME_COLORS.highlight;
    ctx.fill();
  }

  // Highlight the side whose turn it currently is
  const isPlayersTurn = currentTurn === 'player';

  // Paddles (highlight the defender who needs to get the ball)
  drawPaddle(paddles.player.angle, GAME_COLORS.playerPaddle, isPlayersTurn);
  drawPaddle(paddles.cpu.angle, GAME_COLORS.cpuPaddle, !isPlayersTurn);

  // Ball
  ctx.beginPath();
  ctx.arc(ball.x, ball.y, ball.r, 0, Math.PI * 2);
  ctx.fillStyle = GAME_COLORS.ball;
  ctx.fill();

  // Score
  ctx.fillStyle = GAME_COLORS.score;
  ctx.font = '20px system-ui';
  ctx.textAlign = 'center';
  ctx.fillText(`${playerScore} : ${cpuScore}`, cx, cy);

  if (!running) {
    ctx.font = '16px system-ui';
    ctx.fillText('Starting soon', cx, cy + 30);
  }
}

function drawPaddle(angle, color, highlight = false) {
  // If highlighted, draw a soft outer stroke first
  if (highlight) {
    ctx.beginPath();
    ctx.arc(cx, cy, R, angle - paddleArcSize / 2, angle + paddleArcSize / 2);
    ctx.strokeStyle = 'rgba(96,165,250,0.18)';
    ctx.lineWidth = 22;
    ctx.lineCap = 'round';
    ctx.stroke();
  }

  ctx.beginPath();
  ctx.arc(cx, cy, R, angle - paddleArcSize / 2, angle + paddleArcSize / 2);
  ctx.strokeStyle = color;
  ctx.lineWidth = 10;
  ctx.lineCap = 'round';
  ctx.stroke();
}
