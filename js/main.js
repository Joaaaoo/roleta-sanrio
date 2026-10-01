/* Liga tudo: perfis por personagem (roleta ou tarefas), falas, timers, comemorações e modelos 3D. */
(function () {
  'use strict';

  const { NOME, list: CHARS } = window.SANRIO;
  const byId = Object.fromEntries(CHARS.map((c) => [c.id, c]));
  const $ = (s) => document.querySelector(s);
  const pick = (a) => a[Math.floor(Math.random() * a.length)];
  const fill = (s, a = '') => s.replaceAll('{n}', NOME).replaceAll('{a}', a);
  const uid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-4);
  const fmtMin = (m) => (m >= 60 ? `${Math.floor(m / 60)}h${m % 60 ? String(m % 60).padStart(2, '0') : ''}` : `${m} min`);
  const fmtClock = (s) => {
    s = Math.ceil(s);
    const h = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), ss = s % 60;
    return (h ? h + ':' + String(m).padStart(2, '0') : m) + ':' + String(ss).padStart(2, '0');
  };

  const KEY = 'roleta-sanrio-v2';
  const OLD_KEY = 'roleta-sanrio-v1';
  const EXEMPLOS = [
    'Ver um filme juntinhos 🎬', 'Fazer brigadeiro 🍫', 'Piquenique no parque 🧺', 'Noite de jogos 🎮',
    'Spa day: unhas e skincare 💅', 'Pintar um quadro 🎨', 'Karaokê em casa 🎤', 'Passear e tomar sorvete 🍦',
  ];
  const PRESETS = [5, 10, 15, 20, 25, 30, 45, 60];

  /* ---------- estado (um perfil por personagem) ---------- */
  const mkItems = (texts) => texts.map((text) => ({ id: uid(), text, done: false, minutes: null }));
  function cleanItems(arr) {
    return (Array.isArray(arr) ? arr : [])
      .filter((a) => a && typeof a.text === 'string' && a.text.trim())
      .map((a) => ({
        id: String(a.id || uid()),
        text: a.text.slice(0, 60),
        done: a.done === true,
        minutes: Number.isFinite(a.minutes) && a.minutes > 0 ? Math.min(600, Math.round(a.minutes)) : null,
      }));
  }
  function cleanTimers(t) {
    const out = {};
    for (const k of ['general', 'task']) {
      const x = t && t[k];
      if (!x || !Number.isFinite(x.total) || x.total <= 0) continue;
      out[k] = {
        label: String(x.label || '').slice(0, 60),
        total: x.total,
        endAt: Number.isFinite(x.endAt) ? x.endAt : null,
        left: Number.isFinite(x.left) ? x.left : x.total,
        itemId: x.itemId ? String(x.itemId) : null,
        profileId: byId[x.profileId] ? x.profileId : null,
      };
    }
    return out;
  }
  function load() {
    const base = { character: 'hellokitty', music: true, sfx: true, profiles: {}, timers: {} };
    let legacy = null;
    try {
      const s = JSON.parse(localStorage.getItem(KEY));
      if (s && typeof s === 'object') {
        if (typeof s.character === 'string') base.character = s.character;
        base.music = s.music !== false;
        base.sfx = s.sfx !== false;
        for (const c of CHARS) {
          const p = s.profiles && s.profiles[c.id];
          if (p) base.profiles[c.id] = { mode: p.mode === 'todo' ? 'todo' : 'wheel', items: cleanItems(p.items) };
        }
        base.timers = cleanTimers(s.timers);
      } else {
        // versão antiga: uma lista só → vira a lista inicial de todos os perfis
        const o = JSON.parse(localStorage.getItem(OLD_KEY));
        if (o && Array.isArray(o.activities)) {
          legacy = cleanItems(o.activities);
          if (typeof o.character === 'string') base.character = o.character;
          base.music = o.music !== false;
          base.sfx = o.sfx !== false;
        }
      }
    } catch (e) { /* sem storage: segue com o padrão */ }
    for (const c of CHARS) {
      if (!base.profiles[c.id]) {
        base.profiles[c.id] = { mode: 'wheel', items: legacy ? legacy.map((a) => ({ ...a, id: uid() })) : mkItems(EXEMPLOS) };
      }
    }
    return base;
  }
  function save() {
    try { localStorage.setItem(KEY, JSON.stringify(state)); } catch (e) { /* ignora */ }
  }
  const state = load();

  /* ---------- elementos ---------- */
  const el = {
    picker: $('#picker'), bubble: $('#bubble'), ghost: $('#bubble-ghost'), typed: $('#bubble-typed'), sr: $('#sr-say'),
    buddy: $('#buddy-char'), buddyName: $('#buddy-name'), titleEmoji: $('#title-emoji'), titleWord: $('#title-word'),
    wheelArea: $('.wheel-area'), wrap: $('#wheel-wrap'), wheel: $('#wheel'), pointer: $('#wheel-pointer'), hub: $('#wheel-hub'),
    power: $('#power'), powerFill: $('#power-fill'), powerText: $('#power-text'),
    modeBtns: [...document.querySelectorAll('.mode-switch button')],
    openList: $('#open-list'), count: $('#count'), music: $('#toggle-music'), sfx: $('#toggle-sfx'), timerBtn: $('#timer-btn'),
    drawer: $('#drawer'), scrim: $('#scrim'), closeList: $('#close-list'), list: $('#list'), empty: $('#empty'),
    addForm: $('#add-form'), addInput: $('#add-input'), addBtn: $('#add-btn'), restore: $('#restore'), clearAll: $('#clear-all'),
    todoArea: $('#todo-area'), todoTitle: $('#todo-title'), todoCount: $('#todo-count'), todoFill: $('#todo-progress-fill'),
    todoForm: $('#todo-form'), todoInput: $('#todo-input'), todoAddBtn: $('#todo-add-btn'), todoList: $('#todo-list'),
    todoEmpty: $('#todo-empty'), todoClear: $('#todo-clear-done'),
    timers: $('#timers'),
    result: $('#result'), resultChar: $('#result-char'), resultKicker: $('#result-kicker'), resultTitle: $('#result-title'),
    resultSub: $('#result-sub'), resultActions: $('#result-actions'),
    timeDialog: $('#time-dialog'), timeTitle: $('#time-title'), timeSub: $('#time-sub'), timePresets: $('#time-presets'),
    timeForm: $('#time-form'), timeInput: $('#time-input'), timeClear: $('#time-clear'), timeCancel: $('#time-cancel'),
    themeMeta: document.querySelector('meta[name="theme-color"]'),
    modelBtn: $('#model-btn'), modelReset: $('#model-reset'), modelFile: $('#model-file'),
  };
  const thumbs = {}; // miniaturas renderizadas das bonequinhas 3D

  let char = byId[state.character] || CHARS[0];
  let lastSay = 0, typing = 0, waveTimer = 0, modalOpen = false, drawerOpen = false, timeOpen = false;

  const profile = () => state.profiles[char.id];
  const items = () => profile().items;

  /* ---------- falas ---------- */
  function say(text, { wave = false } = {}) {
    clearInterval(typing);
    lastSay = Date.now();
    const chars = Array.from(text);
    let i = 0;
    el.ghost.textContent = text; // reserva o espaço do balão (sem "pulos" no layout)
    el.typed.textContent = '';
    el.sr.textContent = text;
    el.bubble.classList.remove('pop');
    void el.bubble.offsetWidth;
    el.bubble.classList.add('pop');
    if (wave) {
      el.buddy.classList.add('waving');
      clearTimeout(waveTimer);
      waveTimer = setTimeout(() => el.buddy.classList.remove('waving'), 2800);
    }
    el.buddy.classList.add('talking');
    typing = setInterval(() => {
      i++;
      el.typed.textContent = chars.slice(0, i).join('');
      if (i % 2 && /\S/.test(chars[i - 1])) Sound.blip(char.voice);
      if (i >= chars.length) {
        clearInterval(typing);
        el.buddy.classList.remove('talking');
      }
    }, 30);
  }
  const sayFrom = (key, a) => say(fill(pick(char.phrases[key]), a));

  function bump(node, cls, ms) {
    node.classList.remove(cls);
    void node.offsetWidth;
    node.classList.add(cls);
    setTimeout(() => node.classList.remove(cls), ms);
  }

  /* ---------- personagem / perfil ---------- */
  function buildPicker() {
    CHARS.forEach((c) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'chip';
      b.dataset.id = c.id;
      b.title = c.name;
      b.setAttribute('aria-label', c.name);
      b.innerHTML = c.svg;
      b.addEventListener('click', () => {
        if (c.id === char.id) return poke();
        Sound.swap();
        applyCharacter(c.id);
      });
      el.picker.appendChild(b);
    });
  }

  function applyCharacter(id) {
    char = byId[id] || CHARS[0];
    state.character = char.id;
    save();

    const rs = document.documentElement.style;
    for (const [k, v] of Object.entries(char.ui)) rs.setProperty('--' + k, v);
    if (el.themeMeta) el.themeMeta.content = char.ui.primary;
    document.body.dataset.char = char.id;

    el.buddy.innerHTML = char.svg;
    paintThumbs(char.id);
    el.buddyName.textContent = char.name;
    el.titleEmoji.textContent = char.emoji;
    el.todoTitle.textContent = `Tarefas com ${char.name} ${char.emoji}`;
    el.picker.querySelectorAll('.chip').forEach((b) => {
      const on = b.dataset.id === char.id;
      b.classList.toggle('active', on);
      b.setAttribute('aria-pressed', String(on));
      if (on) b.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    });

    Wheel.setTheme(char.wheel);
    World.setTheme(char);
    Sound.setSong(char.music);
    el.modelReset.hidden = !(World.hasCustomModel && World.hasCustomModel(char.id));
    changed(false);
    applyMode();
    bump(el.buddy, 'jump', 900);
    say(fill(char.phrases.greet[0]), { wave: true });
  }

  function applyMode() {
    const todo = profile().mode === 'todo';
    el.wheelArea.hidden = todo;
    el.todoArea.hidden = !todo;
    el.openList.hidden = todo;
    el.titleWord.textContent = todo ? 'Tarefas' : 'Roleta';
    el.modeBtns.forEach((b) => {
      const on = b.dataset.mode === profile().mode;
      b.classList.toggle('on', on);
      b.setAttribute('aria-pressed', String(on));
    });
    if (todo && drawerOpen) closeDrawer();
  }

  el.modeBtns.forEach((b) => b.addEventListener('click', () => {
    if (profile().mode === b.dataset.mode) return;
    if (Wheel.isSpinning()) return;
    profile().mode = b.dataset.mode;
    save();
    applyMode();
    Sound.pop();
    sayFrom(b.dataset.mode === 'todo' ? 'todo' : 'wheel');
  }));

  /* usa a miniatura 3D quando já existe; senão o desenho */
  function paintThumbs(id) {
    const v = thumbs[id];
    const c = byId[id];
    const chip = el.picker.querySelector(`.chip[data-id="${id}"]`);
    if (chip) chip.innerHTML = v ? `<img src="${v.head}" alt="">` : c.svg;
    if (id !== char.id) return;
    el.hub.innerHTML = v ? `<img src="${v.head}" alt="">` : c.svg;
    el.resultChar.innerHTML = v ? `<img src="${v.full}" alt="">` : c.svg;
  }

  function poke() {
    Sound.pop();
    bump(el.buddy, 'jump', 900);
    sayFrom('poke');
  }

  /* ---------- modal de comemoração (sorteio, tarefa concluída, tempo esgotado) ---------- */
  function showModal({ kicker, title, sub, actions, party = true }) {
    el.resultKicker.textContent = kicker;
    el.resultTitle.textContent = title;
    el.resultSub.textContent = sub;
    el.resultActions.replaceChildren(...actions.map((a, i) => {
      const b = document.createElement('button');
      b.type = 'button';
      b.className = 'btn ' + (i === 0 ? 'btn-primary' : 'btn-ghost');
      b.textContent = a.label;
      b.addEventListener('click', () => {
        Sound.pop();
        closeModal();
        if (a.fn) a.fn();
      });
      return b;
    }));
    el.result.hidden = false;
    requestAnimationFrame(() => el.result.classList.add('show'));
    modalOpen = true;
    if (party) {
      Sound.win();
      World.celebrate();
      const r = (profile().mode === 'todo' ? el.todoArea : el.wrap).getBoundingClientRect();
      Confetti.burst(r.left + r.width / 2, r.top + r.height / 2, { colors: char.confetti, count: 160 });
      Confetti.rain({ colors: char.confetti, count: 90 });
    }
    setTimeout(() => el.resultActions.firstChild?.focus({ preventScroll: true }), 50);
  }

  function closeModal() {
    if (!modalOpen) return;
    modalOpen = false;
    el.result.classList.remove('show');
    setTimeout(() => { if (!modalOpen) el.result.hidden = true; }, 260);
  }
  el.result.addEventListener('click', (e) => { if (e.target === el.result) closeModal(); });

  /* ---------- roleta ---------- */
  function showPower(p, weak) {
    el.power.classList.add('show');
    el.powerFill.style.width = Math.max(4, Math.round(p * 100)) + '%';
    el.power.classList.toggle('max', !weak && p >= 0.7);
    if (weak === undefined) return;
    el.powerText.textContent = weak ? 'fraquinha 🥺' : p < 0.35 ? 'boa! 👍' : p < 0.7 ? 'forte! 💪' : 'SUPER FORTE! 💥';
  }

  function stopExcitement() {
    el.buddy.classList.remove('excited');
    el.wrap.classList.remove('spinning');
    World.setExcited(false);
  }

  function wiggle() {
    if (el.pointer.dataset.busy) return;
    el.pointer.dataset.busy = '1';
    el.pointer.animate(
      [{ transform: 'translateX(-50%) rotate(0deg)' }, { transform: 'translateX(-50%) rotate(-16deg)' }, { transform: 'translateX(-50%) rotate(0deg)' }],
      { duration: 110, easing: 'ease-out' },
    ).onfinish = () => { delete el.pointer.dataset.busy; };
  }

  Wheel.init(el.wrap, el.wheel, {
    canSpin: () => items().length >= 2,
    onBlocked: () => {
      Sound.weak();
      sayFrom('empty');
      bump(el.openList, 'nudge', 700);
    },
    onGrab: () => {
      Sound.grab();
      el.powerText.textContent = 'solta pra girar! ✨';
      showPower(0);
    },
    onDrag: (p) => showPower(p),
    onCatch: stopExcitement,
    onSpin: (p) => {
      Sound.whoosh(p);
      showPower(p, false);
      sayFrom('spin');
      el.buddy.classList.add('excited');
      el.wrap.classList.add('spinning');
      World.setExcited(true);
    },
    onWeak: (p) => {
      Sound.weak();
      showPower(p, true);
      sayFrom('weak');
    },
    onTick: () => {
      Sound.tick();
      wiggle();
    },
    onStop: finishSpin,
  });

  function finishSpin(idx) {
    stopExcitement();
    const a = items()[idx];
    if (!a) return;
    const pid = char.id;
    bump(el.buddy, 'jump', 900);
    sayFrom('win', a.text);
    setTimeout(() => showModal({
      kicker: `${char.name} sorteou pra você:`,
      title: a.text,
      sub: fill(pick(char.phrases.sub)),
      actions: [
        { label: 'Oba, vamos! 💖' },
        { label: a.minutes ? `⏱️ Começar (${fmtMin(a.minutes)})` : '⏱️ Com timer', fn: () => startItemTimer(pid, a.id) },
        { label: 'Girar de novo', fn: () => { sayFrom('again'); bump(el.wrap, 'pulse', 1200); el.wrap.focus({ preventScroll: true }); } },
        { label: 'Tirar da roleta', fn: () => removeItemById(a.id, true) },
      ],
    }), 420);
  }

  el.hub.addEventListener('click', () => Wheel.spinRandom());
  el.wrap.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      Wheel.spinRandom();
    }
  });

  /* ---------- listas (gaveta da roleta + painel de tarefas usam os mesmos itens do perfil) ---------- */
  function changed(persist = true) {
    if (persist) save();
    Wheel.setItems(items().map((a) => a.text));
    renderList();
    renderTodo();
  }

  function iconBtn(cls, text, label) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'btn-icon ' + cls;
    b.textContent = text;
    b.setAttribute('aria-label', label);
    return b;
  }
  function timeChip(a) {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'time-chip' + (a.minutes ? ' set' : '');
    b.textContent = a.minutes ? '⏱️ ' + fmtMin(a.minutes) : '⏱️';
    b.title = 'Quanto tempo vai levar?';
    b.setAttribute('aria-label', a.minutes ? `Tempo: ${fmtMin(a.minutes)}. Alterar` : 'Definir tempo');
    return b;
  }
  function itemRow(a, i, n, todo) {
    const li = document.createElement('li');
    li.className = 'item' + (todo && a.done ? ' done' : '');
    li.dataset.id = a.id;
    if (todo) {
      const chk = document.createElement('button');
      chk.type = 'button';
      chk.className = 'check';
      chk.textContent = a.done ? '✓' : '';
      chk.setAttribute('aria-label', (a.done ? 'Desmarcar ' : 'Concluir ') + a.text);
      chk.setAttribute('aria-pressed', String(a.done));
      li.append(chk);
    } else {
      const dot = document.createElement('span');
      dot.className = 'dot';
      dot.style.background = Wheel.colorAt(i, n);
      li.append(dot);
    }
    const txt = document.createElement('span');
    txt.className = 'item-text';
    txt.textContent = a.text;
    li.append(txt, timeChip(a));
    if (todo && !a.done) li.append(iconBtn('play', '▶', 'Começar timer de ' + a.text));
    li.append(iconBtn('edit', '✏️', 'Editar ' + a.text), iconBtn('del', '🗑️', 'Excluir ' + a.text));
    return li;
  }

  function renderList() {
    const list = items(), n = list.length;
    el.list.replaceChildren(...list.map((a, i) => itemRow(a, i, n, false)));
    el.empty.hidden = n > 0;
    el.count.textContent = n;
  }

  function renderTodo() {
    const list = items(), n = list.length;
    const done = list.filter((a) => a.done).length;
    el.todoList.replaceChildren(...list.map((a, i) => itemRow(a, i, n, true)));
    el.todoEmpty.hidden = n > 0;
    el.todoCount.textContent = `${done}/${n}`;
    el.todoFill.style.width = n ? (done / n) * 100 + '%' : '0%';
    el.todoClear.hidden = !done;
  }

  function startEdit(li) {
    const a = items().find((x) => x.id === li.dataset.id);
    if (!a) return;
    const txt = li.querySelector('.item-text');
    const input = document.createElement('input');
    input.className = 'edit-input';
    input.value = a.text;
    input.maxLength = 60;
    input.setAttribute('aria-label', 'Editar');
    txt.replaceWith(input);
    li.classList.add('editing');
    input.focus();
    input.select();
    let done = false;
    const commit = (ok) => {
      if (done) return;
      done = true;
      const v = input.value.trim();
      if (ok && v && v !== a.text) {
        a.text = v;
        changed();
        Sound.add();
        sayFrom('edit');
      } else {
        changed(false);
      }
    };
    input.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') { e.preventDefault(); commit(true); }
      else if (e.key === 'Escape') { e.stopPropagation(); commit(false); }
    });
    input.addEventListener('blur', () => commit(true));
  }

  function removeItemById(id, talk) {
    profile().items = items().filter((x) => x.id !== id);
    const tm = state.timers.task;
    if (tm && tm.itemId === id) delete state.timers.task;
    changed();
    renderTimers();
    if (talk) { Sound.remove(); sayFrom('remove'); }
  }

  function removeItem(li) {
    li.classList.add('leaving');
    Sound.remove();
    setTimeout(() => { removeItemById(li.dataset.id, false); sayFrom('remove'); }, 200);
  }

  async function setItemTime(id) {
    const a = items().find((x) => x.id === id);
    if (!a) return;
    const m = await askTime({ title: 'Quanto tempo? ⏱️', sub: a.text, current: a.minutes, allowClear: !!a.minutes });
    if (m === null) return;
    const it = items().find((x) => x.id === id);
    if (!it) return;
    it.minutes = m === 'clear' ? null : m;
    changed();
    Sound.check();
  }

  function onListClick(e) {
    const li = e.target.closest('.item');
    if (!li) return;
    if (e.target.closest('.edit')) startEdit(li);
    else if (e.target.closest('.del')) removeItem(li);
    else if (e.target.closest('.time-chip')) setItemTime(li.dataset.id);
    else if (e.target.closest('.play')) startItemTimer(char.id, li.dataset.id);
    else if (e.target.closest('.check')) toggleDone(li.dataset.id);
  }
  el.list.addEventListener('click', onListClick);
  el.todoList.addEventListener('click', onListClick);

  function addItem(input, btn) {
    const v = input.value.trim();
    if (!v) {
      bump(input, 'shake', 450);
      return;
    }
    items().push({ id: uid(), text: v, done: false, minutes: null });
    changed();
    input.value = '';
    const list = profile().mode === 'todo' ? el.todoList : el.list;
    list.lastElementChild?.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
    Sound.add();
    const r = btn.getBoundingClientRect();
    Confetti.burst(r.left + r.width / 2, r.top + r.height / 2, { colors: char.confetti, count: 28, power: 0.55 });
    sayFrom('add');
  }
  el.addForm.addEventListener('submit', (e) => { e.preventDefault(); addItem(el.addInput, el.addBtn); });
  el.todoForm.addEventListener('submit', (e) => { e.preventDefault(); addItem(el.todoInput, el.todoAddBtn); });

  el.restore.addEventListener('click', () => {
    const have = new Set(items().map((a) => a.text));
    const missing = EXEMPLOS.filter((t) => !have.has(t));
    if (!missing.length) return sayFrom('add');
    items().push(...mkItems(missing));
    changed();
    Sound.add();
    sayFrom('add');
  });

  el.clearAll.addEventListener('click', () => {
    if (!items().length) return;
    if (!window.confirm(`Apagar todas as ${items().length} atividades da ${char.name}?`)) return;
    profile().items = [];
    changed();
    Sound.remove();
    sayFrom('empty');
  });

  el.todoClear.addEventListener('click', () => {
    const n = items().filter((a) => a.done).length;
    if (!n) return;
    profile().items = items().filter((a) => !a.done);
    changed();
    Sound.remove();
    sayFrom('remove');
  });

  /* ---------- tarefas: concluir = comemoração ---------- */
  function toggleDone(id) {
    const a = items().find((x) => x.id === id);
    if (!a) return;
    if (a.done) {
      a.done = false;
      changed();
      Sound.check();
      return;
    }
    completeItem(char.id, id);
  }

  function completeItem(pid, id) {
    const p = state.profiles[pid];
    const a = p && p.items.find((x) => x.id === id);
    if (!a || a.done) return;
    a.done = true;
    const tm = state.timers.task;
    if (tm && tm.itemId === id) delete state.timers.task;
    changed();
    renderTimers();
    Sound.check();
    bump(el.buddy, 'jump', 900);
    const all = p.items.length > 1 && p.items.every((x) => x.done);
    sayFrom(all ? 'allDone' : 'done');
    setTimeout(() => showModal({
      kicker: all ? 'TODAS as tarefas concluídas! 🏆' : 'Tarefa concluída! 🎉',
      title: a.text,
      sub: fill(pick(char.phrases.doneSub)),
      actions: [
        { label: 'Eba! 💖' },
        { label: 'Desfazer', fn: () => { a.done = false; changed(); } },
      ],
    }), 250);
  }

  /* ---------- timers: um geral + um da tarefa (continuam mesmo recarregando a página) ---------- */
  const timeLeft = (tm) => (tm.endAt ? Math.max(0, (tm.endAt - Date.now()) / 1000) : tm.left);

  function startTimer(kind, minutes, label, extra = {}) {
    state.timers[kind] = { label, total: minutes * 60, endAt: Date.now() + minutes * 60000, left: minutes * 60, itemId: null, profileId: null, ...extra };
    save();
    renderTimers();
    Sound.check();
    sayFrom('timer');
  }

  async function startItemTimer(pid, id) {
    const find = () => state.profiles[pid] && state.profiles[pid].items.find((x) => x.id === id);
    let a = find();
    if (!a) return;
    let m = a.minutes;
    if (!m) {
      const r = await askTime({ title: 'Quanto tempo vai gastar? ⏱️', sub: a.text, current: null, allowClear: false });
      if (r === null || r === 'clear' || !(a = find())) return;
      a.minutes = m = r;
      changed();
    }
    const cur = state.timers.task;
    if (cur && cur.itemId !== id && !window.confirm(`Já tem um timer rodando pra "${cur.label}". Trocar pra esta tarefa?`)) return;
    startTimer('task', m, a.text, { itemId: id, profileId: pid });
  }

  el.timerBtn.addEventListener('click', async () => {
    const cur = state.timers.general;
    if (cur && !window.confirm('Já tem um timer geral rodando. Começar outro?')) return;
    const m = await askTime({ title: 'Timer ⏱️', sub: `Escolhe o tempo, ${NOME}!`, current: null, allowClear: false });
    if (m === null || m === 'clear') return;
    startTimer('general', m, 'Timer');
  });

  function renderTimers() {
    const kinds = ['general', 'task'].filter((k) => state.timers[k]);
    el.timers.replaceChildren(...kinds.map((k) => {
      const tm = state.timers[k];
      const card = document.createElement('div');
      card.className = 'timer-card' + (tm.endAt ? '' : ' paused');
      card.dataset.kind = k;
      card.innerHTML = `
        <div class="timer-ring"><span class="timer-clock"></span></div>
        <div class="timer-info">
          <span class="timer-label"></span>
          <div class="timer-actions">
            <button type="button" class="btn-icon t-pause" aria-label="${tm.endAt ? 'Pausar' : 'Continuar'}">${tm.endAt ? '⏸' : '▶'}</button>
            <button type="button" class="btn-icon t-plus" aria-label="Mais 5 minutos">+5</button>
            ${k === 'task' ? '<button type="button" class="btn-icon t-done" aria-label="Concluir tarefa">✓</button>' : ''}
            <button type="button" class="btn-icon t-stop" aria-label="Parar timer">✕</button>
          </div>
        </div>`;
      card.querySelector('.timer-label').textContent = (k === 'task' ? '📝 ' : '⏱️ ') + tm.label;
      return card;
    }));
    tickTimers();
  }

  el.timers.addEventListener('click', (e) => {
    const card = e.target.closest('.timer-card');
    if (!card) return;
    const k = card.dataset.kind, tm = state.timers[k];
    if (!tm) return;
    if (e.target.closest('.t-pause')) {
      if (tm.endAt) { tm.left = timeLeft(tm); tm.endAt = null; } else tm.endAt = Date.now() + tm.left * 1000;
    } else if (e.target.closest('.t-plus')) {
      if (tm.endAt) tm.endAt += 300000; else tm.left += 300;
      tm.total += 300;
    } else if (e.target.closest('.t-stop')) {
      delete state.timers[k];
    } else if (e.target.closest('.t-done')) {
      return completeItem(tm.profileId, tm.itemId);
    } else return;
    Sound.pop();
    save();
    renderTimers();
  });

  function tickTimers() {
    let titleClock = '';
    for (const k of ['general', 'task']) {
      const tm = state.timers[k];
      if (!tm) continue;
      const left = timeLeft(tm);
      const card = el.timers.querySelector(`[data-kind="${k}"]`);
      if (card) {
        card.querySelector('.timer-clock').textContent = fmtClock(left);
        card.style.setProperty('--p', String(1 - left / tm.total));
      }
      if (!titleClock && tm.endAt) titleClock = fmtClock(left);
      if (tm.endAt && left <= 0) return timeUp(k);
    }
    const base = `${el.titleWord.textContent} da ${NOME}`;
    const title = titleClock ? `⏱️ ${titleClock} · ${base}` : base;
    if (document.title !== title) document.title = title;
  }
  setInterval(tickTimers, 250);

  function timeUp(kind) {
    const tm = state.timers[kind];
    delete state.timers[kind];
    save();
    renderTimers();
    Sound.alarm();
    bump(el.buddy, 'jump', 900);
    sayFrom('timeup');
    const isTask = kind === 'task' && tm.itemId;
    showModal({
      kicker: isTask ? '⏰ Acabou o tempo da tarefa!' : '⏰ Tempo esgotado!',
      title: tm.label,
      sub: isTask ? fill('Conseguiu terminar, {n}?') : fill('Acabou o tempo, {n}! ✨'),
      party: false,
      actions: isTask
        ? [
          { label: 'Concluí! ✅', fn: () => completeItem(tm.profileId, tm.itemId) },
          { label: '+5 min', fn: () => startTimer('task', 5, tm.label, { itemId: tm.itemId, profileId: tm.profileId }) },
          { label: 'Fechar' },
        ]
        : [
          { label: 'Oba! 💖' },
          { label: '+5 min', fn: () => startTimer('general', 5, tm.label) },
        ],
    });
    World.celebrate();
  }

  /* ---------- escolher tempo ---------- */
  let timeResolve = null;
  PRESETS.forEach((m) => {
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'preset';
    b.dataset.min = m;
    b.textContent = fmtMin(m);
    el.timePresets.appendChild(b);
  });
  function askTime({ title, sub, current, allowClear }) {
    if (timeResolve) timeResolve(null);
    el.timeTitle.textContent = title;
    el.timeSub.textContent = sub || '';
    el.timeInput.value = current || '';
    el.timeClear.hidden = !allowClear;
    el.timePresets.querySelectorAll('.preset').forEach((b) => b.classList.toggle('on', Number(b.dataset.min) === current));
    el.timeDialog.hidden = false;
    requestAnimationFrame(() => el.timeDialog.classList.add('show'));
    timeOpen = true;
    Sound.pop();
    setTimeout(() => el.timePresets.firstChild.focus({ preventScroll: true }), 50);
    return new Promise((res) => { timeResolve = res; });
  }
  function closeTime(value) {
    if (!timeOpen) return;
    timeOpen = false;
    el.timeDialog.classList.remove('show');
    setTimeout(() => { if (!timeOpen) el.timeDialog.hidden = true; }, 260);
    const r = timeResolve;
    timeResolve = null;
    if (r) r(value);
  }
  el.timePresets.addEventListener('click', (e) => {
    const b = e.target.closest('.preset');
    if (b) closeTime(Number(b.dataset.min));
  });
  el.timeForm.addEventListener('submit', (e) => {
    e.preventDefault();
    const m = Math.round(Number(el.timeInput.value));
    if (!(m >= 1 && m <= 600)) return bump(el.timeInput, 'shake', 450);
    closeTime(m);
  });
  el.timeClear.addEventListener('click', () => closeTime('clear'));
  el.timeCancel.addEventListener('click', () => closeTime(null));
  el.timeDialog.addEventListener('click', (e) => { if (e.target === el.timeDialog) closeTime(null); });

  /* ---------- gaveta ---------- */
  function openDrawer() {
    drawerOpen = true;
    el.drawer.classList.add('open');
    el.scrim.classList.add('on');
    el.drawer.setAttribute('aria-hidden', 'false');
    Sound.pop();
    setTimeout(() => el.addInput.focus({ preventScroll: true }), 320);
  }
  function closeDrawer() {
    if (!drawerOpen) return;
    drawerOpen = false;
    el.drawer.classList.remove('open');
    el.scrim.classList.remove('on');
    el.drawer.setAttribute('aria-hidden', 'true');
  }
  el.openList.addEventListener('click', openDrawer);
  el.closeList.addEventListener('click', () => { closeDrawer(); el.openList.focus({ preventScroll: true }); });
  el.scrim.addEventListener('click', closeDrawer);

  document.addEventListener('keydown', (e) => {
    if (e.key !== 'Escape') return;
    if (timeOpen) closeTime(null);
    else if (modalOpen) closeModal();
    else closeDrawer();
  });

  /* ---------- som ---------- */
  function syncToggles() {
    el.music.classList.toggle('off', !state.music);
    el.music.setAttribute('aria-pressed', String(state.music));
    el.sfx.classList.toggle('off', !state.sfx);
    el.sfx.setAttribute('aria-pressed', String(state.sfx));
  }
  el.music.addEventListener('click', () => {
    state.music = !state.music;
    save();
    Sound.setMusic(state.music);
    syncToggles();
  });
  el.sfx.addEventListener('click', () => {
    state.sfx = !state.sfx;
    save();
    Sound.setSfx(state.sfx);
    syncToggles();
    Sound.pop();
  });

  const unlock = () => {
    Sound.unlock({ music: state.music, sfx: state.sfx });
    window.removeEventListener('pointerdown', unlock, true);
    window.removeEventListener('keydown', unlock, true);
  };
  window.addEventListener('pointerdown', unlock, true);
  window.addEventListener('keydown', unlock, true);

  el.buddy.addEventListener('click', poke);

  /* ---------- modelos 3D próprios (.glb), guardados no IndexedDB ---------- */
  const idb = (() => {
    let dbp = null;
    const open = () => dbp || (dbp = new Promise((res, rej) => {
      const r = indexedDB.open('roleta-sanrio', 1);
      r.onupgradeneeded = () => r.result.createObjectStore('models');
      r.onsuccess = () => res(r.result);
      r.onerror = () => rej(r.error);
    }));
    const tx = (mode, fn) => open().then((db) => new Promise((res, rej) => {
      const req = fn(db.transaction('models', mode).objectStore('models'));
      req.onsuccess = () => res(req.result);
      req.onerror = () => rej(req.error);
    }));
    return {
      get: (k) => tx('readonly', (st) => st.get(k)),
      put: (k, v) => tx('readwrite', (st) => st.put(v, k)),
      del: (k) => tx('readwrite', (st) => st.delete(k)),
    };
  })();

  async function useModel(id, buffer, announce) {
    try {
      await World.setCustomModel(id, buffer);
      if (id === char.id) el.modelReset.hidden = false;
      if (announce) { Sound.add(); say('Uau! Olha meu modelo 3D novo! ✨'); }
      return true;
    } catch (e) {
      console.warn('Modelo inválido', e);
      if (announce) { Sound.weak(); say('Hmm, não consegui abrir esse arquivo. Tenta um .glb! 🧸'); }
      return false;
    }
  }

  el.modelBtn.addEventListener('click', () => {
    if (!World.ready) return say('Calma, o mundo 3D ainda está carregando! ✨');
    el.modelFile.click();
  });
  el.modelFile.addEventListener('change', async () => {
    const file = el.modelFile.files[0];
    el.modelFile.value = '';
    if (!file) return;
    const buf = await file.arrayBuffer();
    if (await useModel(char.id, buf, true)) idb.put(char.id, buf).catch(() => {});
  });
  el.modelReset.addEventListener('click', () => {
    World.clearCustomModel(char.id);
    idb.del(char.id).catch(() => {});
    el.modelReset.hidden = true;
    Sound.remove();
    say('Voltei ao meu jeitinho de sempre! 💕');
  });

  World.setSlot(el.buddy);
  World.onThumbs((id, v) => { thumbs[id] = v; paintThumbs(id); });
  World.onReady(() => {
    CHARS.forEach(async (c) => {
      // 1) modelo salvo no navegador; 2) arquivo models/<id>.glb quando o site está hospedado
      let buf = await idb.get(c.id).catch(() => null);
      if (!buf && location.protocol.startsWith('http')) {
        buf = await fetch(`models/${c.id}.glb`).then((r) => (r.ok ? r.arrayBuffer() : null)).catch(() => null);
      }
      if (buf) useModel(c.id, buf, false);
    });
  });

  /* Falas aleatórias quando ela está só olhando */
  setInterval(() => {
    if (document.hidden || modalOpen || drawerOpen || timeOpen || Wheel.isSpinning()) return;
    if (Date.now() - lastSay > 12000) sayFrom('idle');
  }, 1500);

  /* ---------- início ---------- */
  Confetti.init($('#confetti'));
  buildPicker();
  syncToggles();
  applyCharacter(char.id);
  renderTimers();
  const load3D = () => setTimeout(() => World.load($('#world')), 30);
  if (document.readyState === 'complete') load3D();
  else window.addEventListener('load', load3D, { once: true });
})();
