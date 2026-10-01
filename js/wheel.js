/* Roleta: desenhada uma vez em canvas e girada via CSS transform (barato pra GPU).
   A força do giro vem da velocidade angular do arrasto no momento em que solta. */
(function () {
  'use strict';

  const TAU = Math.PI * 2;
  const K = 0.55;     // atrito proporcional à velocidade
  const C = 0.35;     // atrito constante (rad/s²)
  const MAXV = 42;    // velocidade máxima (rad/s)
  const MINV = 4;     // abaixo disso o giro é "fraquinho"
  const WINDOW = 100; // ms de amostras usadas pra medir a força

  const Wheel = {};
  let wrap, canvas, ctx;
  let items = [], theme = { colors: ['#ff5c8a', '#fff'], rim: '#ff4f87', dots: ['#fff', '#ffd23f'], dark: '#5b2238' };
  let rot = 0, vel = 0, spinning = false, dragging = false;
  let lastAngle = 0, samples = [], lastIdx = -1, lastT = 0;
  let cb = {};

  const mod = (a, n) => ((a % n) + n) % n;

  Wheel.init = function (wrapEl, canvasEl, callbacks) {
    wrap = wrapEl;
    canvas = canvasEl;
    ctx = canvas.getContext('2d');
    cb = callbacks;

    new ResizeObserver(resize).observe(wrap);
    if (document.fonts) document.fonts.load('600 24px Fredoka').then(draw, () => {});

    wrap.addEventListener('pointerdown', onDown);
    wrap.addEventListener('pointermove', onMove);
    wrap.addEventListener('pointerup', onUp);
    wrap.addEventListener('pointercancel', onUp);
    wrap.addEventListener('lostpointercapture', onUp);
  };

  Wheel.setItems = function (list) {
    items = list.slice();
    lastIdx = -1;
    draw();
  };

  Wheel.setTheme = function (t) {
    theme = t;
    draw();
  };

  Wheel.isSpinning = () => spinning || dragging;

  Wheel.colorAt = function (i, n) {
    const L = theme.colors.length;
    if (n > 1 && i === n - 1 && (n - 1) % L === 0) return theme.colors[Math.floor(L / 2)];
    return theme.colors[i % L];
  };

  Wheel.spinRandom = function () {
    if (spinning || dragging || !cb.canSpin()) {
      if (!cb.canSpin()) cb.onBlocked();
      return;
    }
    start(MAXV * (0.4 + Math.random() * 0.5));
  };

  /* ---------- desenho ---------- */
  function resize() {
    const size = wrap.clientWidth;
    if (!size) return;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const px = Math.round(size * dpr);
    if (canvas.width !== px) {
      canvas.width = px;
      canvas.height = px;
      draw();
    }
  }

  function luminance(hex) {
    const n = parseInt(hex.slice(1), 16);
    const r = (n >> 16) & 255, g = (n >> 8) & 255, b = n & 255;
    return (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  }

  function fit(text, maxW) {
    if (ctx.measureText(text).width <= maxW) return text;
    const chars = Array.from(text);
    while (chars.length > 1 && ctx.measureText(chars.join('') + '…').width > maxW) chars.pop();
    return chars.join('').trimEnd() + '…';
  }

  function draw() {
    if (!ctx || !canvas.width) return;
    const W = canvas.width, R = W / 2;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, W, W);
    ctx.translate(R, R);

    const rOuter = R * 0.985;
    const rimW = R * 0.08;
    const r = rOuter - rimW;

    // aro
    ctx.beginPath();
    ctx.arc(0, 0, rOuter, 0, TAU);
    ctx.fillStyle = theme.rim;
    ctx.fill();
    const nd = 24;
    for (let i = 0; i < nd; i++) {
      const a = (i / nd) * TAU;
      ctx.beginPath();
      ctx.arc(Math.cos(a) * (rOuter - rimW / 2), Math.sin(a) * (rOuter - rimW / 2), rimW * 0.22, 0, TAU);
      ctx.fillStyle = theme.dots[i % theme.dots.length];
      ctx.fill();
    }

    const n = items.length;
    if (n === 0) {
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, TAU);
      ctx.fillStyle = theme.colors[2] || theme.colors[0];
      ctx.fill();
      return;
    }

    const seg = TAU / n;
    for (let i = 0; i < n; i++) {
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, r, i * seg, (i + 1) * seg);
      ctx.closePath();
      ctx.fillStyle = Wheel.colorAt(i, n);
      ctx.fill();
    }

    // separadores
    if (n > 1) {
      ctx.strokeStyle = 'rgba(255,255,255,.95)';
      ctx.lineWidth = R * 0.012;
      ctx.beginPath();
      for (let i = 0; i < n; i++) {
        ctx.moveTo(0, 0);
        ctx.lineTo(Math.cos(i * seg) * r, Math.sin(i * seg) * r);
      }
      ctx.stroke();
    }

    // sombra interna pra dar volume
    const g = ctx.createRadialGradient(0, 0, r * 0.55, 0, 0, r);
    g.addColorStop(0, 'rgba(0,0,0,0)');
    g.addColorStop(1, 'rgba(0,0,0,0.12)');
    ctx.beginPath();
    ctx.arc(0, 0, r, 0, TAU);
    ctx.fillStyle = g;
    ctx.fill();

    // textos: diminui a fonte até o texto mais longo caber (com um mínimo legível)
    const maxW = r * 0.62;
    const font = (px) => `600 ${px}px Fredoka, "Baloo 2", system-ui, sans-serif`;
    let fs = Math.max(R * 0.04, Math.min(R * 0.08, r * 0.62 * seg * 0.55));
    ctx.font = font(fs);
    const widest = Math.max(...items.map((s) => ctx.measureText(s).width));
    if (widest > maxW) fs = Math.max(R * 0.056, fs * (maxW / widest));
    ctx.font = font(fs);
    ctx.textAlign = 'right';
    ctx.textBaseline = 'middle';
    for (let i = 0; i < n; i++) {
      const col = Wheel.colorAt(i, n);
      ctx.save();
      ctx.rotate((i + 0.5) * seg);
      ctx.fillStyle = luminance(col) > 0.62 ? theme.dark : '#ffffff';
      ctx.fillText(fit(items[i], maxW), r * 0.9, fs * 0.05);
      ctx.restore();
    }
  }

  /* ---------- física ---------- */
  function render() {
    canvas.style.transform = `rotate(${rot}rad)`;
  }

  function currentIndex() {
    const n = items.length;
    if (!n) return -1;
    const a = mod(-Math.PI / 2 - rot, TAU); // ponteiro fica no topo
    return Math.min(n - 1, Math.floor(a / (TAU / n)));
  }

  function checkTick() {
    const idx = currentIndex();
    if (idx !== lastIdx) {
      if (lastIdx !== -1) cb.onTick(Math.abs(vel));
      lastIdx = idx;
    }
  }

  function angleAt(e) {
    const r = wrap.getBoundingClientRect();
    return Math.atan2(e.clientY - (r.top + r.height / 2), e.clientX - (r.left + r.width / 2));
  }

  function measure(now) {
    const recent = samples.filter((s) => now - s.t <= WINDOW);
    if (recent.length < 2) return 0;
    const a = recent[0], b = recent[recent.length - 1];
    if (now - b.t > 80) return 0; // parou de mexer antes de soltar
    const dt = Math.max(0.008, (b.t - a.t) / 1000);
    return Math.max(-MAXV, Math.min(MAXV, (b.a - a.a) / dt));
  }

  function onDown(e) {
    if (e.button > 0 || e.target.closest('.wheel-hub')) return;
    const r = wrap.getBoundingClientRect();
    const dx = e.clientX - (r.left + r.width / 2), dy = e.clientY - (r.top + r.height / 2);
    if (dx * dx + dy * dy > (r.width / 2) * (r.width / 2)) return;
    if (!cb.canSpin()) { cb.onBlocked(); return; }

    e.preventDefault();
    if (spinning) { spinning = false; vel = 0; cb.onCatch(); }
    dragging = true;
    wrap.setPointerCapture(e.pointerId);
    wrap.classList.add('grabbing');
    rot = mod(rot, TAU);
    lastAngle = angleAt(e);
    samples = [{ t: performance.now(), a: rot }];
    cb.onGrab();
  }

  function onMove(e) {
    if (!dragging) return;
    const a = angleAt(e);
    let d = a - lastAngle;
    if (d > Math.PI) d -= TAU;
    else if (d < -Math.PI) d += TAU;
    lastAngle = a;
    rot += d;
    const now = performance.now();
    samples.push({ t: now, a: rot });
    while (samples.length > 2 && now - samples[0].t > 200) samples.shift();
    render();
    checkTick();
    cb.onDrag(Math.abs(measure(now)) / MAXV);
  }

  function onUp() {
    if (!dragging) return;
    dragging = false;
    wrap.classList.remove('grabbing');
    const v = measure(performance.now());
    if (Math.abs(v) >= MINV) start(v);
    else cb.onWeak(Math.abs(v) / MAXV);
  }

  function start(v) {
    vel = v;
    spinning = true;
    lastT = performance.now();
    cb.onSpin(Math.abs(v) / MAXV);
    requestAnimationFrame(loop);
  }

  function loop(now) {
    if (!spinning) return;
    const dt = Math.min(0.05, (now - lastT) / 1000);
    lastT = now;
    const sign = Math.sign(vel);
    const speed = Math.abs(vel) - (K * Math.abs(vel) + C) * dt;
    if (speed <= 0.03) {
      vel = 0;
      spinning = false;
      rot = mod(rot, TAU);
      render();
      cb.onStop(currentIndex());
      return;
    }
    vel = sign * speed;
    rot += vel * dt;
    render();
    checkTick();
    requestAnimationFrame(loop);
  }

  window.Wheel = Wheel;
})();
