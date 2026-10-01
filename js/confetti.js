/* Confete em canvas 2D. O loop só roda enquanto houver partículas na tela. */
(function () {
  'use strict';

  const Confetti = {};
  const MAX = 520;
  let cv, ctx, W = 0, H = 0, dpr = 1;
  let parts = [];
  let running = false, last = 0;

  const heart = new Path2D('M0 .35C-.12 .25-.5 0-.5-.2C-.5-.45-.18-.55 0-.3C.18-.55.5-.45.5-.2C.5 0 .12.25 0 .35Z');
  const star = (() => {
    const p = new Path2D();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 0.22 : 0.5;
      const a = (i / 10) * Math.PI * 2 - Math.PI / 2;
      i ? p.lineTo(Math.cos(a) * r, Math.sin(a) * r) : p.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    p.closePath();
    return p;
  })();
  const SHAPES = ['rect', 'rect', 'circle', 'heart', 'heart', 'star'];
  const rand = (a, b) => a + Math.random() * (b - a);
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    W = window.innerWidth;
    H = window.innerHeight;
    cv.width = Math.round(W * dpr);
    cv.height = Math.round(H * dpr);
  }

  function spawn(p) {
    if (parts.length >= MAX) parts.shift();
    parts.push(p);
  }

  Confetti.init = function (canvas) {
    cv = canvas;
    ctx = cv.getContext('2d');
    resize();
    window.addEventListener('resize', resize);
  };

  Confetti.burst = function (x, y, { count = 120, colors = ['#ff4f87', '#fff'], power = 1 } = {}) {
    for (let i = 0; i < count; i++) {
      const a = rand(0, Math.PI * 2);
      const s = rand(3, 15) * power;
      spawn({
        x, y,
        vx: Math.cos(a) * s,
        vy: Math.sin(a) * s - rand(2, 6),
        size: rand(8, 15),
        rot: rand(0, 6.28), vr: rand(-0.25, 0.25),
        flip: rand(0, 6.28), vf: rand(0.08, 0.2),
        color: pick(colors), shape: pick(SHAPES),
        life: rand(2.2, 3.6),
      });
    }
    start();
  };

  Confetti.rain = function ({ count = 90, colors = ['#ff4f87', '#fff'] } = {}) {
    for (let i = 0; i < count; i++) {
      spawn({
        x: rand(0, W), y: rand(-H * 0.6, -20),
        vx: rand(-1.5, 1.5), vy: rand(1, 4),
        size: rand(8, 14),
        rot: rand(0, 6.28), vr: rand(-0.15, 0.15),
        flip: rand(0, 6.28), vf: rand(0.05, 0.15),
        color: pick(colors), shape: pick(SHAPES),
        life: rand(4, 6),
      });
    }
    start();
  };

  function start() {
    if (running) return;
    running = true;
    last = performance.now();
    requestAnimationFrame(frame);
  }

  function frame(now) {
    const k = Math.min(3, (now - last) / 16.67); // passos relativos a 60fps
    last = now;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, cv.width, cv.height);

    let alive = 0;
    for (let i = 0; i < parts.length; i++) {
      const p = parts[i];
      p.vy += 0.22 * k;
      p.vx *= Math.pow(0.985, k);
      p.vy *= Math.pow(0.985, k);
      p.vx += Math.sin(p.flip) * 0.04 * k;
      p.x += p.vx * k;
      p.y += p.vy * k;
      p.rot += p.vr * k;
      p.flip += p.vf * k;
      p.life -= k / 60;
      if (p.life <= 0 || p.y > H + 40) continue;
      parts[alive++] = p;

      const sx = p.size * Math.cos(p.flip);
      const sy = p.size;
      const c = Math.cos(p.rot), s = Math.sin(p.rot);
      ctx.setTransform(c * sx * dpr, s * sx * dpr, -s * sy * dpr, c * sy * dpr, p.x * dpr, p.y * dpr);
      ctx.globalAlpha = p.life < 0.6 ? p.life / 0.6 : 1;
      ctx.fillStyle = p.color;
      switch (p.shape) {
        case 'rect': ctx.fillRect(-0.5, -0.3, 1, 0.6); break;
        case 'circle': ctx.beginPath(); ctx.arc(0, 0, 0.4, 0, 6.283); ctx.fill(); break;
        case 'heart': ctx.fill(heart); break;
        default: ctx.fill(star);
      }
    }
    parts.length = alive;
    ctx.globalAlpha = 1;

    if (alive) requestAnimationFrame(frame);
    else {
      running = false;
      ctx.setTransform(1, 0, 0, 1, 0, 0);
      ctx.clearRect(0, 0, cv.width, cv.height);
    }
  }

  window.Confetti = Confetti;
})();
