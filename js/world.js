/* Mundo 3D com Three.js (r169): iluminação física, reflexos de ambiente e a bonequinha em vinil num pedestal neon.
   Otimizações: Three.js carregado só depois da interface; objetos repetidos via InstancedMesh (poucas draw calls);
   sem sombras em tempo real (sombra "de contato" falsa); pixel ratio limitado e adaptativo; máximo de 60fps;
   nada é renderizado com a aba escondida. */
(function () {
  'use strict';

  const World = { ready: false };
  window.World = World;

  let T, canvas, renderer, scene, camera, pmrem, envTex = null;
  let skyMat, groundMat, hillsMat, hemi, sun;
  let root = null, props = [], extras = [], disposables = [];
  const mats = new Map();
  const G = {};
  let spriteTex, heartTex, shadowTex;
  let pending = null, switchToken = 0, currentTheme = null;
  let t = 0, last = 0, age = 0;
  let celebrate = 0, excited = 0;
  const pointer = { x: 0, y: 0 }, cam = { x: 0, y: 0 };
  let pr = 1, slow = 0, frames = 0;
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  let dummy, tmpM, tmpC;

  // bonequinha
  let rig, holder, pedestal, neonTop, neonBottom, figure = null, figureBorn = 0;
  let slotEl = null, jumpStart = -1, wasJump = false;
  const customs = new Map(); // id -> { scene, animations }
  let mixer = null;
  let thumbCb = null, readyCb = null;
  const thumbs = new Map();

  // endereço completo (o mesmo do import map), pra funcionar mesmo se o navegador ignorar o mapa
  const THREE_URL = 'https://cdn.jsdelivr.net/npm/three@0.169.0/build/three.module.min.js';

  World.load = function (el) {
    canvas = el;
    import(THREE_URL)
      .then((mod) => init(mod))
      .catch((e) => console.warn('Não deu pra carregar o 3D — seguindo com o fundo em gradiente.', e));
  };
  World.setTheme = function (theme) {
    pending = theme;
    if (World.ready) applyTheme(theme);
  };
  World.celebrate = () => { celebrate = 1; };
  World.setExcited = (v) => { excited = v ? 1 : 0; };
  World.setSlot = (el) => { slotEl = el; };
  World.onThumbs = (cb) => { thumbCb = cb; thumbs.forEach((v, id) => cb(id, v)); };
  World.onReady = (cb) => { readyCb = cb; if (World.ready) cb(); };

  /* ---------- setup ---------- */
  function init(THREE) {
    T = THREE;
    if (World.ready) return;
    try {
      renderer = new T.WebGLRenderer({ canvas, antialias: (window.devicePixelRatio || 1) < 2, powerPreference: 'high-performance' });
    } catch (e) {
      console.warn('WebGL indisponível', e);
      return;
    }
    pr = Math.min(window.devicePixelRatio || 1, 1.5);
    renderer.setPixelRatio(pr);
    renderer.toneMapping = T.NeutralToneMapping;
    renderer.toneMappingExposure = 1.0;
    pmrem = new T.PMREMGenerator(renderer);

    dummy = new T.Object3D();
    tmpM = new T.Matrix4();
    tmpC = new T.Color();

    scene = new T.Scene();
    scene.fog = new T.Fog(0xffffff, 40, 170);
    camera = new T.PerspectiveCamera(50, 1, 0.1, 600);
    scene.add(camera);

    skyMat = new T.ShaderMaterial({
      uniforms: { top: { value: new T.Color() }, bottom: { value: new T.Color() } },
      vertexShader: 'varying float vH; void main(){ vH = normalize(position).y; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform vec3 top; uniform vec3 bottom; varying float vH; void main(){ gl_FragColor = vec4(mix(bottom, top, smoothstep(-0.02, 0.55, vH)), 1.0);\n#include <colorspace_fragment>\n}',
      side: T.BackSide,
      depthWrite: false,
      toneMapped: false,
    });
    scene.add(new T.Mesh(new T.SphereGeometry(450, 32, 16), skyMat));

    groundMat = new T.MeshStandardMaterial({ color: 0xa5e28f, roughness: 0.95 });
    const ground = new T.Mesh(new T.CircleGeometry(260, 48), groundMat);
    ground.rotation.x = -Math.PI / 2;
    scene.add(ground);

    hillsMat = new T.MeshStandardMaterial({ color: 0x86d173, roughness: 0.9 });
    const hills = new T.InstancedMesh(new T.SphereGeometry(1, 24, 12), hillsMat, 11);
    [[-120, -95, 40, 16, 28], [-70, -115, 34, 20, 26], [-20, -130, 46, 14, 30], [35, -120, 38, 22, 26], [90, -105, 42, 15, 28],
      [140, -85, 36, 18, 26], [-150, -60, 30, 12, 24], [150, -40, 28, 10, 22], [-60, -75, 22, 8, 16], [60, -80, 24, 9, 18], [0, -95, 26, 7, 18]]
      .forEach(([x, z, sx, sy, sz], i) => {
        dummy.position.set(x, -2, z);
        dummy.scale.set(sx, sy, sz);
        dummy.updateMatrix();
        hills.setMatrixAt(i, dummy.matrix);
      });
    scene.add(hills);

    hemi = new T.HemisphereLight(0xffffff, 0xffffff, 1.1);
    sun = new T.DirectionalLight(0xffffff, 2.2);
    sun.position.set(6, 12, 10);
    scene.add(hemi, sun);

    buildGeometries();
    spriteTex = makeSprite();
    heartTex = makeHeartSprite();
    shadowTex = makeShadow();
    buildRig();

    resize();
    window.addEventListener('resize', resize);
    window.addEventListener('pointermove', (e) => {
      pointer.x = (e.clientX / window.innerWidth) * 2 - 1;
      pointer.y = (e.clientY / window.innerHeight) * 2 - 1;
      pointer.cx = e.clientX;
      pointer.cy = e.clientY;
    }, { passive: true });

    World.ready = true;
    if (pending) applyTheme(pending, true);
    canvas.classList.add('ready');
    requestAnimationFrame(loop);
    if (readyCb) readyCb();
    const idle = window.requestIdleCallback || ((f) => setTimeout(f, 300));
    idle(() => makeThumbs(window.SANRIO.list.map((c) => c.id)));
  }

  function resize() {
    const w = window.innerWidth, h = window.innerHeight;
    renderer.setSize(w, h, false);
    camera.aspect = w / h;
    camera.fov = w / h < 0.8 ? 64 : 50;
    camera.updateProjectionMatrix();
  }

  function canvasTex(size, draw) {
    const c = document.createElement('canvas');
    c.width = c.height = size;
    draw(c.getContext('2d'), size);
    const tex = new T.CanvasTexture(c);
    tex.colorSpace = T.SRGBColorSpace;
    return tex;
  }
  const makeSprite = () => canvasTex(64, (g) => {
    const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
    grd.addColorStop(0, 'rgba(255,255,255,1)');
    grd.addColorStop(0.35, 'rgba(255,255,255,.85)');
    grd.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 64, 64);
  });
  const makeHeartSprite = () => canvasTex(128, (g) => {
    g.filter = 'blur(5px)';
    g.fillStyle = '#fff';
    g.translate(64, 70);
    g.scale(44, 44);
    g.beginPath();
    g.moveTo(0, 0.7);
    g.bezierCurveTo(-0.2, 0.5, -1, 0, -1, -0.4);
    g.bezierCurveTo(-1, -0.9, -0.35, -1.05, 0, -0.6);
    g.bezierCurveTo(0.35, -1.05, 1, -0.9, 1, -0.4);
    g.bezierCurveTo(1, 0, 0.2, 0.5, 0, 0.7);
    g.fill();
  });
  const makeShadow = () => canvasTex(128, (g) => {
    const grd = g.createRadialGradient(64, 64, 0, 64, 64, 64);
    grd.addColorStop(0, 'rgba(0,0,0,.55)');
    grd.addColorStop(0.5, 'rgba(0,0,0,.25)');
    grd.addColorStop(1, 'rgba(0,0,0,0)');
    g.fillStyle = grd;
    g.fillRect(0, 0, 128, 128);
  });

  /* ambiente pra reflexos (estúdio com painéis de luz, tingido pelo tema) */
  function envScene(top, bottom) {
    const s = new T.Scene();
    const geo = new T.SphereGeometry(10, 32, 16);
    const col = [];
    const c1 = new T.Color(top), c2 = new T.Color(bottom);
    const pos = geo.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const k = (pos.getY(i) / 10 + 1) / 2;
      tmpC.copy(c2).lerp(c1, k);
      col.push(tmpC.r, tmpC.g, tmpC.b);
    }
    geo.setAttribute('color', new T.Float32BufferAttribute(col, 3));
    s.add(new T.Mesh(geo, new T.MeshBasicMaterial({ vertexColors: true, side: T.BackSide })));
    const panel = (w, h, p, intensity) => {
      const m = new T.MeshBasicMaterial({ color: new T.Color(intensity, intensity, intensity), side: T.DoubleSide });
      const mesh = new T.Mesh(new T.PlaneGeometry(w, h), m);
      mesh.position.set(...p);
      mesh.lookAt(0, 0, 0);
      s.add(mesh);
    };
    panel(8, 4, [0, 8, 2], 3.5);
    panel(4, 6, [-8, 2, 5], 2.2);
    panel(4, 6, [8, 3, 4], 1.6);
    panel(10, 3, [0, 1, -9], 1.2);
    return s;
  }
  function makeEnv(r, pm, top, bottom) {
    const s = envScene(top, bottom);
    const tex = pm.fromScene(s, 0.04).texture;
    s.traverse((o) => { if (o.isMesh) { o.geometry.dispose(); o.material.dispose(); } });
    return tex;
  }

  /* ---------- geometrias compartilhadas ---------- */
  function buildGeometries() {
    G.sphere = new T.SphereGeometry(1, 20, 14);
    G.cyl = new T.CylinderGeometry(1, 1, 1, 18);
    G.cone = new T.ConeGeometry(1, 1, 18);
    G.pyramid = new T.ConeGeometry(1, 1, 4);
    G.box = new T.BoxGeometry(1, 1, 1);
    G.torus = new T.TorusGeometry(1, 0.45, 12, 24);
    G.taper = new T.CylinderGeometry(0.72, 1, 1, 20);
    G.disc = new T.CylinderGeometry(1, 1, 1, 32);
    G.plane = new T.PlaneGeometry(1, 1);

    const h = new T.Shape();
    h.moveTo(0, -1);
    h.bezierCurveTo(-0.2, -0.75, -1.1, -0.35, -1.1, 0.25);
    h.bezierCurveTo(-1.1, 0.8, -0.45, 1.05, 0, 0.6);
    h.bezierCurveTo(0.45, 1.05, 1.1, 0.8, 1.1, 0.25);
    h.bezierCurveTo(1.1, -0.35, 0.2, -0.75, 0, -1);
    G.heart = new T.ExtrudeGeometry(h, { depth: 0.35, bevelEnabled: true, bevelThickness: 0.2, bevelSize: 0.18, bevelSegments: 5, curveSegments: 14 });
    G.heart.center();

    const s = new T.Shape();
    for (let i = 0; i < 10; i++) {
      const r = i % 2 ? 0.45 : 1;
      const a = (i / 10) * Math.PI * 2 + Math.PI / 2;
      i ? s.lineTo(Math.cos(a) * r, Math.sin(a) * r) : s.moveTo(Math.cos(a) * r, Math.sin(a) * r);
    }
    G.star = new T.ExtrudeGeometry(s, { depth: 0.3, bevelEnabled: true, bevelThickness: 0.16, bevelSize: 0.13, bevelSegments: 4 });
    G.star.center();
  }

  function mat(color) {
    let m = mats.get(color);
    if (!m) {
      m = new T.MeshStandardMaterial({ color: color === 'tint' ? 0xffffff : color, roughness: 0.42, metalness: 0 });
      mats.set(color, m);
    }
    return m;
  }
  function glow(color) {
    const key = 'glow' + color;
    let m = mats.get(key);
    if (!m) {
      m = new T.MeshBasicMaterial({ color, toneMapped: false });
      mats.set(key, m);
    }
    return m;
  }

  function M(geo, color, s, p = [0, 0, 0], r = [0, 0, 0], material) {
    const m = new T.Mesh(geo, material || mat(color));
    if (color === 'tint') m.name = 'tint';
    m.scale.set(s[0], s[1], s[2]);
    m.position.set(p[0], p[1], p[2]);
    m.rotation.set(r[0], r[1], r[2]);
    return m;
  }
  const grp = (...kids) => { const g = new T.Group(); kids.forEach((k) => g.add(k)); return g; };

  /* ---------- protótipos dos objetos ---------- */
  const PROTOS = {
    tree: (o) => grp(
      M(G.cyl, o.trunk || '#a9744f', [0.22, 1.6, 0.22], [0, 0.8, 0]),
      M(G.sphere, o.leaf, [1.25, 1.1, 1.25], [0, 2.2, 0]),
      M(G.sphere, o.leaf, [0.85, 0.8, 0.85], [0.75, 1.9, 0.25]),
      M(G.sphere, o.leaf, [0.8, 0.75, 0.8], [-0.7, 1.95, -0.2]),
    ),
    appleTree: (o) => {
      const g = PROTOS.tree(o);
      [[0.6, 2.5, 0.9], [-0.5, 2.0, 0.95], [0.2, 1.6, 1.05], [1.1, 1.7, 0.6], [-0.9, 2.5, 0.5]]
        .forEach((p) => g.add(M(G.sphere, '#ff3b4f', [0.17, 0.17, 0.17], p)));
      return g;
    },
    pine: (o) => grp(
      M(G.cyl, '#5a3a4a', [0.2, 1, 0.2], [0, 0.5, 0]),
      M(G.cone, o.leaf, [1.1, 1.6, 1.1], [0, 1.6, 0]),
      M(G.cone, o.leaf, [0.85, 1.3, 0.85], [0, 2.4, 0]),
      M(G.cone, o.leaf, [0.55, 1, 0.55], [0, 3.1, 0]),
    ),
    flower: () => {
      const g = grp(
        M(G.cyl, '#4caf50', [0.04, 0.6, 0.04], [0, 0.3, 0]),
        M(G.sphere, '#ffd23f', [0.11, 0.08, 0.11], [0, 0.66, 0]),
      );
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        g.add(M(G.sphere, 'tint', [0.13, 0.06, 0.13], [Math.cos(a) * 0.17, 0.64, Math.sin(a) * 0.17]));
      }
      return g;
    },
    bow: (o) => grp(
      M(G.sphere, o.color, [0.62, 0.42, 0.22], [-0.5, 0, 0], [0, 0, 0.35]),
      M(G.sphere, o.color, [0.62, 0.42, 0.22], [0.5, 0, 0], [0, 0, -0.35]),
      M(G.sphere, o.dark || o.color, [0.24, 0.22, 0.2], [0, 0, 0.02]),
    ),
    heart: () => grp(M(G.heart, 'tint', [0.5, 0.5, 0.5])),
    star: () => grp(M(G.star, 'tint', [0.5, 0.5, 0.5])),
    apple: () => grp(
      M(G.sphere, '#ff3b4f', [0.5, 0.46, 0.5]),
      M(G.cyl, '#7a4a24', [0.04, 0.25, 0.04], [0, 0.5, 0]),
      M(G.sphere, '#5cc85c', [0.18, 0.05, 0.1], [0.14, 0.55, 0], [0, 0, 0.4]),
    ),
    strawberry: () => {
      const g = grp(
        M(G.sphere, '#ff4d6d', [0.55, 0.62, 0.55], [0, 0.6, 0]),
        M(G.cone, '#ff4d6d', [0.5, 0.5, 0.5], [0, 0.2, 0], [Math.PI, 0, 0]),
        M(G.cyl, '#3f9b3f', [0.04, 0.2, 0.04], [0, 1.3, 0]),
      );
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        g.add(M(G.sphere, '#4caf50', [0.22, 0.05, 0.1], [Math.cos(a) * 0.2, 1.17, Math.sin(a) * 0.2], [0, -a, 0.3]));
      }
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2, y = 0.45 + (i % 2) * 0.25;
        g.add(M(G.sphere, '#ffe066', [0.04, 0.04, 0.04], [Math.cos(a) * 0.52, y, Math.sin(a) * 0.52]));
      }
      return g;
    },
    mushroom: (o) => grp(
      M(G.cyl, '#fff6ee', [0.18, 0.6, 0.18], [0, 0.3, 0]),
      M(G.sphere, o.cap, [0.6, 0.38, 0.6], [0, 0.65, 0]),
      M(G.sphere, o.dots, [0.1, 0.06, 0.1], [0.25, 0.92, 0.15]),
      M(G.sphere, o.dots, [0.09, 0.05, 0.09], [-0.2, 0.9, -0.2]),
      M(G.sphere, o.dots, [0.08, 0.05, 0.08], [-0.1, 0.98, 0.25]),
    ),
    skull: () => grp(
      M(G.sphere, 'tint', [0.6, 0.55, 0.5]),
      M(G.box, 'tint', [0.55, 0.3, 0.4], [0, -0.42, 0.05]),
      M(G.sphere, '#2d2d3a', [0.13, 0.15, 0.08], [-0.2, 0.02, 0.45]),
      M(G.sphere, '#2d2d3a', [0.13, 0.15, 0.08], [0.2, 0.02, 0.45]),
    ),
    cinnaroll: () => grp(
      M(G.torus, '#e0a96d', [0.7, 0.7, 0.9], [0, 0, 0], [Math.PI / 2, 0, 0]),
      M(G.torus, '#fff7ef', [0.66, 0.66, 0.45], [0, 0.2, 0], [Math.PI / 2, 0, 0]),
    ),
    pudding: () => grp(
      M(G.taper, '#ffd84d', [0.8, 0.9, 0.8], [0, 0.45, 0]),
      M(G.cyl, '#9a5a24', [0.6, 0.16, 0.6], [0, 0.96, 0]),
      M(G.sphere, '#ffffff', [0.26, 0.2, 0.26], [0, 1.1, 0]),
      M(G.sphere, '#ff3355', [0.11, 0.11, 0.11], [0, 1.32, 0]),
    ),
    cookie: () => grp(
      M(G.disc, '#d79a5b', [0.55, 0.14, 0.55], [0, 0, 0], [Math.PI / 2, 0, 0]),
      M(G.sphere, '#5a3412', [0.08, 0.08, 0.05], [0.2, 0.15, 0.07]),
      M(G.sphere, '#5a3412', [0.08, 0.08, 0.05], [-0.18, -0.1, 0.07]),
      M(G.sphere, '#5a3412', [0.07, 0.07, 0.05], [0.05, -0.28, 0.07]),
    ),
    ball: () => grp(M(G.sphere, 'tint', [0.55, 0.55, 0.55], [0, 0.55, 0])),
    frog: () => grp(
      M(G.sphere, '#5cc85c', [0.6, 0.45, 0.55], [0, 0.4, 0]),
      M(G.sphere, '#ffffff', [0.2, 0.2, 0.2], [-0.25, 0.82, 0.15]),
      M(G.sphere, '#ffffff', [0.2, 0.2, 0.2], [0.25, 0.82, 0.15]),
      M(G.sphere, '#1f2a22', [0.08, 0.08, 0.08], [-0.25, 0.85, 0.33]),
      M(G.sphere, '#1f2a22', [0.08, 0.08, 0.08], [0.25, 0.85, 0.33]),
      M(G.sphere, '#ff7b7b', [0.09, 0.05, 0.05], [-0.36, 0.42, 0.42]),
      M(G.sphere, '#ff7b7b', [0.09, 0.05, 0.05], [0.36, 0.42, 0.42]),
    ),
    lilypad: () => grp(
      M(G.disc, '#3fae4f', [1, 0.06, 1]),
      M(G.sphere, '#ff9cc5', [0.18, 0.14, 0.18], [0.3, 0.12, 0.2]),
    ),
    drop: () => grp(
      M(G.sphere, '#7fd3ff', [0.4, 0.4, 0.4]),
      M(G.cone, '#7fd3ff', [0.34, 0.55, 0.34], [0, 0.42, 0]),
    ),
    house: (o) => grp(
      M(G.box, o.wall, [3, 2.4, 2.6], [0, 1.2, 0]),
      M(G.pyramid, o.roof, [2.6, 1.7, 2.6], [0, 3.25, 0], [0, Math.PI / 4, 0]),
      M(G.box, '#ffb35c', [0.7, 1.2, 0.1], [0, 0.6, 1.31]),
      M(G.box, '#bfe8ff', [0.6, 0.6, 0.1], [-0.95, 1.45, 1.31]),
      M(G.box, '#bfe8ff', [0.6, 0.6, 0.1], [0.95, 1.45, 1.31]),
      M(G.cyl, o.roof, [0.25, 1, 0.25], [0.8, 3.6, -0.3]),
    ),
    cloud: (o) => {
      const c = o.color || '#ffffff';
      return grp(
        M(G.sphere, c, [1, 0.8, 0.8]),
        M(G.sphere, c, [0.75, 0.6, 0.65], [0.9, -0.15, 0]),
        M(G.sphere, c, [0.7, 0.55, 0.6], [-0.9, -0.15, 0.05]),
        M(G.sphere, c, [0.6, 0.55, 0.55], [0.4, 0.45, -0.1]),
      );
    },
  };

  /* ---------- marcos: castelo e lojinha com placa ---------- */
  function signTex(text, ui) {
    const tex = canvasTex(512, (g) => {
      g.clearRect(0, 0, 512, 512);
      g.fillStyle = '#fff';
      g.strokeStyle = ui.primary;
      g.lineWidth = 16;
      g.beginPath();
      if (g.roundRect) g.roundRect(16, 160, 480, 192, 48);
      else g.rect(16, 160, 480, 192); // Safari antigo (iOS < 16)
      g.fill();
      g.stroke();
      g.fillStyle = ui['primary-2'];
      g.textAlign = 'center';
      g.textBaseline = 'middle';
      let fs = 76;
      do { g.font = `700 ${fs}px Fredoka, system-ui, sans-serif`; fs -= 4; } while (g.measureText(text).width > 420 && fs > 30);
      g.fillText(text, 256, 260);
    });
    disposables.push(tex);
    const m = new T.MeshBasicMaterial({ map: tex, transparent: true, toneMapped: false });
    disposables.push(m);
    return m;
  }

  function castle(c, ui) {
    const g = new T.Group();
    g.add(M(G.box, c.wall, [4.2, 3, 2.6], [0, 1.5, 0]));
    for (let i = -2; i <= 2; i++) g.add(M(G.box, c.wall, [0.5, 0.45, 0.5], [i * 0.9, 3.2, 1.05]));
    [-2.4, 2.4].forEach((x) => {
      g.add(M(G.cyl, c.wall, [0.85, 4.4, 0.85], [x, 2.2, 0.2]));
      g.add(M(G.cone, c.roof, [1.05, 1.9, 1.05], [x, 5.35, 0.2]));
      g.add(M(G.box, '', [0.36, 0.6, 0.05], [x, 3.1, 1.05], [0, 0, 0], glow('#fff1b8')));
      g.add(M(G.sphere, c.roof, [0.12, 0.12, 0.12], [x, 6.35, 0.2]));
    });
    g.add(M(G.cyl, c.wall, [0.95, 5.6, 0.95], [0, 2.8, -0.7]));
    g.add(M(G.cone, c.roof, [1.2, 2.3, 1.2], [0, 6.75, -0.7]));
    g.add(M(G.box, '', [0.4, 0.65, 0.05], [0, 4.6, 0.26], [0, 0, 0], glow('#fff1b8')));
    g.add(M(G.box, c.door, [1.1, 1.5, 0.12], [0, 0.75, 1.32]));
    g.add(M(G.cyl, c.door, [0.55, 0.12, 0.55], [0, 1.5, 1.32], [Math.PI / 2, 0, 0]));
    [-1.3, 1.3].forEach((x) => g.add(M(G.box, '', [0.45, 0.6, 0.05], [x, 1.6, 1.32], [0, 0, 0], glow('#fff1b8'))));
    if (c.sign) {
      const s = new T.Mesh(G.plane, signTex(c.sign, ui));
      s.scale.set(3.6, 3.6, 1);
      s.position.set(0, 2.6, 1.4);
      g.add(s);
    }
    return g;
  }

  function shop(c, ui) {
    const g = new T.Group();
    g.add(M(G.box, c.wall, [3.8, 2.6, 2.4], [0, 1.3, 0]));
    g.add(M(G.box, c.roof, [4.1, 0.35, 2.7], [0, 2.75, 0]));
    for (let i = 0; i < 7; i++) {
      g.add(M(G.box, i % 2 ? '#ffffff' : c.roof, [0.56, 0.06, 1], [-1.68 + i * 0.56, 2.15, 1.55], [0.42, 0, 0]));
    }
    g.add(M(G.box, '', [2.3, 0.9, 0.05], [-0.4, 1.35, 1.21], [0, 0, 0], glow('#fff1c9')));
    g.add(M(G.box, c.door, [0.75, 1.4, 0.08], [1.25, 0.7, 1.22]));
    if (c.sign) {
      const s = new T.Mesh(G.plane, signTex(c.sign, ui));
      s.scale.set(3.8, 3.8, 1);
      s.position.set(0, 3.15, 1.3);
      g.add(s);
    }
    return g;
  }

  /* ---------- InstancedMesh a partir de um protótipo ---------- */
  function instanced(proto, count, tints, rnd) {
    proto.updateMatrixWorld(true);
    const parts = [];
    proto.traverse((o) => {
      if (!o.isMesh) return;
      const im = new T.InstancedMesh(o.geometry, o.material, count);
      im.instanceMatrix.setUsage(T.DynamicDrawUsage);
      im.frustumCulled = false;
      if (o.name === 'tint') {
        const list = tints || ['#ffffff'];
        for (let i = 0; i < count; i++) im.setColorAt(i, tmpC.set(list[Math.floor(rnd() * list.length)]));
        im.instanceColor.needsUpdate = true;
      }
      root.add(im);
      parts.push({ im, local: o.matrixWorld.clone() });
    });
    return {
      set(i, m) { for (const p of parts) { tmpM.multiplyMatrices(m, p.local); p.im.setMatrixAt(i, tmpM); } },
      commit() { for (const p of parts) p.im.instanceMatrix.needsUpdate = true; },
    };
  }

  function rng(seed) {
    let a = seed >>> 0;
    return function () {
      a = (a + 0x6D2B79F5) >>> 0;
      let x = a;
      x = Math.imul(x ^ (x >>> 15), x | 1);
      x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
      return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
    };
  }
  const hash = (s) => { let h = 2166136261; for (const c of s) h = Math.imul(h ^ c.charCodeAt(0), 16777619); return h >>> 0; };

  /* ---------- posicionamento ---------- */
  const POND = { x: -9, z: -3, rx: 7, rz: 3.8 };
  // largura visível do chão a uma profundidade z (câmera em z=15)
  const spreadK = () => Math.min(0.8, Math.max(0.32, Math.tan((camera.fov * Math.PI) / 360) * camera.aspect));
  function placements(item, rnd, pond) {
    const R = (a, b) => a + rnd() * (b - a);
    const [smin, smax] = item.scale || [1.2, 2];
    const out = [];
    if (item.at) {
      item.at.forEach(([x, y, z, ry, s]) => out.push({ x, y, z, ry, s }));
      return out;
    }
    const k = spreadK();
    const spread = (z) => (15 - z) * k;
    const side = () => (rnd() < 0.5 ? -1 : 1);
    for (let i = 0; i < item.n; i++) {
      let d;
      switch (item.place) {
        case 'sides': {
          const z = R(-45, -2);
          d = { x: side() * spread(z) * R(0.45, 1), y: 0, z, s: R(1, 1.8) };
          break;
        }
        case 'float': {
          const z = R(-26, -2);
          d = { x: side() * spread(z) * R(0.35, 0.95), y: R(2, 10), z, s: R(0.6, 1.1), float: true };
          break;
        }
        case 'sky':
          d = { x: R(-90, 90), y: R(16, 30), z: R(-110, -45), s: R(2.5, 4.5), drift: R(0.4, 1.2) };
          break;
        case 'pond': {
          const a = R(0, Math.PI * 2), r = 0.25 + Math.sqrt(rnd()) * 0.7;
          d = { x: POND.x + Math.cos(a) * r * POND.rx, y: 0.08, z: POND.z + Math.sin(a) * r * POND.rz, s: R(0.6, 1.1) };
          break;
        }
        default: { // chão, com mais coisas perto da câmera
          const z = 2 - Math.pow(rnd(), 1.3) * 48;
          let x = R(-1, 1) * spread(z);
          if (Math.abs(x) < 6 && z > -10) x = Math.sign(x || 1) * R(6, Math.max(7, spread(z))); // não tampa a roleta
          if (pond && ((x - POND.x) / (POND.rx + 1.5)) ** 2 + ((z - POND.z) / (POND.rz + 1.5)) ** 2 < 1) x += POND.rx + 4;
          d = { x, y: 0, z, s: R(smin, smax) };
        }
      }
      out.push(d);
    }
    return out;
  }

  /* ---------- tema ---------- */
  function applyTheme(theme, first) {
    const tok = ++switchToken;
    if (first || !root) return build(theme);
    const fade = document.getElementById('world-fade');
    fade.classList.add('on');
    setTimeout(() => {
      if (tok !== switchToken) return;
      build(theme);
      requestAnimationFrame(() => fade.classList.remove('on'));
    }, 260);
  }

  function clear() {
    if (!root) return;
    scene.remove(root);
    root.traverse((o) => { if (o.isInstancedMesh) o.dispose(); });
    disposables.forEach((d) => d.dispose());
    mats.forEach((m) => m.dispose());
    mats.clear();
    disposables = [];
    props = [];
    extras = [];
    root = null;
  }

  function build(theme) {
    clear();
    currentTheme = theme;
    const w = theme.world;
    const light = w.light || 1;

    skyMat.uniforms.top.value.set(w.sky[0]);
    skyMat.uniforms.bottom.value.set(w.sky[1]);
    scene.fog.color.set(w.fog);
    groundMat.color.set(w.ground);
    hillsMat.color.set(w.hills);
    hemi.color.set('#ffffff');
    hemi.groundColor.set(w.ground);
    hemi.intensity = 0.75 * light;
    sun.intensity = 1.9 * light;

    if (envTex) envTex.dispose();
    // ambiente clarinho (só levemente tingido), pra que o branco do vinil continue branco
    envTex = makeEnv(renderer, pmrem, tmpC.set(w.sky[0]).lerp(new T.Color('#ffffff'), 0.6).getStyle(), '#ffffff');
    scene.environment = envTex;
    scene.environmentIntensity = light < 1 ? 0.55 : 0.65;

    root = new T.Group();
    scene.add(root);
    age = 0;
    const rnd = rng(hash(theme.id));

    for (const item of w.items) {
      const data = placements(item, rnd, item.place === 'ground' && w.pond);
      data.forEach((d, i) => {
        d.ry = d.ry != null ? d.ry : rnd() * Math.PI * 2;
        d.delay = Math.min(0.9, i * 0.025 + rnd() * 0.25);
        d.ph = rnd() * Math.PI * 2;
        d.sp = 0.6 + rnd() * 0.8;
        d.vr = (rnd() - 0.5) * 1.2;
      });
      const inst = instanced(PROTOS[item.p](item.o || {}), data.length, item.tints, rnd);
      props.push({ inst, data, done: false });
    }

    const k = spreadK();
    (w.landmarks || []).forEach((l) => {
      const g = (l.type === 'castle' ? castle : shop)(l, theme.ui);
      g.position.set(l.side * (15 - l.z) * k * l.f, 0, l.z);
      g.rotation.y = -l.side * 0.35;
      g.scale.setScalar(l.s || 1.5);
      root.add(g);
    });

    if (w.rainbow) addRainbow();
    if (w.moon) addMoon();
    if (w.stars) addStars(rnd);
    if (w.pond) addPond();
    addSparkles(w.sparkles, rnd);
    addBokeh(theme.confetti, rnd);

    setPedestal(theme);
    setFigure(theme.id);
  }

  function addRainbow() {
    const cols = ['#ff8fab', '#ffc46b', '#fff07a', '#9be89b', '#8fd3ff', '#c7a2ff'];
    const g = new T.Group();
    cols.forEach((c, i) => {
      const geo = new T.TorusGeometry(26 - i * 1.3, 0.7, 8, 64, Math.PI);
      const m = new T.MeshBasicMaterial({ color: c, transparent: true, opacity: 0.8 });
      disposables.push(geo, m);
      g.add(new T.Mesh(geo, m));
    });
    g.position.set(-10, -1, -85);
    root.add(g);
  }

  function addMoon() {
    const geo = new T.SphereGeometry(7, 32, 16);
    const m = new T.MeshBasicMaterial({ color: '#fff3c4', fog: false, toneMapped: false });
    const glowM = new T.SpriteMaterial({ map: spriteTex, color: '#ffc8f0', transparent: true, opacity: 0.55, fog: false, depthWrite: false });
    disposables.push(geo, m, glowM);
    const moon = new T.Mesh(geo, m);
    moon.position.set(38, 42, -150);
    const halo = new T.Sprite(glowM);
    halo.scale.set(40, 40, 1);
    halo.position.copy(moon.position);
    root.add(halo, moon);
  }

  function addStars(rnd) {
    const n = 450, pos = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      const a = rnd() * Math.PI * 2, y = 0.12 + rnd() * 0.88, r = Math.sqrt(1 - y * y);
      pos[i * 3] = Math.cos(a) * r * 300;
      pos[i * 3 + 1] = y * 300;
      pos[i * 3 + 2] = Math.sin(a) * r * 300;
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(pos, 3));
    const m = new T.PointsMaterial({ size: 3.2, map: spriteTex, transparent: true, depthWrite: false, fog: false, color: '#fff6d6' });
    disposables.push(geo, m);
    const pts = new T.Points(geo, m);
    root.add(pts);
    extras.push((tt) => { m.opacity = 0.75 + Math.sin(tt * 2.2) * 0.25; pts.rotation.y = tt * 0.004; });
  }

  function addPond() {
    const water = new T.MeshStandardMaterial({ color: '#7fd6ff', roughness: 0.08, metalness: 0.1 });
    const rim = new T.MeshStandardMaterial({ color: '#c9b48a', roughness: 0.9 });
    disposables.push(water, rim);
    const wMesh = new T.Mesh(G.disc, water);
    wMesh.scale.set(POND.rx, 0.06, POND.rz);
    wMesh.position.set(POND.x, 0.03, POND.z);
    const edge = new T.Mesh(G.disc, rim);
    edge.scale.set(POND.rx + 0.7, 0.04, POND.rz + 0.6);
    edge.position.set(POND.x, 0.01, POND.z);
    root.add(edge, wMesh);
  }

  function pointsCloud(n, map, size, colors, rnd, box, opacity) {
    const pos = new Float32Array(n * 3), col = new Float32Array(n * 3);
    for (let i = 0; i < n; i++) {
      pos[i * 3] = box[0] + rnd() * (box[1] - box[0]);
      pos[i * 3 + 1] = box[2] + rnd() * (box[3] - box[2]);
      pos[i * 3 + 2] = box[4] + rnd() * (box[5] - box[4]);
      tmpC.set(colors[i % colors.length]);
      col[i * 3] = tmpC.r; col[i * 3 + 1] = tmpC.g; col[i * 3 + 2] = tmpC.b;
    }
    const geo = new T.BufferGeometry();
    geo.setAttribute('position', new T.BufferAttribute(pos, 3));
    geo.setAttribute('color', new T.BufferAttribute(col, 3));
    const m = new T.PointsMaterial({ size, map, vertexColors: true, transparent: true, opacity, depthWrite: false });
    disposables.push(geo, m);
    const pts = new T.Points(geo, m);
    root.add(pts);
    return { pts, m };
  }

  function addSparkles(colors, rnd) {
    const { pts, m } = pointsCloud(150, spriteTex, 0.45, colors, rnd, [-30, 30, 0, 16, -36, 4], 1);
    extras.push((tt) => {
      pts.rotation.y = Math.sin(tt * 0.05) * 0.3;
      pts.position.y = Math.sin(tt * 0.4) * 0.6;
      m.opacity = 0.7 + Math.sin(tt * 3) * 0.3;
      m.size = 0.45 + celebrate * 0.5;
    });
  }

  /* "bokeh": corações e bolinhas desfocados no fundo, como uma foto com desfoque */
  function addBokeh(colors, rnd) {
    const a = pointsCloud(26, heartTex, 3.6, colors, rnd, [-45, 45, 4, 22, -55, -30], 0.45);
    const b = pointsCloud(30, spriteTex, 4.5, colors, rnd, [-50, 50, 2, 24, -60, -30], 0.3);
    extras.push((tt) => {
      a.pts.position.y = Math.sin(tt * 0.3) * 1.2;
      b.pts.position.y = Math.cos(tt * 0.25) * 1.2;
      a.pts.position.x = Math.sin(tt * 0.1) * 2;
    });
  }

  /* ---------- pedestal + bonequinha (presos à câmera, alinhados com o lugar dela na interface) ---------- */
  function buildRig() {
    rig = new T.Group();
    camera.add(rig);
    pedestal = new T.Group();
    const body = new T.Mesh(new T.CylinderGeometry(0.98, 1.06, 0.3, 6), new T.MeshStandardMaterial({ color: '#3b3552', roughness: 0.35, metalness: 0.45 }));
    body.position.y = 0.15;
    const top = new T.Mesh(new T.CylinderGeometry(0.96, 0.96, 0.02, 6), new T.MeshStandardMaterial({ color: '#4a4466', roughness: 0.25, metalness: 0.3 }));
    top.position.y = 0.3;
    neonTop = new T.Mesh(new T.CylinderGeometry(1.0, 1.0, 0.045, 6, 1, true), new T.MeshBasicMaterial({ color: '#ff5fd2', toneMapped: false }));
    neonTop.position.y = 0.28;
    neonBottom = new T.Mesh(new T.CylinderGeometry(1.075, 1.075, 0.045, 6, 1, true), new T.MeshBasicMaterial({ color: '#5ff3ff', toneMapped: false }));
    neonBottom.position.y = 0.03;
    const shadow = new T.Mesh(new T.PlaneGeometry(1.5, 1.1), new T.MeshBasicMaterial({ map: shadowTex, transparent: true, depthWrite: false }));
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.315;
    pedestal.add(body, top, neonTop, neonBottom, shadow);
    pedestal.rotation.y = Math.PI / 6;
    shadow.rotation.z = -Math.PI / 6;
    rig.add(pedestal);
    holder = new T.Group();
    holder.position.y = 0.31;
    rig.add(holder);
  }

  function setPedestal(theme) {
    neonTop.material.color.set(theme.ui.primary);
  }

  function wrapCustom(id) {
    const c = customs.get(id);
    const sceneClone = c.scene.clone(true);
    const root2 = new T.Group();
    const bodyG = new T.Group();
    bodyG.add(sceneClone);
    root2.add(bodyG);
    let mix = null;
    if (c.animations.length) {
      mix = new T.AnimationMixer(sceneClone);
      mix.clipAction(c.animations[0]).play();
    }
    return { root: root2, bodyG, custom: true, mixer: mix, dispose() { if (mix) mix.stopAllAction(); } };
  }

  function buildFigure(id) {
    return customs.has(id) ? wrapCustom(id) : window.Figures.build(T, id);
  }

  function setFigure(id) {
    if (figure) {
      holder.remove(figure.root);
      figure.dispose();
    }
    figure = buildFigure(id);
    mixer = figure.mixer || null;
    holder.add(figure.root);
    figureBorn = t;
    document.body.classList.add('has-3d');
  }

  function placeRig() {
    if (!slotEl) return;
    const r = slotEl.getBoundingClientRect();
    if (!r.width) { rig.visible = false; return; }
    rig.visible = true;
    const W = window.innerWidth, H = window.innerHeight;
    const d = 9;
    const halfH = d * Math.tan((camera.fov * Math.PI) / 360);
    const halfW = halfH * camera.aspect;
    const cx = ((r.left + r.width / 2) / W) * 2 - 1;
    const by = -(((r.bottom) / H) * 2 - 1);
    const h = (r.height / H) * 2 * halfH;
    rig.position.set(cx * halfW, by * halfH + h * 0.04, -d);
    const born = Math.min(1, (t - figureBorn) / 0.6);
    const pop = born < 1 ? 1 + (1.9 + 1) * Math.pow(born - 1, 3) + 1.9 * Math.pow(born - 1, 2) : 1;
    rig.scale.setScalar(Math.max(0.001, (h / 3.05) * pop));
    // olha na direção da câmera e vira um pouquinho pra roleta
    const toWheel = cx < -0.15 ? 0.32 : cx > 0.15 ? -0.32 : 0.12;
    rig.rotation.set(0.09, Math.atan2(cx * halfW, d) * 0.6 + toWheel, 0);
  }

  function animateFigure(dt) {
    if (!figure) return;
    const cls = slotEl ? slotEl.classList : { contains: () => false };
    const jumping = cls.contains('jump');
    if (jumping && !wasJump) jumpStart = t;
    wasJump = jumping;
    const j = jumpStart >= 0 ? (t - jumpStart) / 0.95 : -1;
    if (j > 1) jumpStart = -1;
    // olhar acompanha o mouse, relativo a onde a bonequinha está na tela
    let lx = 0, ly = 0;
    if (slotEl && pointer.cx != null) {
      const r = slotEl.getBoundingClientRect();
      lx = Math.max(-1, Math.min(1, (pointer.cx - (r.left + r.width / 2)) / 500));
      ly = Math.max(-1, Math.min(1, (pointer.cy - (r.top + r.height * 0.3)) / 400));
    }
    const st = {
      talking: cls.contains('talking'),
      waving: cls.contains('waving'),
      excited: cls.contains('excited'),
      jump: j > 1 ? -1 : j,
      look: { x: lx, y: ly },
    };
    if (figure.custom) {
      if (mixer) mixer.update(dt);
      const fast = st.excited ? 3 : 1;
      figure.bodyG.position.y = Math.abs(Math.sin(t * 2.2 * fast)) * 0.06 + (st.jump >= 0 ? Math.sin(Math.PI * st.jump) * 0.7 : 0);
      figure.bodyG.rotation.y = st.jump >= 0 ? st.jump * Math.PI * 2 : lx * 0.4 + Math.sin(t * 0.8) * 0.08;
    } else {
      window.Figures.animate(figure, t, dt, st);
    }
  }

  /* ---------- miniaturas (seletor, centro da roleta e resultado) ---------- */
  function makeThumbs(ids) {
    const cv = document.createElement('canvas');
    cv.width = cv.height = 256;
    let r2;
    try {
      r2 = new T.WebGLRenderer({ canvas: cv, alpha: true, antialias: true, preserveDrawingBuffer: true });
    } catch (e) { return; }
    r2.toneMapping = T.NeutralToneMapping;
    r2.setClearColor(0x000000, 0);
    const pm = new T.PMREMGenerator(r2);
    const env = makeEnv(r2, pm, '#ffffff', '#ffe6f0');
    const sc = new T.Scene();
    sc.environment = env;
    sc.add(new T.HemisphereLight(0xffffff, 0xffe0ea, 1.2));
    const dl = new T.DirectionalLight(0xffffff, 2.2);
    dl.position.set(3, 6, 8);
    sc.add(dl);
    const cam = new T.PerspectiveCamera(30, 1, 0.1, 50);
    const queue = ids.slice();
    const step = () => {
      const id = queue.shift();
      if (!id) {
        env.dispose(); pm.dispose(); r2.dispose(); r2.forceContextLoss();
        return;
      }
      const f = buildFigure(id);
      if (f.mixer) f.mixer.update(0);
      f.root.rotation.y = 0.25;
      sc.add(f.root);
      cam.position.set(0.25, 1.6, 4.6);
      cam.lookAt(0, 1.5, 0);
      r2.render(sc, cam);
      const head = cv.toDataURL('image/png');
      cam.position.set(0.5, 1.35, 7.6);
      cam.lookAt(0, 1.15, 0);
      r2.render(sc, cam);
      const full = cv.toDataURL('image/png');
      sc.remove(f.root);
      f.dispose();
      const v = { head, full };
      thumbs.set(id, v);
      if (thumbCb) thumbCb(id, v);
      setTimeout(step, 30);
    };
    step();
  }

  /* ---------- modelos .glb próprios ---------- */
  let gltfLoader = null;
  async function loader() {
    if (gltfLoader) return gltfLoader;
    const [{ GLTFLoader }, { DRACOLoader }] = await Promise.all([
      import('three/addons/loaders/GLTFLoader.js'),
      import('three/addons/loaders/DRACOLoader.js'),
    ]);
    gltfLoader = new GLTFLoader();
    const draco = new DRACOLoader();
    draco.setDecoderPath('https://www.gstatic.com/draco/versioned/decoders/1.5.7/');
    gltfLoader.setDRACOLoader(draco);
    return gltfLoader;
  }

  World.setCustomModel = async function (id, buffer) {
    const l = await loader();
    const gltf = await l.parseAsync(buffer, '');
    const s = gltf.scene;
    // normaliza: 2.3 de altura, centralizado, pés no chão
    const box = new T.Box3().setFromObject(s);
    const size = box.getSize(new T.Vector3());
    const k = 2.3 / (size.y || 1);
    s.scale.multiplyScalar(k);
    box.setFromObject(s);
    const c = box.getCenter(new T.Vector3());
    s.position.x -= c.x;
    s.position.z -= c.z;
    s.position.y -= box.min.y;
    customs.set(id, { scene: s, animations: gltf.animations || [] });
    if (currentTheme && currentTheme.id === id) setFigure(id);
    makeThumbs([id]);
  };

  World.clearCustomModel = function (id) {
    if (!customs.delete(id)) return;
    if (currentTheme && currentTheme.id === id) setFigure(id);
    makeThumbs([id]);
  };
  World.hasCustomModel = (id) => customs.has(id);

  /* ---------- animação ---------- */
  const clamp01 = (x) => (x < 0 ? 0 : x > 1 ? 1 : x);
  const backOut = (x) => { const c = 1.9; return 1 + (c + 1) * Math.pow(x - 1, 3) + c * Math.pow(x - 1, 2); };

  function updateProps(dt) {
    const motion = reduce ? 0.3 : 1;
    for (const p of props) {
      if (p.done) continue;
      let growing = false;
      for (let i = 0; i < p.data.length; i++) {
        const d = p.data[i];
        let g = (age - d.delay) / 0.55;
        if (g < 1) growing = true;
        g = Math.max(0.0001, backOut(clamp01(g)));
        let y = d.y, ry = d.ry, rx = 0, x = d.x;
        if (d.float) {
          y += Math.sin(t * d.sp + d.ph) * 0.5 * motion * (1 + celebrate * 2.5);
          d.ry += dt * d.vr * motion * (1 + excited * 3 + celebrate * 8);
          ry = d.ry;
          rx = Math.sin(t * d.sp * 0.7 + d.ph) * 0.15;
        } else if (d.drift) {
          d.x += dt * d.drift * motion;
          if (d.x > 100) d.x = -100;
          x = d.x;
        }
        dummy.position.set(x, y, d.z);
        dummy.rotation.set(rx, ry, 0);
        dummy.scale.setScalar(d.s * g);
        dummy.updateMatrix();
        p.inst.set(i, dummy.matrix);
      }
      p.inst.commit();
      // objetos parados só precisam ser atualizados enquanto "brotam"
      if (!growing && !p.data[0].float && !p.data[0].drift) p.done = true;
    }
  }

  function loop(now) {
    requestAnimationFrame(loop);
    const raw = now - last;
    if (raw < 15) return; // limita a ~60fps em telas 120Hz
    last = now;
    const dt = Math.min(0.05, raw / 1000);
    t += dt;
    age += Math.min(0.25, raw / 1000);
    celebrate = Math.max(0, celebrate - dt * 0.33);

    // qualidade adaptativa: se estiver lento, reduz a resolução
    if (raw < 250) {
      frames++;
      if (raw > 24) slow++;
      if (frames >= 120) {
        if (slow > 45 && pr > 0.6) {
          pr = Math.max(0.6, pr - 0.25);
          renderer.setPixelRatio(pr);
          resize();
        }
        frames = 0;
        slow = 0;
      }
    }

    cam.x += (pointer.x * 1.4 - cam.x) * Math.min(1, dt * 2);
    cam.y += (-pointer.y * 0.6 - cam.y) * Math.min(1, dt * 2);
    const sway = reduce ? 0 : Math.sin(t * 0.25) * 0.4;
    camera.position.set(cam.x + sway, 4 + cam.y, 15);
    camera.lookAt(0, 3.4, -6);

    // neon pulsando (mais forte girando/comemorando)
    const pulse = 1.1 + Math.sin(t * (excited ? 12 : 3)) * 0.35 + celebrate * 1.2;
    neonTop.material.color.set(currentTheme ? currentTheme.ui.primary : '#ff5fd2').multiplyScalar(pulse);
    neonBottom.material.color.set('#5ff3ff').multiplyScalar(2.2 - pulse * 0.6);

    placeRig();
    animateFigure(dt);
    updateProps(dt);
    for (const fn of extras) fn(t);
    renderer.render(scene, camera);
  }
})();
