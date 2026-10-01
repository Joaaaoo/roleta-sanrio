/* Bonequinhas 3D estilo vinil, esculpidas com geometria (sem arquivos externos).
   Cada figura: pés em y=0, de frente pra +z, ~2.3 de altura.
   Partes nomeadas (head, armL, armR, ears) pra animação. */
(function () {
  'use strict';

  const Figures = {};
  let T, G;

  function setup(THREE) {
    if (T) return;
    T = THREE;
    G = {
      sphere: new T.SphereGeometry(1, 48, 32),
      cone: new T.ConeGeometry(1, 1, 32),
      cyl: new T.CylinderGeometry(1, 1, 1, 32),
    };
  }

  /* ---------- kit de escultura ---------- */
  function kit() {
    const owned = [];
    const cache = new Map();
    const capsules = new Map();

    const vinyl = (color, o = {}) => {
      const key = color + '|' + JSON.stringify(o);
      if (!cache.has(key)) {
        const m = new T.MeshPhysicalMaterial({
          color,
          roughness: o.r ?? 0.36,
          metalness: 0,
          clearcoat: o.cc ?? 0.65,
          clearcoatRoughness: o.ccr ?? 0.28,
        });
        cache.set(key, m);
        owned.push(m);
      }
      return cache.get(key);
    };
    const gloss = (color) => vinyl(color, { r: 0.12, cc: 1, ccr: 0.05 });

    const capsule = (r, len) => {
      const key = r + '_' + len;
      if (!capsules.has(key)) {
        const g = new T.CapsuleGeometry(r, len, 10, 24);
        capsules.set(key, g);
        owned.push(g);
      }
      return capsules.get(key);
    };

    function mesh(geo, mat, s = [1, 1, 1], p = [0, 0, 0], r = [0, 0, 0]) {
      const m = new T.Mesh(geo, mat);
      m.scale.set(s[0], s[1], s[2]);
      m.position.set(p[0], p[1], p[2]);
      m.rotation.set(r[0], r[1], r[2]);
      return m;
    }
    const ell = (mat, rx, ry, rz, p, r) => mesh(G.sphere, mat, [rx, ry, rz], p, r);
    const group = (p = [0, 0, 0], r = [0, 0, 0], ...kids) => {
      const g = new T.Group();
      g.position.set(p[0], p[1], p[2]);
      g.rotation.set(r[0], r[1], r[2]);
      kids.forEach((k) => g.add(k));
      return g;
    };

    /* ponto na superfície frontal de um elipsoide (u,v em -1..1) + orientação da normal */
    const Z = new T.Vector3(0, 0, 1);
    function surf(H, u, v, lift = 0) {
      const x = u * H.a, y = v * H.b;
      const z = H.c * Math.sqrt(Math.max(0.0001, 1 - u * u - v * v));
      const n = new T.Vector3(x / (H.a * H.a), y / (H.b * H.b), z / (H.c * H.c)).normalize();
      const p = new T.Vector3(x, y, z).addScaledVector(n, lift);
      return { p, q: new T.Quaternion().setFromUnitVectors(Z, n), n };
    }
    function decal(obj, H, u, v, lift = 0) {
      const s = surf(H, u, v, lift);
      obj.position.copy(s.p);
      obj.quaternion.copy(s.q);
      return obj;
    }
    function tube(points, radius, mat) {
      const curve = new T.CatmullRomCurve3(points);
      const g = new T.TubeGeometry(curve, 32, radius, 10, false);
      owned.push(g);
      const grp = new T.Group();
      grp.add(new T.Mesh(g, mat));
      [points[0], points[points.length - 1]].forEach((p) => {
        const cap = ell(mat, radius, radius, radius);
        cap.position.copy(p);
        grp.add(cap);
      });
      return grp;
    }
    /* sorriso desenhado na superfície do rosto */
    function smile(H, w, v0, depth, radius, mat) {
      const pts = [];
      for (let i = 0; i <= 12; i++) {
        const t = i / 6 - 1;
        pts.push(surf(H, t * w, v0 - depth * (1 - t * t), 0.004).p);
      }
      return tube(pts, radius, mat);
    }
    /* bigode: cápsula saindo da bochecha */
    function whisker(H, side, v, slope, mat) {
      const base = surf(H, side * 0.8, v).p;
      const dir = new T.Vector3(side, slope, 0.22).normalize();
      const w = new T.Mesh(capsule(0.017, 0.36), mat);
      w.quaternion.setFromUnitVectors(new T.Vector3(0, 1, 0), dir);
      w.position.copy(base).addScaledVector(dir, 0.16);
      return w;
    }
    function eye(H, u, v, rx, ry, color = '#1b1b22', shine = true) {
      const g = new T.Group();
      g.add(ell(gloss(color), rx, ry, rx * 0.6));
      if (shine) g.add(ell(gloss('#ffffff'), rx * 0.32, rx * 0.32, rx * 0.2, [rx * 0.3, ry * 0.4, rx * 0.45]));
      return decal(g, H, u, v, -0.012);
    }
    const blush = (H, u, v, color = '#ffb3c7') => decal(ell(vinyl(color, { r: 0.6, cc: 0.2 }), 0.12, 0.065, 0.02), H, u, v, 0.002);

    /* corpo, pernas e braços (braços com pivô no ombro) */
    function body(root, o) {
      const skin = vinyl(o.skin);
      const out = vinyl(o.outfit);
      if (o.dress) {
        const pts = [[0, 0.2], [0.4, 0.2], [0.47, 0.26], [0.44, 0.44], [0.36, 0.63], [0.27, 0.8], [0.17, 0.92], [0, 0.95]]
          .map(([x, y]) => new T.Vector2(x, y));
        const g = new T.LatheGeometry(pts, 48);
        owned.push(g);
        root.add(new T.Mesh(g, out));
      } else {
        root.add(ell(out, 0.44, 0.42, 0.39, [0, 0.52, 0]));
      }
      const legs = vinyl(o.legs || o.skin);
      [-1, 1].forEach((s) => {
        root.add(mesh(capsule(0.13, 0.1), legs, [1, 1, 1], [s * 0.17, 0.2, 0.02]));
        root.add(ell(legs, 0.15, 0.1, 0.19, [s * 0.17, 0.08, 0.06]));
      });
      const arms = {};
      [-1, 1].forEach((s) => {
        const pivot = group([s * 0.36, 0.78, 0.02], [-0.15, 0, s * 0.55]);
        pivot.add(mesh(capsule(0.095, 0.2), vinyl(o.arms || o.skin), [1, 1, 1], [0, -0.17, 0]));
        pivot.add(ell(vinyl(o.hands || o.arms || o.skin), 0.12, 0.12, 0.12, [0, -0.32, 0]));
        root.add(pivot);
        arms[s < 0 ? 'armL' : 'armR'] = pivot;
      });
      return arms;
    }

    return { owned, vinyl, gloss, capsule, mesh, ell, group, surf, decal, tube, smile, whisker, eye, blush, body };
  }

  /* ---------- personagens ---------- */
  const W = '#fffdf8', BLK = '#1d1d24', YEL = '#ffc61a';

  const BUILD = {
    hellokitty(k, f) {
      Object.assign(f, k.body(f.bodyG, { skin: W, outfit: '#e8243f', dress: true }));
      const H = { a: 0.98, b: 0.74, c: 0.74 };
      const head = f.head;
      head.add(k.ell(k.vinyl(W), H.a, H.b, H.c));
      head.add(k.ell(k.vinyl(W), 0.3, 0.38, 0.22, [-0.62, 0.56, -0.06], [0, 0, 0.48]));
      head.add(k.ell(k.vinyl(W), 0.3, 0.38, 0.22, [0.62, 0.56, -0.06], [0, 0, -0.48]));
      const red = k.vinyl('#ff1f4b');
      head.add(k.group([0.58, 0.72, 0.22], [0.1, 0.25, -0.4],
        k.ell(red, 0.31, 0.22, 0.15, [-0.27, 0, 0], [0, 0, 0.3]),
        k.ell(red, 0.31, 0.22, 0.15, [0.27, 0, 0], [0, 0, -0.3]),
        k.ell(red, 0.13, 0.12, 0.13, [0, 0, 0.06]),
      ));
      head.add(k.eye(H, -0.4, -0.04, 0.075, 0.105, BLK, false), k.eye(H, 0.4, -0.04, 0.075, 0.105, BLK, false));
      head.add(k.decal(k.ell(k.vinyl(YEL), 0.085, 0.06, 0.055), H, 0, -0.2, -0.006));
      const wm = k.vinyl(BLK, { r: 0.4, cc: 0.3 });
      [-1, 1].forEach((s) => [0.22, 0, -0.22].forEach((sl, i) => head.add(k.whisker(H, s, -0.02 - i * 0.14, sl, wm))));
    },

    mymelody(k, f) {
      const P = '#ff9cc4';
      Object.assign(f, k.body(f.bodyG, { skin: W, outfit: P, dress: true }));
      const head = f.head;
      head.add(k.ell(k.vinyl(P), 0.95, 0.86, 0.8, [0, 0.06, -0.16]));
      const face = k.group([0, -0.07, 0.03]);
      const H = { a: 0.78, b: 0.63, c: 0.72 };
      face.add(k.ell(k.vinyl(W), H.a, H.b, H.c));
      face.add(k.eye(H, -0.34, -0.02, 0.062, 0.085), k.eye(H, 0.34, -0.02, 0.062, 0.085));
      face.add(k.decal(k.ell(k.vinyl(YEL), 0.07, 0.05, 0.045), H, 0, -0.2, -0.005));
      face.add(k.blush(H, -0.56, -0.3), k.blush(H, 0.56, -0.3));
      face.add(k.smile(H, 0.08, -0.34, 0.05, 0.014, k.vinyl('#4a2a3a')));
      head.add(face);
      f.ears = [-1, 1].map((s) => {
        const e = k.group([s * 0.36, 0.7, -0.14], [0, 0, -s * 0.2],
          k.ell(k.vinyl(P), 0.2, 0.6, 0.14, [0, 0.48, 0]),
          k.ell(k.vinyl('#ffd3e4', { r: 0.55, cc: 0.2 }), 0.11, 0.42, 0.05, [0, 0.46, 0.11]));
        head.add(e);
        return e;
      });
      const flower = k.group([-0.5, 0.56, 0.42], [0.2, -0.3, 0.2]);
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2;
        flower.add(k.ell(k.vinyl('#ff4f8b'), 0.1, 0.1, 0.06, [Math.cos(a) * 0.11, Math.sin(a) * 0.11, 0]));
      }
      flower.add(k.ell(k.vinyl(YEL), 0.065, 0.065, 0.06, [0, 0, 0.04]));
      head.add(flower);
      head.add(k.ell(k.vinyl(P), 0.13, 0.1, 0.1, [0, -0.66, 0.44]));
    },

    kuromi(k, f) {
      const B = '#2a2833', PINK = '#ff7eb6';
      Object.assign(f, k.body(f.bodyG, { skin: W, outfit: B, dress: true, arms: B, legs: B }));
      const head = f.head;
      const HH = { a: 0.96, b: 0.86, c: 0.82 };
      const hood = k.group([0, 0.04, -0.14], [0, 0, 0], k.ell(k.vinyl(B), HH.a, HH.b, HH.c));
      const skull = k.group([0, 0, 0], [0, 0, 0],
        k.ell(k.vinyl(PINK), 0.16, 0.14, 0.07),
        k.ell(k.vinyl(PINK), 0.09, 0.06, 0.05, [0, -0.11, 0.01]),
        k.ell(k.gloss(B), 0.04, 0.045, 0.02, [-0.055, 0.0, 0.06]),
        k.ell(k.gloss(B), 0.04, 0.045, 0.02, [0.055, 0.0, 0.06]));
      hood.add(k.decal(skull, HH, 0, 0.6, 0.01));
      head.add(hood);
      f.ears = [-1, 1].map((s) => {
        const e = k.group([s * 0.5, 0.55, -0.16], [0, 0, -s * 0.62],
          k.ell(k.vinyl(B), 0.36, 0.3, 0.28, [0, 0.12, 0]),
          k.mesh(G.cone, k.vinyl(B), [0.33, 0.78, 0.26], [0, 0.55, 0]),
          k.ell(k.vinyl(B), 0.12, 0.12, 0.11, [s * 0.06, 0.92, 0.02]));
        head.add(e);
        return e;
      });
      const face = k.group([0, -0.1, 0.06]);
      const H = { a: 0.76, b: 0.6, c: 0.7 };
      face.add(k.ell(k.vinyl(W), H.a, H.b, H.c));
      face.add(k.eye(H, -0.34, 0.0, 0.07, 0.095), k.eye(H, 0.34, 0.0, 0.07, 0.095));
      face.add(k.decal(k.ell(k.vinyl('#ff9cc8'), 0.06, 0.042, 0.04), H, 0, -0.17, -0.005));
      face.add(k.blush(H, -0.56, -0.28, '#ffc2dc'), k.blush(H, 0.56, -0.28, '#ffc2dc'));
      face.add(k.smile(H, 0.16, -0.3, 0.1, 0.016, k.vinyl(BLK)));
      const fang = k.mesh(G.cone, k.vinyl(W), [0.025, 0.06, 0.02], [0, 0, 0], [Math.PI, 0, 0]);
      face.add(k.decal(k.group([0, 0, 0], [0, 0, 0], k.group([0, -0.03, 0.01], [0, 0, 0], fang)), H, 0.06, -0.42, 0.012));
      head.add(face);
      const tail = k.tube([new T.Vector3(0, 0.45, -0.3), new T.Vector3(0.1, 0.4, -0.6), new T.Vector3(0.3, 0.6, -0.75), new T.Vector3(0.38, 0.85, -0.7)], 0.05, k.vinyl(B));
      tail.add(k.mesh(G.cone, k.vinyl(B), [0.11, 0.2, 0.06], [0.4, 0.95, -0.69], [0, 0, -0.2]));
      f.bodyG.add(tail);
    },

    cinnamoroll(k, f) {
      const C = '#fbfcff';
      Object.assign(f, k.body(f.bodyG, { skin: C, outfit: C }));
      const head = f.head;
      const H = { a: 0.86, b: 0.72, c: 0.72 };
      head.add(k.ell(k.vinyl(C), H.a, H.b, H.c));
      f.ears = [-1, 1].map((s) => {
        const e = k.group([s * 0.5, 0.48, 0.02], [0, 0, s * 1.15],
          k.ell(k.vinyl(C), 0.27, 0.64, 0.11, [0, -0.56, 0]));
        head.add(e);
        return e;
      });
      f.earRest = 1.15;
      head.add(k.eye(H, -0.38, -0.04, 0.085, 0.11, '#3d7fd1'), k.eye(H, 0.38, -0.04, 0.085, 0.11, '#3d7fd1'));
      head.add(k.blush(H, -0.58, -0.3, '#ffc2d6'), k.blush(H, 0.58, -0.3, '#ffc2d6'));
      head.add(k.smile(H, 0.08, -0.3, 0.05, 0.014, k.vinyl('#5b7c99')));
      const curl = new T.Mesh(new T.TorusGeometry(0.13, 0.06, 16, 32), k.vinyl(C));
      k.owned.push(curl.geometry);
      curl.position.set(0, 0.55, -0.42);
      f.bodyG.add(curl);
      const top = new T.Mesh(new T.TorusGeometry(0.07, 0.03, 12, 24, Math.PI * 1.5), k.vinyl(C));
      k.owned.push(top.geometry);
      top.position.set(0.05, 0.74, 0.1);
      top.rotation.set(-0.4, 0, 0.5);
      head.add(top);
    },

    pompompurin(k, f) {
      const Y = '#ffd25a', BR = '#8a5426';
      Object.assign(f, k.body(f.bodyG, { skin: Y, outfit: Y }));
      const head = f.head;
      const H = { a: 0.92, b: 0.72, c: 0.74 };
      head.add(k.ell(k.vinyl(Y), H.a, H.b, H.c));
      head.add(k.ell(k.vinyl(BR), 0.5, 0.15, 0.46, [0.04, 0.68, -0.02], [0, 0, -0.12]));
      head.add(k.mesh(G.cyl, k.vinyl(BR), [0.04, 0.14, 0.04], [0.06, 0.84, 0], [0, 0, -0.12]));
      f.ears = [-1, 1].map((s) => {
        const e = k.group([s * 0.84, 0.22, -0.04], [0, 0, -s * 0.12], k.ell(k.vinyl(BR), 0.2, 0.42, 0.12, [0, -0.3, 0]));
        head.add(e);
        return e;
      });
      head.add(k.eye(H, -0.36, -0.02, 0.06, 0.08), k.eye(H, 0.36, -0.02, 0.06, 0.08));
      head.add(k.decal(k.ell(k.vinyl('#5a3412'), 0.08, 0.055, 0.05), H, 0, -0.16, -0.005));
      head.add(k.blush(H, -0.58, -0.28, '#ffb37a'), k.blush(H, 0.58, -0.28, '#ffb37a'));
      head.add(k.smile(H, 0.09, -0.3, 0.05, 0.015, k.vinyl('#5a3412')));
    },

    pochacco(k, f) {
      Object.assign(f, k.body(f.bodyG, { skin: W, outfit: W }));
      const head = f.head;
      const H = { a: 0.84, b: 0.72, c: 0.72 };
      head.add(k.ell(k.vinyl(W), H.a, H.b, H.c));
      f.ears = [-1, 1].map((s) => {
        const e = k.group([s * 0.5, 0.5, 0.08], [0, 0, s * 0.4], k.ell(k.vinyl('#222228'), 0.25, 0.5, 0.12, [0, -0.42, 0]));
        head.add(e);
        return e;
      });
      f.earRest = 0.4;
      head.add(k.eye(H, -0.3, -0.02, 0.06, 0.085), k.eye(H, 0.3, -0.02, 0.06, 0.085));
      head.add(k.decal(k.ell(k.gloss('#222228'), 0.09, 0.06, 0.06), H, 0, -0.14, -0.005));
      head.add(k.blush(H, -0.52, -0.28, '#ffc2c2'), k.blush(H, 0.52, -0.28, '#ffc2c2'));
      head.add(k.smile(H, 0.09, -0.29, 0.05, 0.015, k.vinyl(BLK)));
    },

    keroppi(k, f) {
      const GR = '#5cc860';
      Object.assign(f, k.body(f.bodyG, { skin: GR, outfit: GR }));
      const head = f.head;
      const H = { a: 0.98, b: 0.62, c: 0.72 };
      head.add(k.ell(k.vinyl(GR), H.a, H.b, H.c));
      [-1, 1].forEach((s) => {
        head.add(k.ell(k.vinyl(W), 0.31, 0.31, 0.29, [s * 0.36, 0.5, 0.12]));
        head.add(k.ell(k.gloss(BLK), 0.12, 0.12, 0.07, [s * 0.34, 0.53, 0.39]));
        head.add(k.ell(k.gloss('#ffffff'), 0.035, 0.035, 0.02, [s * 0.34 + 0.04, 0.58, 0.45]));
      });
      head.add(k.decal(k.ell(k.vinyl('#ff6b6b', { r: 0.5, cc: 0.3 }), 0.15, 0.09, 0.02), H, -0.68, -0.24, 0.002));
      head.add(k.decal(k.ell(k.vinyl('#ff6b6b', { r: 0.5, cc: 0.3 }), 0.15, 0.09, 0.02), H, 0.68, -0.24, 0.002));
      head.add(k.smile(H, 0.42, -0.14, 0.2, 0.022, k.vinyl('#1f4a2a')));
    },
  };

  /* ---------- API ---------- */
  Figures.build = function (THREE, id) {
    setup(THREE);
    const k = kit();
    const root = new T.Group();
    const bodyG = new T.Group();
    const head = new T.Group();
    head.position.set(0, 1.42, 0);
    bodyG.add(head);
    root.add(bodyG);
    const f = { root, bodyG, head, ears: null, earRest: null };
    (BUILD[id] || BUILD.hellokitty)(k, f);
    root.traverse((o) => { if (o.isMesh) o.castShadow = false; });
    f.dispose = () => k.owned.forEach((x) => x.dispose());
    f.restL = f.armL.rotation.z;
    f.restR = f.armR.rotation.z;
    return f;
  };

  /* animação procedural; st = { talking, waving, excited, jump(0..1 ou -1), look:{x,y} } */
  Figures.animate = function (f, t, dt, st) {
    const lerp = (a, b, k) => a + (b - a) * Math.min(1, k * dt);
    const fast = st.excited ? 3.2 : 1;
    let y = Math.abs(Math.sin(t * 2.2 * fast)) * (st.excited ? 0.09 : 0.035);
    let spin = 0, squash = 1;
    if (st.jump >= 0) {
      const j = st.jump;
      y += Math.sin(Math.PI * Math.min(1, j / 0.75)) * 0.7;
      spin = j < 0.75 ? (1 - Math.pow(1 - j / 0.75, 3)) * Math.PI * 2 : 0;
      if (j > 0.75) squash = 1 - Math.sin(Math.PI * (j - 0.75) / 0.25) * 0.12;
    }
    f.bodyG.position.y = y;
    f.bodyG.rotation.y = spin;
    f.bodyG.scale.set(1 + (1 - squash) * 0.6, squash, 1 + (1 - squash) * 0.6);
    f.bodyG.rotation.z = Math.sin(t * 1.1) * 0.03;

    const h = f.head;
    h.rotation.y = lerp(h.rotation.y, st.look.x * 0.45, 4);
    h.rotation.x = lerp(h.rotation.x, -st.look.y * 0.18 + (st.talking ? Math.sin(t * 16) * 0.04 : 0), 6);
    h.rotation.z = Math.sin(t * 1.4) * 0.05;

    let tR = f.restR + Math.sin(t * 2) * 0.05;
    let tL = f.restL - Math.sin(t * 2) * 0.05;
    if (st.waving) tR = 2.5 + Math.sin(t * 11) * 0.35;
    if (st.excited) { tR = 2.2 + Math.sin(t * 14) * 0.3; tL = -2.2 - Math.sin(t * 14 + 1) * 0.3; }
    if (st.jump >= 0) { tR = 2.6; tL = -2.6; }
    f.armR.rotation.z = lerp(f.armR.rotation.z, tR, 10);
    f.armL.rotation.z = lerp(f.armL.rotation.z, tL, 10);

    if (f.ears) {
      const flap = Math.sin(t * (st.excited ? 18 : 2.4)) * (st.excited ? 0.25 : 0.06);
      f.ears.forEach((e, i) => {
        const s = i === 0 ? -1 : 1;
        if (f.earRest != null) e.rotation.z = s * (f.earRest + flap);
        else e.rotation.x = flap * 0.6;
      });
    }
  };

  window.Figures = Figures;
})();
