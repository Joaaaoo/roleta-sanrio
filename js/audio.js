/* Sons e música 100% sintetizados com Web Audio (nenhum arquivo para baixar). */
(function () {
  'use strict';

  const Sound = {};
  let ctx = null, master, musicBus, sfxBus, noiseBuf;
  let musicOn = true, sfxOn = true;
  let song = null, step = 0, nextTime = 0, timer = null;
  let lastTick = 0;

  const mtof = (m) => 440 * Math.pow(2, (m - 69) / 12);
  const rand = (a, b) => a + Math.random() * (b - a);

  function ensure() {
    if (!ctx) {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return null;
      ctx = new AC();

      const comp = ctx.createDynamicsCompressor();
      comp.threshold.value = -16;
      comp.ratio.value = 4;
      comp.connect(ctx.destination);
      master = ctx.createGain();
      master.gain.value = 0.9;
      master.connect(comp);

      sfxBus = ctx.createGain();
      sfxBus.gain.value = sfxOn ? 0.55 : 0;
      sfxBus.connect(master);

      musicBus = ctx.createGain();
      musicBus.gain.value = musicOn ? 0.2 : 0;
      musicBus.connect(master);

      // eco suave na música
      const delay = ctx.createDelay(1);
      delay.delayTime.value = 0.3;
      const fb = ctx.createGain();
      fb.gain.value = 0.28;
      const lp = ctx.createBiquadFilter();
      lp.type = 'lowpass';
      lp.frequency.value = 2400;
      const wet = ctx.createGain();
      wet.gain.value = 0.3;
      musicBus.connect(delay);
      delay.connect(lp);
      lp.connect(fb);
      fb.connect(delay);
      lp.connect(wet);
      wet.connect(master);

      noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const d = noiseBuf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;

      // pausa o áudio quando a aba está escondida (economiza CPU/bateria)
      document.addEventListener('visibilitychange', () => {
        if (document.hidden) ctx.suspend();
        else ctx.resume().then(() => { nextTime = Math.max(nextTime, ctx.currentTime + 0.05); });
      });
    }
    if (ctx.state === 'suspended' && !document.hidden) ctx.resume();
    return ctx;
  }

  function osc(type, freq, t, dur, vol, dest, opts = {}) {
    const o = ctx.createOscillator();
    const g = ctx.createGain();
    o.type = type;
    o.frequency.setValueAtTime(freq, t);
    if (opts.slide) o.frequency.exponentialRampToValueAtTime(opts.slide, t + (opts.slideDur || dur));
    if (opts.detune) o.detune.value = opts.detune;
    const a = opts.attack || 0.004;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + a);
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    o.connect(g);
    if (opts.filter) {
      const f = ctx.createBiquadFilter();
      f.type = 'lowpass';
      f.frequency.value = opts.filter;
      g.connect(f);
      f.connect(dest);
    } else {
      g.connect(dest);
    }
    o.start(t);
    o.stop(t + dur + 0.03);
  }

  function noise(t, dur, vol, dest, opts = {}) {
    const s = ctx.createBufferSource();
    s.buffer = noiseBuf;
    const f = ctx.createBiquadFilter();
    f.type = opts.type || 'bandpass';
    f.frequency.setValueAtTime(opts.freq || 2000, t);
    if (opts.freqTo) f.frequency.exponentialRampToValueAtTime(opts.freqTo, t + dur);
    f.Q.value = opts.q || 1;
    const g = ctx.createGain();
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(vol, t + Math.min(opts.attack || 0.01, dur / 2));
    g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
    s.connect(f);
    f.connect(g);
    g.connect(dest);
    s.start(t, Math.random() * Math.max(0, 1.9 - dur));
    s.stop(t + dur + 0.03);
  }

  const sfxReady = () => ctx && sfxOn && ctx.state === 'running';

  /* ---------- Efeitos ---------- */
  Sound.tick = function () {
    if (!sfxReady()) return;
    const t = ctx.currentTime;
    if (t - lastTick < 0.028) return; // limita quando a roleta gira muito rápido
    lastTick = t;
    osc('triangle', rand(1700, 1950), t, 0.05, 0.22, sfxBus);
    noise(t, 0.025, 0.12, sfxBus, { type: 'highpass', freq: 4000 });
  };

  Sound.grab = function () {
    if (!sfxReady()) return;
    const t = ctx.currentTime;
    osc('sine', 420, t, 0.09, 0.25, sfxBus, { slide: 300 });
  };

  Sound.pop = function () {
    if (!sfxReady()) return;
    const t = ctx.currentTime;
    osc('sine', 520, t, 0.14, 0.35, sfxBus, { slide: 1250, slideDur: 0.08 });
  };

  Sound.whoosh = function (p) {
    if (!sfxReady()) return;
    const t = ctx.currentTime;
    noise(t, 0.35 + p * 0.6, 0.18 + p * 0.3, sfxBus, { freq: 300, freqTo: 2600 + p * 2000, q: 1.4, attack: 0.05 });
    osc('sine', 300, t, 0.3 + p * 0.3, 0.12, sfxBus, { slide: 700 + p * 600 });
  };

  Sound.weak = function () {
    if (!sfxReady()) return;
    const t = ctx.currentTime;
    osc('sine', 480, t, 0.32, 0.3, sfxBus, { slide: 190 });
    osc('triangle', 240, t + 0.02, 0.28, 0.12, sfxBus, { slide: 110 });
  };

  Sound.add = function () {
    if (!sfxReady()) return;
    const t = ctx.currentTime;
    osc('triangle', mtof(79), t, 0.18, 0.25, sfxBus);
    osc('triangle', mtof(84), t + 0.08, 0.25, 0.25, sfxBus);
    osc('sine', mtof(96), t + 0.12, 0.3, 0.08, sfxBus);
  };

  Sound.remove = function () {
    if (!sfxReady()) return;
    const t = ctx.currentTime;
    osc('triangle', 700, t, 0.25, 0.25, sfxBus, { slide: 220 });
    noise(t, 0.18, 0.1, sfxBus, { freq: 1200, freqTo: 300 });
  };

  Sound.swap = function () {
    if (!sfxReady()) return;
    const t = ctx.currentTime;
    [84, 88, 91, 96, 100].forEach((m, i) => osc('sine', mtof(m), t + i * 0.045, 0.35, 0.14, sfxBus));
    noise(t, 0.4, 0.05, sfxBus, { type: 'highpass', freq: 6000 });
  };

  Sound.blip = function (base) {
    if (!sfxReady()) return;
    const t = ctx.currentTime;
    osc('triangle', base * rand(0.9, 1.25), t, 0.055, 0.09, sfxBus);
  };

  Sound.win = function () {
    if (!sfxReady()) return;
    const t = ctx.currentTime;
    const notes = [72, 76, 79, 84, 88, 91, 96];
    notes.forEach((m, i) => {
      osc('triangle', mtof(m), t + i * 0.07, 0.4, 0.2, sfxBus);
      osc('sine', mtof(m + 12), t + i * 0.07, 0.3, 0.06, sfxBus);
    });
    const c = t + notes.length * 0.07 + 0.05;
    [72, 76, 79, 84].forEach((m) => osc('triangle', mtof(m), c, 1.3, 0.13, sfxBus, { attack: 0.02 }));
    for (let i = 0; i < 10; i++) osc('sine', mtof(96 + Math.floor(rand(0, 12))), c + i * 0.06, 0.25, 0.05, sfxBus);
    noise(t, 0.25, 0.25, sfxBus, { type: 'highpass', freq: 1500 }); // "pof" do confete
  };

  Sound.alarm = function () {
    if (!sfxReady()) return;
    const t = ctx.currentTime;
    for (let r = 0; r < 3; r++) {
      [88, 84, 88, 91].forEach((m, i) => {
        osc('triangle', mtof(m), t + r * 0.7 + i * 0.12, 0.35, 0.22, sfxBus);
        osc('sine', mtof(m + 12), t + r * 0.7 + i * 0.12, 0.2, 0.06, sfxBus);
      });
    }
  };

  Sound.check = function () {
    if (!sfxReady()) return;
    const t = ctx.currentTime;
    osc('sine', 660, t, 0.12, 0.3, sfxBus, { slide: 1320, slideDur: 0.08 });
  };

  /* ---------- Música ---------- */
  function parseSong(s) {
    const melody = s.melody.replace(/\|/g, ' ').trim().split(/\s+/).map((x) => (x === '.' ? null : Number(x)));
    return Object.assign({}, s, { notes: melody });
  }

  function lead(kind, m, t, spb) {
    const f = mtof(m);
    switch (kind) {
      case 'toy':
        osc('triangle', f, t, 0.45, 0.32, musicBus);
        osc('sine', f * 2, t, 0.2, 0.08, musicBus);
        break;
      case 'bell':
        osc('sine', f, t, 1.0, 0.3, musicBus);
        osc('sine', f * 2.76, t, 0.35, 0.06, musicBus);
        osc('sine', f * 4.07, t, 0.15, 0.03, musicBus);
        break;
      case 'chip':
        osc('square', f, t, Math.min(0.22, spb * 0.9), 0.11, musicBus, { filter: 3200 });
        break;
      default: // caixinha de música
        osc('sine', f, t, 0.9, 0.3, musicBus);
        osc('sine', f * 4, t, 0.12, 0.05, musicBus);
        osc('triangle', f * 2, t, 0.25, 0.04, musicBus);
    }
  }

  function playStep(i, t, spb) {
    const n = song.notes[i];
    if (n != null) lead(song.lead, song.root + n, t, spb);
    const bar = Math.floor(i / song.spb);
    const pos = i % song.spb;
    const ch = song.chords[bar % song.chords.length];
    const bassRoot = song.root - 24 + ch[0];
    const barLen = spb * song.spb;
    if (pos === 0) {
      osc('triangle', mtof(bassRoot), t, barLen * 0.55, 0.32, musicBus, { attack: 0.01 });
    }
    if (song.spb === 8 && pos === 4) {
      osc('triangle', mtof(bassRoot + 7), t, barLen * 0.45, 0.22, musicBus, { attack: 0.01 });
    }
    // acompanhamento suave (acordes em arpejo)
    if (song.spb === 6 ? (pos === 2 || pos === 4) : pos % 2 === 1) {
      const k = song.spb === 6 ? pos / 2 : (pos >> 1);
      const tone = song.root - 12 + ch[k % 3];
      osc('sine', mtof(tone), t, spb * 1.6, 0.07, musicBus);
    }
    if (pos % 2 === 1) noise(t, 0.04, 0.025, musicBus, { type: 'highpass', freq: 7000 });
  }

  function scheduler() {
    if (!ctx || !song) return;
    const spb = 60 / song.bpm / 2; // colcheia
    if (nextTime < ctx.currentTime) nextTime = ctx.currentTime + 0.05;
    while (nextTime < ctx.currentTime + 0.25) {
      playStep(step, nextTime, spb);
      nextTime += spb;
      step = (step + 1) % song.notes.length;
    }
  }

  function startMusic() {
    if (timer || !ctx || !song) return;
    nextTime = ctx.currentTime + 0.1;
    step = 0;
    timer = setInterval(scheduler, 60);
  }

  function stopMusic() {
    clearInterval(timer);
    timer = null;
  }

  Sound.setSong = function (s) {
    song = parseSong(s);
    step = 0;
    if (ctx) nextTime = Math.max(nextTime, ctx.currentTime + 0.15);
  };

  Sound.setMusic = function (on) {
    musicOn = on;
    if (!ensure()) return;
    musicBus.gain.setTargetAtTime(on ? 0.2 : 0, ctx.currentTime, 0.15);
    if (on) startMusic();
    else setTimeout(() => { if (!musicOn) stopMusic(); }, 600);
  };

  Sound.setSfx = function (on) {
    sfxOn = on;
    if (!ensure()) return;
    sfxBus.gain.setTargetAtTime(on ? 0.55 : 0, ctx.currentTime, 0.05);
  };

  /* Navegadores só liberam áudio depois de um toque/clique */
  Sound.unlock = function ({ music, sfx }) {
    musicOn = music;
    sfxOn = sfx;
    if (!ensure()) return;
    if (musicOn) startMusic();
  };

  window.Sound = Sound;
})();
