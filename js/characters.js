/* Personagens: visual (SVG), cores da interface, roleta, mundo 3D, música e falas. */
(function () {
  'use strict';

  const NOME = 'Isadora';

  const svg = (inner) =>
    `<svg viewBox="0 0 200 200" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">${inner}</svg>`;
  const paw = (fill, stroke) =>
    `<g class="paw"><ellipse cx="176" cy="170" rx="17" ry="19" fill="${fill}" stroke="${stroke}" stroke-width="5"/></g>`;

  /* Acordes: [baixo, terça, quinta] em semitons a partir da tônica */
  const I = [0, 4, 7], ii = [2, 5, 9], iii = [4, 7, 11], IV = [5, 9, 12], V = [7, 11, 14], vi = [9, 12, 16];

  const list = [
    {
      id: 'hellokitty',
      name: 'Hello Kitty',
      emoji: '🎀',
      voice: 640,
      ui: {
        primary: '#ff4f87', 'primary-2': '#d92e66', soft: '#ffe4ee', accent: '#ffd23f',
        ink: '#5b2238', bg1: '#ffc4d8', bg2: '#fff2f6',
      },
      wheel: {
        colors: ['#ff5c8a', '#ffffff', '#ffb3cb', '#ff2d55', '#ffe4ee'],
        rim: '#ff4f87', dots: ['#ffffff', '#ffd23f'], dark: '#b0124a',
      },
      confetti: ['#ff4f87', '#ff2d55', '#ffffff', '#ffd23f', '#ffb3cb'],
      world: {
        landmarks: [{ type: 'castle', side: -1, z: -34, f: 0.78, s: 1.7, wall: '#ffe6ef', roof: '#ff6fa0', door: '#ff4f87', sign: 'Castelo da ' + NOME }, { type: 'shop', side: 1, z: -30, f: 0.8, s: 1.6, wall: '#fff3f7', roof: '#ff6fa0', door: '#ff4f87', sign: 'Kitty Shop' }],
        sky: ['#ff9ec0', '#ffeef4'], fog: '#ffe3ee', ground: '#a5e28f', hills: '#86d173',
        sparkles: ['#ffffff', '#ffd1e0', '#ffe680'],
        items: [
          { p: 'appleTree', o: { leaf: '#6fcf6a' }, n: 10, place: 'sides' },
          { p: 'flower', n: 70, place: 'ground', tints: ['#ff5c8a', '#ffffff', '#ffd1e0', '#ff2d55'] },
          { p: 'bow', o: { color: '#ff2d55', dark: '#d81b45' }, n: 10, place: 'float' },
          { p: 'heart', n: 12, place: 'float', tints: ['#ff5c8a', '#ff9db8', '#ff2d55'] },
          { p: 'apple', n: 7, place: 'float' },
          { p: 'cloud', n: 9, place: 'sky' },
        ],
      },
      music: {
        bpm: 112, root: 72, spb: 8, lead: 'musicbox',
        chords: [I, vi, IV, V, I, vi, IV, V],
        melody: '7 . 12 . 11 12 16 . | 16 . 14 12 9 . 12 . | 9 . 12 14 17 . 16 14 | 14 . 11 . 7 . . . | 7 9 12 . 16 . 19 . | 21 . 19 16 12 . 16 . | 17 . 16 14 12 . 9 . | 11 . 14 . 12 . . .',
      },
      svg: svg(`
        <g stroke="#2b2b2b" stroke-width="5" stroke-linejoin="round">
          <path d="M34 96 L32 34 Q34 20 48 26 L96 62 Z" fill="#fff"/>
          <path d="M166 96 L168 34 Q166 20 152 26 L104 62 Z" fill="#fff"/>
          <ellipse cx="100" cy="114" rx="86" ry="64" fill="#fff"/>
        </g>
        <g stroke="#2b2b2b" stroke-width="4.5" stroke-linejoin="round" fill="#ff2d55">
          <path d="M146 50 Q124 14 106 34 Q100 60 140 62 Z"/>
          <path d="M152 54 Q190 32 192 64 Q186 92 154 70 Z"/>
          <circle cx="148" cy="58" r="12"/>
        </g>
        <ellipse cx="64" cy="118" rx="7.5" ry="10" fill="#2b2b2b"/>
        <ellipse cx="136" cy="118" rx="7.5" ry="10" fill="#2b2b2b"/>
        <ellipse cx="100" cy="132" rx="9" ry="6.5" fill="#ffd400" stroke="#2b2b2b" stroke-width="3.5"/>
        <path d="M34 112 6 104M32 126 2 128M36 140 8 152M166 112 194 104M168 126 198 128M164 140 192 152" stroke="#2b2b2b" stroke-width="4" stroke-linecap="round"/>
        ${paw('#fff', '#2b2b2b')}`),
      phrases: {
        greet: ['Oiii, {n}! Sorteie a atividade para se divertir! 🎀'],
        idle: [
          'Arrasta a roleta com bastante força, {n}! 💪🎀',
          'Sabia que eu amo torta de maçã? 🍎',
          'Amizade é o melhor presente do mundo! 💕',
          'Que tal uma aventura bem fofa hoje? ✨',
          'Você fica ainda mais linda sorrindo, {n}! 😊',
          'Eu e a Mimmy estamos torcendo por você! 🎀',
        ],
        spin: ['Lá vaaai! Gira, gira! 🌀', 'Que emoção!! Meu laço até tremeu! 🎀', 'Será que vai ser algo bem divertido? 💓'],
        win: ['Ebaaa! Vai ser: {a}! 🎉', 'Que demais, {n}! Hoje é dia de: {a}! 💖', 'Uhuul! {a}! Vai ser incrível! ✨'],
        weak: ['Hmm, foi fraquinho! Arrasta com mais força! 💪', 'Puxa mais forte, {n}! Você consegue! 🎀'],
        poke: ['Hihi, faz cócegas! 🎀', 'Oi oi oi, {n}! 💕', 'Quer um abraço? 🤗'],
      },
    },

    {
      id: 'mymelody',
      name: 'My Melody',
      emoji: '🌸',
      voice: 720,
      ui: {
        primary: '#ff6fa5', 'primary-2': '#dc4d86', soft: '#ffe8f2', accent: '#ffd9e8',
        ink: '#6a2a4a', bg1: '#ffd0e4', bg2: '#fff5fa',
      },
      wheel: {
        colors: ['#ff9cc5', '#ffffff', '#ffd0e3', '#ff6fa5', '#fde2ff'],
        rim: '#ff8fb8', dots: ['#ffffff', '#ff4f8b'], dark: '#b8336c',
      },
      confetti: ['#ff9cc5', '#ff6fa5', '#ffffff', '#ff4f8b', '#fde2ff', '#ffe066'],
      world: {
        landmarks: [{ type: 'castle', side: -1, z: -36, f: 0.78, s: 1.6, wall: '#fff0f6', roof: '#ff8fb8', door: '#e2588f', sign: 'Castelo da ' + NOME }, { type: 'shop', side: 1, z: -30, f: 0.8, s: 1.6, wall: '#fff6e8', roof: '#ff6fa5', door: '#e2588f', sign: 'Doces da Melody' }],
        sky: ['#ffb6d5', '#fff1f8'], fog: '#ffe6f1', ground: '#c6ebaa', hills: '#ffc4dc',
        sparkles: ['#ffffff', '#ffd1e6', '#fff0a8'],
        rainbow: true,
        items: [
          { p: 'tree', o: { leaf: '#ffb3d1' }, n: 10, place: 'sides' },
          { p: 'strawberry', n: 12, place: 'ground', scale: [1.4, 2.2] },
          { p: 'flower', n: 80, place: 'ground', tints: ['#ff6fa5', '#ffffff', '#e6c6ff', '#ffb3d1'] },
          { p: 'heart', n: 14, place: 'float', tints: ['#ff9cc5', '#ff6fa5', '#ffffff'] },
          { p: 'strawberry', n: 6, place: 'float' },
          { p: 'cloud', n: 8, place: 'sky' },
        ],
      },
      music: {
        bpm: 138, root: 79, spb: 6, lead: 'musicbox',
        chords: [I, vi, IV, V, I, IV, V, I],
        melody: '-5 . . 0 -1 0 | 4 . . 2 0 . | -3 . . 0 . 4 | 2 . . . . . | -5 . . 0 -1 0 | 5 . . 4 2 0 | -1 . . 2 0 -1 | 0 . . . . .',
      },
      svg: svg(`
        <g stroke="#4a2a3a" stroke-width="5" stroke-linejoin="round">
          <path d="M58 74 Q34 -2 66 4 Q94 12 90 70 Z" fill="#ff8fb8"/>
          <path d="M142 74 Q166 -2 134 4 Q106 12 110 70 Z" fill="#ff8fb8"/>
          <ellipse cx="100" cy="118" rx="84" ry="70" fill="#ff8fb8"/>
          <ellipse cx="100" cy="130" rx="62" ry="50" fill="#fff"/>
        </g>
        <path d="M66 62 Q52 16 68 16 Q82 22 80 60Z" fill="#ffd1e3"/>
        <path d="M134 62 Q148 16 132 16 Q118 22 120 60Z" fill="#ffd1e3"/>
        <g transform="translate(140 60)" stroke="#4a2a3a" stroke-width="3" fill="#ff4f8b">
          <circle cx="0" cy="-9" r="8"/><circle cx="8.5" cy="-3" r="8"/><circle cx="5.5" cy="7" r="8"/>
          <circle cx="-5.5" cy="7" r="8"/><circle cx="-8.5" cy="-3" r="8"/>
          <circle r="5" fill="#ffe066"/>
        </g>
        <ellipse cx="78" cy="128" rx="6" ry="8.5" fill="#3b2730"/>
        <ellipse cx="122" cy="128" rx="6" ry="8.5" fill="#3b2730"/>
        <ellipse cx="64" cy="146" rx="11" ry="6.5" fill="#ffb3c9"/>
        <ellipse cx="136" cy="146" rx="11" ry="6.5" fill="#ffb3c9"/>
        <ellipse cx="100" cy="142" rx="6.5" ry="4.5" fill="#ffd400" stroke="#4a2a3a" stroke-width="3"/>
        <path d="M93 153 Q100 159 107 153" fill="none" stroke="#4a2a3a" stroke-width="3.5" stroke-linecap="round"/>
        ${paw('#fff', '#4a2a3a')}`),
      phrases: {
        greet: ['Oiii, {n}! Vamos sortear uma atividade bem docinha? 🌸'],
        idle: [
          'Mamãe sempre diz: a diversão fica melhor dividida! 🍓',
          'Que tal um chazinho e uma atividade fofa? ☕💕',
          'Gira com carinho... mas com força, tá? 🌸',
          'Hoje o dia está cheirando a morango! 🍓',
          'Você é a pessoa mais doce que eu conheço, {n}! 💗',
        ],
        spin: ['Uiii, tá girando! 🌸', 'Ai que nervoso fofinho! 💗', 'Torcendo com minhas orelhinhas! 🐰'],
        win: ['Que lindo! Vai ser: {a}! 🍓', 'Ebaa, {n}! A escolhida é: {a}! 🌸', 'Mamãe ia amar: {a}! 💕'],
        weak: ['Oh não, foi fraquinho... tenta de novo! 🌸', 'Mais força, {n}! Eu acredito em você! 💪'],
        poke: ['Hihi, oi {n}! 🌸', 'Minhas orelhinhas! 🐰', 'Quer um morango? 🍓'],
      },
    },

    {
      id: 'kuromi',
      name: 'Kuromi',
      emoji: '💜',
      voice: 520,
      ui: {
        primary: '#9b5de5', 'primary-2': '#6d3bb5', soft: '#efe4ff', accent: '#ff7eb6',
        ink: '#2b1840', bg1: '#2a1846', bg2: '#6b3a8f',
      },
      wheel: {
        colors: ['#2d2d3a', '#ff7eb6', '#9b5de5', '#ffffff', '#c9a7ff'],
        rim: '#2d2d3a', dots: ['#ff7eb6', '#ffffff'], dark: '#2b1840',
      },
      confetti: ['#9b5de5', '#ff7eb6', '#2d2d3a', '#ffffff', '#c9a7ff'],
      world: {
        landmarks: [{ type: 'castle', side: -1, z: -36, f: 0.78, s: 1.7, wall: '#4b3570', roof: '#2d2d3a', door: '#ff7eb6', sign: 'Castelo da ' + NOME }, { type: 'shop', side: 1, z: -30, f: 0.8, s: 1.6, wall: '#5c3d7a', roof: '#ff7eb6', door: '#2d2d3a', sign: 'Kuromi\'s 5' }],
        sky: ['#1b1035', '#6a3b8e'], fog: '#3c2457', ground: '#3a2556', hills: '#2c1b44',
        light: 0.75, moon: true, stars: true,
        sparkles: ['#ff7eb6', '#c9a7ff', '#ffffff'],
        items: [
          { p: 'pine', o: { leaf: '#5b3a86' }, n: 14, place: 'sides' },
          { p: 'mushroom', o: { cap: '#9b5de5', dots: '#ff7eb6' }, n: 16, place: 'ground', scale: [0.8, 1.6] },
          { p: 'flower', n: 45, place: 'ground', tints: ['#2d2d3a', '#ff7eb6', '#9b5de5'] },
          { p: 'skull', n: 10, place: 'float', tints: ['#ff7eb6', '#ffffff', '#c9a7ff'] },
          { p: 'heart', n: 9, place: 'float', tints: ['#9b5de5', '#ff7eb6', '#2d2d3a'] },
          { p: 'star', n: 12, place: 'float', tints: ['#ffe066', '#ff7eb6', '#c9a7ff'] },
          { p: 'cloud', o: { color: '#5c3d7a' }, n: 6, place: 'sky' },
        ],
      },
      music: {
        bpm: 104, root: 69, spb: 8, lead: 'toy',
        chords: [[0, 3, 7], [8, 12, 15], [3, 7, 10], [7, 11, 14], [0, 3, 7], [8, 12, 15], [7, 11, 14], [0, 3, 7]],
        melody: '12 . 15 . 12 . 7 . | 8 . 12 . 15 . 12 . | 10 . 15 . 19 . 15 . | 14 . 11 . 7 . 11 . | 12 15 19 . 15 . 12 . | 20 . 19 . 15 . 12 . | 19 . 14 . 11 . . . | 12 . 7 . 0 . . .',
      },
      svg: svg(`
        <g stroke="#1b1b24" stroke-width="5" stroke-linejoin="round">
          <path d="M46 84 Q14 40 22 6 Q58 16 84 58 Z" fill="#2d2d3a"/>
          <path d="M154 84 Q186 40 178 6 Q142 16 116 58 Z" fill="#2d2d3a"/>
          <ellipse cx="100" cy="116" rx="84" ry="70" fill="#2d2d3a"/>
          <path d="M38 132 Q38 90 100 90 Q162 90 162 132 Q162 180 100 180 Q38 180 38 132Z" fill="#fff"/>
        </g>
        <ellipse cx="100" cy="62" rx="16" ry="13" fill="#ff7eb6"/>
        <rect x="92" y="68" width="16" height="10" rx="3" fill="#ff7eb6"/>
        <circle cx="94" cy="62" r="4" fill="#2d2d3a"/><circle cx="106" cy="62" r="4" fill="#2d2d3a"/>
        <ellipse cx="78" cy="130" rx="7" ry="9" fill="#1b1b24"/><circle cx="80.5" cy="126" r="2.5" fill="#fff"/>
        <ellipse cx="122" cy="130" rx="7" ry="9" fill="#1b1b24"/><circle cx="124.5" cy="126" r="2.5" fill="#fff"/>
        <ellipse cx="64" cy="148" rx="10" ry="6" fill="#ffc2dc"/>
        <ellipse cx="136" cy="148" rx="10" ry="6" fill="#ffc2dc"/>
        <ellipse cx="100" cy="142" rx="5" ry="3.5" fill="#ff9cc8"/>
        <path d="M86 152 Q100 164 114 152" fill="none" stroke="#1b1b24" stroke-width="3.5" stroke-linecap="round"/>
        <path d="M104 157 L107 164 L110 155" fill="#fff" stroke="#1b1b24" stroke-width="2.5" stroke-linejoin="round"/>
        ${paw('#2d2d3a', '#1b1b24')}`),
      phrases: {
        greet: ['Hmph! Oi, {n}... Sorteia logo essa atividade pra gente se divertir! 😈'],
        idle: [
          'Não é como se eu quisesse te ajudar... mas gira aí! 💜',
          'Eu sou a líder da gangue Kuromi\'s 5, sabia? 😈',
          'Arrasta com força! Nada de rodinha fraca! 💀',
          'A My Melody que me desculpe, mas eu sou mais fofa. 💅',
          'Psiu, {n}... você é minha favorita. Não conta pra ninguém! 🖤',
        ],
        spin: ['Isso! Gira com atitude! 😈', 'Hehehe, que caos delicioso! 💜', 'Vai, vai, VAI! 💀'],
        win: ['Hmph, nada mal: {a}! 😈', 'Ok, ok... {a} até que é legal! 💜', 'A sorte decidiu: {a}! Agora vai lá! 🖤'],
        weak: ['Sério? Isso foi um peteleco! 😤', 'Mais força, {n}! Mostra quem manda! 💪'],
        poke: ['Ei! Não encosta no meu chapéu! 😤', 'Hmph... tá bom, oi. 💜', 'Quer entrar pra minha gangue? 😈'],
      },
    },

    {
      id: 'cinnamoroll',
      name: 'Cinnamoroll',
      emoji: '☁️',
      voice: 780,
      ui: {
        primary: '#4ea4e8', 'primary-2': '#2f83c6', soft: '#e3f3ff', accent: '#ffd6e7',
        ink: '#24435f', bg1: '#bfe3ff', bg2: '#f2faff',
      },
      wheel: {
        colors: ['#8fcbff', '#ffffff', '#cde9ff', '#4ea4e8', '#ffe3ef'],
        rim: '#4ea4e8', dots: ['#ffffff', '#ffd6e7'], dark: '#2a6aa5',
      },
      confetti: ['#8fcbff', '#4ea4e8', '#ffffff', '#ffd6e7', '#fff3a8'],
      world: {
        landmarks: [{ type: 'castle', side: -1, z: -36, f: 0.78, s: 1.6, wall: '#ffffff', roof: '#8fcbff', door: '#4ea4e8', sign: 'Castelo da ' + NOME }, { type: 'shop', side: 1, z: -30, f: 0.8, s: 1.6, wall: '#fffaf2', roof: '#4ea4e8', door: '#e0a96d', sign: 'Café Cinnamon' }],
        sky: ['#8fd0ff', '#eef9ff'], fog: '#e3f4ff', ground: '#f2faff', hills: '#ffffff',
        rainbow: true,
        sparkles: ['#ffffff', '#cde9ff', '#fff3a8'],
        items: [
          { p: 'cloud', n: 22, place: 'ground', scale: [1.4, 2.6] },
          { p: 'cinnaroll', n: 14, place: 'float' },
          { p: 'star', n: 8, place: 'float', tints: ['#fff3a8', '#ffffff'] },
          { p: 'heart', n: 8, place: 'float', tints: ['#8fcbff', '#ffd6e7'] },
          { p: 'cloud', n: 14, place: 'sky' },
        ],
      },
      music: {
        bpm: 120, root: 74, spb: 8, lead: 'bell',
        chords: [I, vi, IV, V, I, IV, V, I],
        melody: '12 . . 16 . . 19 . | 16 . . 14 . . 12 . | 12 . . 14 . . 17 . | 16 . 14 . 11 . . . | 7 . 12 . 16 . 19 . | 21 . 19 . 17 . 14 . | 19 . 16 . 14 . 11 . | 12 . . . . . . .',
      },
      svg: svg(`
        <g stroke="#5b7c99" stroke-width="5" stroke-linejoin="round">
          <ellipse cx="100" cy="108" rx="74" ry="64" fill="#fff"/>
          <path d="M64 56 Q14 52 6 108 Q4 146 30 140 Q44 116 60 90 Z" fill="#fff"/>
          <path d="M136 56 Q186 52 194 108 Q196 146 170 140 Q156 116 140 90 Z" fill="#fff"/>
        </g>
        <ellipse cx="76" cy="112" rx="7.5" ry="9.5" fill="#3d7fd1"/><circle cx="78.5" cy="108" r="2.6" fill="#fff"/>
        <ellipse cx="124" cy="112" rx="7.5" ry="9.5" fill="#3d7fd1"/><circle cx="126.5" cy="108" r="2.6" fill="#fff"/>
        <ellipse cx="62" cy="130" rx="10" ry="6" fill="#ffc2d6"/>
        <ellipse cx="138" cy="130" rx="10" ry="6" fill="#ffc2d6"/>
        <path d="M92 128 Q100 136 108 128" fill="none" stroke="#5b7c99" stroke-width="3.5" stroke-linecap="round"/>
        ${paw('#fff', '#5b7c99')}`),
      phrases: {
        greet: ['Oiii, {n}! Vamos voar até uma atividade divertida? ☁️'],
        idle: [
          'Minhas orelhas são ótimas pra voar! Arrasta a roleta com força! ☁️',
          'Hmm... que cheirinho de canela! 🥐',
          'Lá no Café Cinnamon tudo é mais gostoso! ☕',
          'Bora girar até as nuvens, {n}! 🌤️',
          'Você deixa o céu ainda mais azul, {n}! 💙',
        ],
        spin: ['Wiiii! Tô voando! ☁️', 'Que ventinho bom! 🌀', 'Gira, gira, nuvenzinha! 💙'],
        win: ['Uhuul! Vai ser: {a}! ☁️', 'Que delícia, {n}! A atividade é: {a}! 💙', 'Voando direto pra: {a}! ✨'],
        weak: ['Foi só uma brisinha... mais força! 🌬️', 'Arrasta mais rápido, {n}! ☁️'],
        poke: ['Hihi, minhas orelhinhas! ☁️', 'Quer um cinnamon roll? 🥐', 'Oi, {n}! 💙'],
      },
    },

    {
      id: 'pompompurin',
      name: 'Pompompurin',
      emoji: '🍮',
      voice: 470,
      ui: {
        primary: '#e39a2d', 'primary-2': '#b5721a', soft: '#fff3d1', accent: '#8a5a2b',
        ink: '#5a3a14', bg1: '#ffe08a', bg2: '#fff8e3',
      },
      wheel: {
        colors: ['#ffd84d', '#ffffff', '#f4b860', '#a8672f', '#fff1c2'],
        rim: '#8a5a2b', dots: ['#ffd84d', '#ffffff'], dark: '#7a4a1a',
      },
      confetti: ['#ffd84d', '#a8672f', '#ffffff', '#f4b860', '#ff8a5c'],
      world: {
        landmarks: [{ type: 'castle', side: -1, z: -36, f: 0.78, s: 1.6, wall: '#fff3d1', roof: '#a8672f', door: '#8a5a2b', sign: 'Castelo da ' + NOME }, { type: 'shop', side: 1, z: -30, f: 0.8, s: 1.6, wall: '#fff8e3', roof: '#e39a2d', door: '#8a5a2b', sign: 'Pudim Shop' }],
        sky: ['#ffd36e', '#fff6dc'], fog: '#fff0c8', ground: '#c8e68c', hills: '#b6db78',
        sparkles: ['#ffffff', '#fff1a8', '#ffd84d'],
        items: [
          { p: 'pudding', n: 9, place: 'ground', scale: [1.6, 2.8] },
          { p: 'tree', o: { leaf: '#9fd46b' }, n: 8, place: 'sides' },
          { p: 'flower', n: 60, place: 'ground', tints: ['#ffd84d', '#ffffff', '#ffb35c'] },
          { p: 'pudding', n: 8, place: 'float' },
          { p: 'cookie', n: 12, place: 'float' },
          { p: 'star', n: 6, place: 'float', tints: ['#ffd84d', '#ffffff'] },
          { p: 'cloud', n: 7, place: 'sky' },
        ],
      },
      music: {
        bpm: 88, root: 77, spb: 8, lead: 'musicbox',
        chords: [I, vi, IV, V, I, vi, IV, I],
        melody: '12 . . . 9 . 7 . | 9 . . . 12 . . . | 5 . 9 . 12 . 14 . | 16 . . . 14 . . . | 12 . 16 . 19 . 16 . | 14 . 12 . 9 . . . | 9 . 12 . 14 . 12 . | 12 . . . . . . .',
      },
      svg: svg(`
        <g stroke="#5a3a14" stroke-width="5" stroke-linejoin="round">
          <ellipse cx="100" cy="114" rx="80" ry="64" fill="#ffd95a"/>
          <path d="M30 84 Q8 96 14 140 Q22 156 38 140 Q44 112 46 92 Z" fill="#b5763a"/>
          <path d="M170 84 Q192 96 186 140 Q178 156 162 140 Q156 112 154 92 Z" fill="#b5763a"/>
          <rect x="95" y="28" width="10" height="16" rx="4" fill="#7a4a24"/>
          <path d="M56 62 Q100 20 146 58 Q100 74 56 62 Z" fill="#7a4a24"/>
        </g>
        <ellipse cx="76" cy="116" rx="6.5" ry="8.5" fill="#3a2410"/>
        <ellipse cx="124" cy="116" rx="6.5" ry="8.5" fill="#3a2410"/>
        <ellipse cx="62" cy="136" rx="10" ry="6" fill="#ffb38a" opacity=".75"/>
        <ellipse cx="138" cy="136" rx="10" ry="6" fill="#ffb38a" opacity=".75"/>
        <ellipse cx="100" cy="128" rx="7" ry="5" fill="#5a3a14"/>
        <path d="M90 138 Q100 146 110 138" fill="none" stroke="#5a3a14" stroke-width="3.5" stroke-linecap="round"/>
        ${paw('#ffd95a', '#5a3a14')}`),
      phrases: {
        greet: ['Oiii, {n}! *boceja* Bora sortear uma atividade gostosa? 🍮'],
        idle: [
          'Zzz... ah! Oi, {n}! Eu não tava dormindo, juro! 😴',
          'Pudim é a resposta pra tudo. Mas a roleta também ajuda! 🍮',
          'Arrasta com força, que eu tô com preguiça! 😆',
          'Minha boina é minha marca registrada! 🧢',
          'Um cochilo depois da atividade? Perfeito! 💛',
        ],
        spin: ['Uau, que rápido! 🍮', 'Tô ficando tonto... hihi! 💫', 'Gira igual batedeira! 🌀'],
        win: ['Que delícia! Vai ser: {a}! 🍮', 'Oba, {n}! Escolhido: {a}! 💛', '{a}! E depois... pudim! 🍮'],
        weak: ['Foi devagarzinho igual eu acordando... 😴', 'Mais força, {n}! 💪'],
        poke: ['Hmm? Já é hora do lanche? 🍮', 'Oi, {n}! *boceja* 💛', 'Cuidado com a minha boina! 🧢'],
      },
    },

    {
      id: 'pochacco',
      name: 'Pochacco',
      emoji: '⚽',
      voice: 660,
      ui: {
        primary: '#2f9be0', 'primary-2': '#1f78b8', soft: '#e6f6ff', accent: '#ffd23f',
        ink: '#1d3448', bg1: '#a8e0ff', bg2: '#f0fbff',
      },
      wheel: {
        colors: ['#2f9be0', '#ffffff', '#ffd23f', '#9fdcff', '#222831'],
        rim: '#222831', dots: ['#ffd23f', '#ffffff'], dark: '#1d3448',
      },
      confetti: ['#2f9be0', '#ffd23f', '#ffffff', '#222831', '#9fdcff'],
      world: {
        landmarks: [{ type: 'castle', side: -1, z: -36, f: 0.78, s: 1.6, wall: '#ffffff', roof: '#2f9be0', door: '#222831', sign: 'Castelo da ' + NOME }, { type: 'shop', side: 1, z: -30, f: 0.8, s: 1.6, wall: '#f0fbff', roof: '#ffd23f', door: '#2f9be0', sign: 'Pochacco Sports' }],
        sky: ['#66c4ff', '#ebf8ff'], fog: '#dff3ff', ground: '#8fdc7a', hills: '#74c965',
        sparkles: ['#ffffff', '#ffd23f', '#9fdcff'],
        items: [
          { p: 'tree', o: { leaf: '#62c55a' }, n: 10, place: 'sides' },
          { p: 'flower', n: 50, place: 'ground', tints: ['#ffd23f', '#ffffff', '#2f9be0'] },
          { p: 'ball', n: 14, place: 'float', tints: ['#ffffff', '#ffd23f', '#ff8a3d', '#2f9be0'] },
          { p: 'ball', n: 8, place: 'ground', scale: [0.8, 1.3], tints: ['#ffffff', '#ff8a3d'] },
          { p: 'star', n: 7, place: 'float', tints: ['#ffd23f', '#ffffff'] },
          { p: 'cloud', n: 9, place: 'sky' },
        ],
      },
      music: {
        bpm: 140, root: 70, spb: 8, lead: 'chip',
        chords: [I, vi, IV, V, I, vi, V, I],
        melody: '12 12 . 16 . 19 . 16 | 21 . 19 . 16 . 12 . | 17 17 . 21 . 17 . 12 | 19 . . 14 . 11 . . | 12 12 . 16 . 19 . 24 | 21 . 19 . 16 . 21 . | 19 . 17 . 14 . 11 . | 12 . . . 7 . . .',
      },
      svg: svg(`
        <g stroke="#2b2b2b" stroke-width="5" stroke-linejoin="round">
          <ellipse cx="100" cy="110" rx="76" ry="64" fill="#fff"/>
          <path d="M50 58 Q12 56 14 112 Q20 142 42 126 Q52 96 72 60 Z" fill="#2b2b2b"/>
          <path d="M150 58 Q188 56 186 112 Q180 142 158 126 Q148 96 128 60 Z" fill="#2b2b2b"/>
        </g>
        <ellipse cx="80" cy="112" rx="6" ry="8" fill="#2b2b2b"/>
        <ellipse cx="120" cy="112" rx="6" ry="8" fill="#2b2b2b"/>
        <ellipse cx="66" cy="132" rx="9" ry="5.5" fill="#ffc2c2"/>
        <ellipse cx="134" cy="132" rx="9" ry="5.5" fill="#ffc2c2"/>
        <ellipse cx="100" cy="124" rx="8" ry="5.5" fill="#2b2b2b"/>
        <path d="M90 134 Q100 142 110 134" fill="none" stroke="#2b2b2b" stroke-width="3.5" stroke-linecap="round"/>
        ${paw('#fff', '#2b2b2b')}`),
      phrases: {
        greet: ['Oiii, {n}! Bora sortear uma atividade e se mexer? ⚽'],
        idle: [
          'Gira com força de campeã, {n}! 🏆',
          'Eu adoro esportes... e banana! 🍌',
          'Aquecimento feito? Agora é só girar! 🏃',
          'Time {n} sempre vence! ⚽',
          'Bora, bora! Energia lá em cima! ⚡',
        ],
        spin: ['GOOOOL... quer dizer, GIRA! ⚽', 'Que chute forte! 🏆', 'Velocidade máxima! ⚡'],
        win: ['É campeã! Vai ser: {a}! 🏆', 'Golaço, {n}! Escolhido: {a}! ⚽', 'Bora pra: {a}! ⚡'],
        weak: ['Esse chute foi fraquinho! Mais força! 💪', 'Vamos, {n}! Puxa com tudo! ⚽'],
        poke: ['Toca aqui! ✋', 'Oi, {n}! Quer jogar bola? ⚽', 'Hehe, tô pronto pra correr! 🏃'],
      },
    },

    {
      id: 'keroppi',
      name: 'Keroppi',
      emoji: '🐸',
      voice: 560,
      ui: {
        primary: '#36b552', 'primary-2': '#258c3d', soft: '#e5f9e7', accent: '#ff6b6b',
        ink: '#1f4a2a', bg1: '#b9f0c3', bg2: '#f2fff4',
      },
      wheel: {
        colors: ['#5cc85c', '#ffffff', '#b8f0b0', '#ff6b6b', '#d8f7ff'],
        rim: '#258c3d', dots: ['#ffffff', '#ff6b6b'], dark: '#1f5a2a',
      },
      confetti: ['#5cc85c', '#ff6b6b', '#ffffff', '#8fd3ff', '#ffe066'],
      world: {
        landmarks: [{ type: 'castle', side: -1, z: -38, f: 0.8, s: 1.6, wall: '#e5f9e7', roof: '#36b552', door: '#ff6b6b', sign: 'Castelo da ' + NOME }, { type: 'shop', side: 1, z: -30, f: 0.8, s: 1.6, wall: '#ffffff', roof: '#ff6b6b', door: '#36b552', sign: 'Lago Donut' }],
        sky: ['#8ad8ff', '#ecfcff'], fog: '#e2f7f5', ground: '#93db7c', hills: '#6fc463',
        pond: true,
        sparkles: ['#ffffff', '#b8f0b0', '#8fd3ff'],
        items: [
          { p: 'lilypad', n: 12, place: 'pond' },
          { p: 'frog', n: 6, place: 'ground', scale: [1.2, 1.8] },
          { p: 'tree', o: { leaf: '#5cc85c' }, n: 9, place: 'sides' },
          { p: 'flower', n: 50, place: 'ground', tints: ['#ffffff', '#ffe066', '#ff9cc5'] },
          { p: 'drop', n: 10, place: 'float' },
          { p: 'heart', n: 8, place: 'float', tints: ['#5cc85c', '#ff6b6b'] },
          { p: 'cloud', n: 8, place: 'sky' },
        ],
      },
      music: {
        bpm: 120, root: 72, spb: 8, lead: 'toy',
        chords: [I, IV, V, I, vi, IV, V, I],
        melody: '7 . 7 . 12 . 7 . | 9 . 12 . 17 . 12 . | 11 . 14 . 19 . 14 . | 16 . 12 . 7 . . . | 9 . 12 . 16 . 12 . | 17 . 16 . 12 . 9 . | 14 . 11 . 7 . 11 . | 12 . . . . . . .',
      },
      svg: svg(`
        <g stroke="#1f4a2a" stroke-width="5" stroke-linejoin="round">
          <ellipse cx="100" cy="124" rx="86" ry="58" fill="#5cc85c"/>
          <circle cx="62" cy="66" r="32" fill="#fff"/>
          <circle cx="138" cy="66" r="32" fill="#fff"/>
        </g>
        <circle cx="66" cy="70" r="11" fill="#1f2a22"/><circle cx="69" cy="66" r="3.5" fill="#fff"/>
        <circle cx="134" cy="70" r="11" fill="#1f2a22"/><circle cx="137" cy="66" r="3.5" fill="#fff"/>
        <ellipse cx="44" cy="136" rx="13" ry="8" fill="#ff7b7b"/>
        <ellipse cx="156" cy="136" rx="13" ry="8" fill="#ff7b7b"/>
        <path d="M62 130 Q100 172 138 130 Q100 148 62 130Z" fill="#e5484d" stroke="#1f4a2a" stroke-width="4.5" stroke-linejoin="round"/>
        ${paw('#5cc85c', '#1f4a2a')}`),
      phrases: {
        greet: ['Kero kero! Oiii, {n}! Sorteia uma atividade pra gente pular de alegria! 🐸'],
        idle: [
          'Kero kero! Arrasta com força que nem um pulo de sapo! 🐸',
          'Lá no Lago Donut a diversão nunca acaba! 🍩',
          'Choveu? Melhor ainda pra brincar! 🌧️',
          'Você é a melhor amiga que um sapinho pode ter, {n}! 💚',
          'Pula, pula, pula... e gira! 🐸',
        ],
        spin: ['Kero kero kerooo! 🐸', 'Que pulo giratório! 🌀', 'Segura que lá vem! 💚'],
        win: ['Kero! Vai ser: {a}! 🐸', 'Pulando de alegria, {n}! Escolhido: {a}! 💚', 'Splash! {a}! 💦'],
        weak: ['Foi um pulinho de girino... mais força! 🐸', 'Kero... tenta de novo, {n}! 💪'],
        poke: ['Kero kero! 🐸', 'Oi, {n}! Quer pular comigo? 💚', 'Ribbit! Hihi! 🐸'],
      },
    },
  ];

  /* Falas usadas por todos */
  const common = {
    empty: ['Coloca pelo menos 2 atividades pra gente brincar, {n}! 📝', 'A roleta tá vazia! Adiciona atividades, {n}! ✨'],
    add: ['Oba, mais diversão! ✨', 'Adorei essa ideia! 💕', 'Anotadinho! 📝'],
    edit: ['Prontinho, atualizei! ✏️', 'Ficou ainda melhor! 💖'],
    remove: ['Tchauzinho, atividade! 👋', 'Removido! Bora girar de novo? 🌀'],
    again: ['Bora de novo! Arrasta a roleta! 🌀', 'Mais uma rodada, {n}! 💫'],
    sub: ['Divirta-se muito, {n}! 💖', 'Vai ser incrível, {n}! ✨', 'Aproveita cada segundo, {n}! 🥰'],
    done: ['Tarefa concluída! Você é incrível, {n}! 🏆', 'Uhuul! Mais uma feita! 🎉', 'Arrasou, {n}! Tô orgulhosa de você! 💖', 'Check! Que produtividade fofa! ✅'],
    doneSub: ['Merece um descansinho, {n}! 🥰', 'Uma de cada vez, e olha só você indo longe! ✨', 'Continua assim, {n}! 💪'],
    allDone: ['TODAS as tarefas feitas! Você é demais, {n}! 🏆🎉'],
    todo: ['Bora organizar as tarefas, {n}? Eu comemoro cada uma! ✅', 'Modo tarefas ligado! Uma de cada vez, {n}! 📝'],
    wheel: ['Modo roleta! Arrasta com força, {n}! 🎡'],
    timer: ['Timer ligado! Eu fico de olho no tempo pra você! ⏱️', 'Valendo! Foco total, {n}! 💪'],
    timeup: ['Acabou o tempo, {n}! ⏰', 'Trim trim! O tempo acabou! ⏰'],
  };
  list.forEach((c) => { c.phrases = Object.assign({}, common, c.phrases); });

  window.SANRIO = { NOME, list };
})();
