/* ============================================================
   HEMRAJ PATEL — Portfolio
   Interactions: caustics canvas + depth-banded ocean life,
   page-scaled depth gauge, scroll reveals, counters,
   card glow + tilt, magnetic buttons, mobile menu
   ============================================================ */

document.addEventListener('DOMContentLoaded', () => {
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouch = window.matchMedia('(hover: none) and (pointer: coarse)').matches;

  /* ============ CLEAN URLS ============
     GitHub Pages (and most static hosts) happily serve about.html at
     /about — this just tidies the address bar when someone arrives on
     a .html URL directly, e.g. /portfolio/index.html → /portfolio/ */
  if (location.protocol !== 'file:' && /\.html$/i.test(location.pathname)) {
    const clean = location.pathname.replace(/index\.html$/i, '').replace(/\.html$/i, '');
    history.replaceState(null, '', clean + location.search + location.hash);
  }

  /* ============ LOADER ============ */
  const loader = document.querySelector('.loader');
  if (loader) {
    window.setTimeout(() => loader.classList.add('hidden'), reducedMotion ? 150 : 1250);
  }

  /* ============ DESCENT — mid-water blue deepens to abyss as you scroll ============
     The page lives underwater: it opens at a deep 4m blue (calm, high
     text contrast) and darkens to the 12m abyss at the bottom. */
  const ZONES = [
    // p,    bg top          bg bottom       text-strong    text-soft      caustic rgb      caustic alpha
    [0.00, [ 19, 69, 99], [ 13, 52, 79], [232,244,247], [170,206,219], [111,216,198], 0.12],
    [0.40, [ 11, 46, 71], [  8, 33, 53], [234,245,248], [162,198,213], [105,210,194], 0.11],
    [0.75, [  7, 30, 48], [  5, 20, 34], [236,246,249], [156,192,208], [ 98,198,184], 0.10],
    [1.00, [  5, 20, 34], [  4, 13, 24], [238,247,250], [152,188,205], [ 92,190,178], 0.10]
  ];
  const lerpN = (a, b, t) => a + (b - a) * t;
  const mixC = (c1, c2, t) => [
    Math.round(lerpN(c1[0], c2[0], t)),
    Math.round(lerpN(c1[1], c2[1], t)),
    Math.round(lerpN(c1[2], c2[2], t))
  ];
  const rgbStr = c => `rgb(${c[0]}, ${c[1]}, ${c[2]})`;

  const depth = { caustic: [111, 216, 198], causticA: 0.13, causticMul: 1.05,
    fishBack: [81, 121, 143], fishBelly: [147, 176, 189], fishFin: [69, 110, 134] };

  function applyDepth(p) {
    p = Math.max(0, Math.min(1, p));
    let i = 0;
    while (i < ZONES.length - 1 && p > ZONES[i + 1][0]) i++;
    const a = ZONES[i], b = ZONES[Math.min(i + 1, ZONES.length - 1)];
    const span = (b[0] - a[0]) || 1;
    const t = Math.max(0, Math.min(1, (p - a[0]) / span));

    const bgTop  = mixC(a[1], b[1], t);
    const bgBot  = mixC(a[2], b[2], t);
    const strong = mixC(a[3], b[3], t);
    const soft   = mixC(a[4], b[4], t);

    const root = document.documentElement.style;
    root.setProperty('--bg-top', rgbStr(bgTop));
    root.setProperty('--bg-bottom', rgbStr(bgBot));
    root.setProperty('--text-strong', rgbStr(strong));
    root.setProperty('--text-soft', rgbStr(soft));
    // hairlines derive from the text color so borders stay visible at any depth
    root.setProperty('--line', `rgba(${strong[0]}, ${strong[1]}, ${strong[2]}, 0.17)`);
    root.setProperty('--line-strong', `rgba(${strong[0]}, ${strong[1]}, ${strong[2]}, 0.30)`);
    // tinted-glass panels that follow the water color
    root.setProperty('--panel', `rgba(${bgTop[0]}, ${bgTop[1]}, ${bgTop[2]}, 0.42)`);
    root.setProperty('--panel-2', `rgba(${bgBot[0]}, ${bgBot[1]}, ${bgBot[2]}, 0.36)`);

    depth.caustic = mixC(a[5], b[5], t);
    depth.causticA = lerpN(a[6], b[6], t);
    // fish shading: darker back, lighter belly, both tinted by the water
    depth.fishBack = mixC(bgTop, strong, 0.30);
    depth.fishBelly = mixC(bgTop, strong, 0.62);
    depth.fishFin = mixC(bgTop, strong, 0.24);
    // refracted light is richest in mid-water, dimming toward the abyss
    depth.causticMul = 1.05 - p * 0.25;
  }

  function scrollDepth() {
    const docH = document.documentElement.scrollHeight - window.innerHeight;
    return docH > 0 ? window.scrollY / docH : 0;
  }
  let depthTick = false;
  applyDepth(0);
  window.addEventListener('scroll', () => {
    if (depthTick) return;
    depthTick = true;
    requestAnimationFrame(() => { applyDepth(scrollDepth()); depthTick = false; });
  }, { passive: true });
  window.addEventListener('resize', () => applyDepth(scrollDepth()));

  /* ============ NAVBAR ============ */
  const navbar = document.querySelector('.navbar');
  const onScrollNav = () => navbar && navbar.classList.toggle('scrolled', window.scrollY > 30);
  window.addEventListener('scroll', onScrollNav, { passive: true });
  onScrollNav();

  const menuBtn = document.querySelector('.mobile-menu-btn');
  const navLinks = document.querySelector('.nav-links');
  if (menuBtn && navLinks) {
    menuBtn.addEventListener('click', () => {
      const open = navLinks.classList.toggle('open');
      menuBtn.setAttribute('aria-expanded', String(open));
      document.body.style.overflow = open ? 'hidden' : '';
    });
    navLinks.querySelectorAll('a').forEach(a =>
      a.addEventListener('click', () => {
        navLinks.classList.remove('open');
        document.body.style.overflow = '';
      })
    );
  }

  /* ============ DEPTH GAUGE ============ */
  const gauge = document.createElement('div');
  gauge.className = 'depth-gauge';
  gauge.setAttribute('aria-hidden', 'true');
  gauge.innerHTML =
    '<span>0m</span><div class="gauge-track"><div class="gauge-fill"></div></div><span class="gauge-value">0.0m</span><span class="gauge-max"></span>';
  document.body.appendChild(gauge);
  const gaugeFill = gauge.querySelector('.gauge-fill');
  const gaugeValue = gauge.querySelector('.gauge-value');
  const gaugeMax = gauge.querySelector('.gauge-max');

  // The dive is as deep as the page is long: every viewport of content
  // is ~3 m of water, so longer pages descend further.
  let pageDepthM = 12;
  function computePageDepth() {
    const screens = document.documentElement.scrollHeight / Math.max(1, window.innerHeight);
    pageDepthM = Math.max(6, Math.round(screens * 3));
    gaugeMax.textContent = '↓ ' + pageDepthM + 'm';
  }

  function updateGauge() {
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const p = docHeight > 0 ? Math.min(window.scrollY / docHeight, 1) : 0;
    gaugeFill.style.height = (p * 100).toFixed(1) + '%';
    gaugeValue.textContent = (p * pageDepthM).toFixed(1) + 'm';
  }
  computePageDepth();
  window.addEventListener('scroll', updateGauge, { passive: true });
  window.addEventListener('resize', () => { computePageDepth(); updateGauge(); });
  window.addEventListener('load', () => { computePageDepth(); updateGauge(); });
  updateGauge();

  /* ============ CAUSTICS CANVAS ============ */
  const canvas = document.getElementById('caustics-canvas');
  if (canvas && !reducedMotion) {
    const ctx = canvas.getContext('2d');
    let w, h, points = [];
    let mouse = { x: -9999, y: -9999 };
    const DPR = Math.min(window.devicePixelRatio || 1, 2);

    function resize() {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * DPR;
      canvas.height = h * DPR;
      canvas.style.width = w + 'px';
      canvas.style.height = h + 'px';
      ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
      initPoints();
    }

    function initPoints() {
      points = [];
      const gap = Math.max(70, Math.min(w, h) / 11);
      const cols = Math.ceil(w / gap) + 2;
      const rows = Math.ceil(h / gap) + 2;
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          points.push({
            bx: x * gap - gap / 2,
            by: y * gap - gap / 2,
            x: 0, y: 0,
            phase: Math.random() * Math.PI * 2,
            speed: 0.25 + Math.random() * 0.35,
            amp: gap * (0.22 + Math.random() * 0.18),
            cols, gap
          });
        }
      }
      points.cols = cols;
    }

    window.addEventListener('resize', resize);
    if (!isTouch) {
      window.addEventListener('mousemove', e => { mouse.x = e.clientX; mouse.y = e.clientY; }, { passive: true });
      window.addEventListener('mouseleave', () => { mouse.x = -9999; mouse.y = -9999; });
    }

    /* ---- OCEAN LIFE — the species change as you descend ----
       Three depth bands, each with its own inhabitants:
         0 · Surface waters — the classic water-tinted school, joined
                              by the occasional dolphin
         1 · Open water     — sting rays, moon jellies, sea horses,
                              angelfish, and a passing whale
         2 · The deep       — glowing anglerfish and ribbon-like
                              oarfish
       Scrolling carries you down through the bands. Creatures fade
       out in place as their zone recedes, and the next zone's
       residents fade in right where they are — no swimming in from
       the wings. A click still scatters whatever is nearby. */

    const rgba = (c, a) => 'rgba(' + c[0] + ',' + c[1] + ',' + c[2] + ',' + Math.max(0, a).toFixed(3) + ')';

    /* --- species drawing, all facing +x at the origin, size s --- */

    // The classic portfolio fish — spine-waving, tinted by the water
    // column so the school always matches the depth (original design)
    function fishHalfWidth(u, s) {
      return s * (0.26 * Math.sin(Math.min(1, u * 1.3) * Math.PI) + 0.025);
    }
    function drawFishClassic(f, a) {
      const s = f.size;
      ctx.globalAlpha = a;

      const N = 10;
      const beat = 1 + f.burst * 1.5;
      const sx = [], sy = [];
      for (let i = 0; i <= N; i++) {
        const u = i / N;
        sx.push(s * (0.55 - u * 0.95));
        // the lateral wave: growing toward the tail
        sy.push(Math.sin(f.tail - u * 2.6) * s * 0.13 * beat * u * u);
      }
      const px = sx[N], py = sy[N];    // tail base
      const tipShift = Math.sin(f.tail - 3.1) * s * 0.17 * beat;

      // tail fin: a fan sweeping with the beat
      ctx.fillStyle = 'rgba(' + depth.fishFin.join(', ') + ', 0.85)';
      ctx.beginPath();
      ctx.moveTo(px + s * 0.06, py);
      ctx.quadraticCurveTo(px - s * 0.16, py + tipShift * 0.5 - s * 0.1,
                           px - s * 0.38, py + tipShift - s * 0.26);
      ctx.quadraticCurveTo(px - s * 0.18, py + tipShift,
                           px - s * 0.38, py + tipShift + s * 0.26);
      ctx.quadraticCurveTo(px - s * 0.16, py + tipShift * 0.5 + s * 0.1,
                           px + s * 0.06, py);
      ctx.closePath();
      ctx.fill();

      // pectoral fins: a pair, paddling
      const sweep = Math.sin(f.tail * 1.2 + 1) * 0.3 + f.burst * 0.25;
      for (const side of [-1, 1]) {
        const fy = side * fishHalfWidth(0.22, s) * 0.9;
        ctx.beginPath();
        ctx.moveTo(s * 0.18, fy);
        ctx.quadraticCurveTo(
          s * 0.02, fy + side * s * (0.24 + sweep * 0.1),
          s * (-0.14 - sweep * 0.08), fy + side * s * (0.17 + sweep * 0.05));
        ctx.quadraticCurveTo(s * 0.04, fy + side * s * 0.05, s * 0.18, fy);
        ctx.closePath();
        ctx.fill();
      }

      // body: smooth outline around the waving spine
      const grad = ctx.createLinearGradient(s * 0.55, 0, -s * 0.4, 0);
      grad.addColorStop(0, 'rgb(' + depth.fishBack.join(', ') + ')');
      grad.addColorStop(0.45, 'rgb(' + depth.fishBelly.join(', ') + ')');
      grad.addColorStop(1, 'rgb(' + depth.fishBack.join(', ') + ')');
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.moveTo(sx[0], sy[0]);
      for (let i = 1; i <= N; i++) ctx.lineTo(sx[i], sy[i] - fishHalfWidth(i / N, s));
      for (let i = N; i >= 0; i--) ctx.lineTo(sx[i], sy[i] + fishHalfWidth(i / N, s));
      ctx.closePath();
      ctx.fill();

      // dorsal ridge: a darker stripe following the spine
      ctx.strokeStyle = 'rgba(' + depth.fishBack.join(', ') + ', 0.75)';
      ctx.lineWidth = Math.max(1, s * 0.07);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(sx[1], sy[1]);
      for (let i = 2; i <= N - 1; i++) ctx.lineTo(sx[i], sy[i]);
      ctx.stroke();

      // twin eyes
      const er = Math.max(0.8, s * 0.038);
      ctx.fillStyle = 'rgba(6, 18, 28, ' + (0.9 * a) + ')';
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(s * 0.4, side * s * 0.1, er, 0, Math.PI * 2);
        ctx.fill();
      }

      ctx.globalAlpha = 1;
    }

    // Dolphin — sleek surface companion with the classic curved fin
    function drawDolphin(f, a) {
      const s = f.size;
      const swing = Math.sin(f.tail) * s * 0.07;
      // fluke
      ctx.fillStyle = rgba([88, 120, 142], 0.95 * a);
      ctx.beginPath();
      ctx.moveTo(-s * 0.78, swing * 0.4);
      ctx.quadraticCurveTo(-s * 0.90, -s * 0.10 + swing, -s * 1.02, -s * 0.15 + swing);
      ctx.quadraticCurveTo(-s * 0.88, swing * 0.4, -s * 1.02, s * 0.13 + swing);
      ctx.quadraticCurveTo(-s * 0.90, s * 0.07 + swing, -s * 0.78, swing * 0.4);
      ctx.closePath(); ctx.fill();
      // body
      const g = ctx.createLinearGradient(0, -s * 0.22, 0, s * 0.20);
      g.addColorStop(0, rgba([106, 138, 160], a));
      g.addColorStop(0.55, rgba([132, 162, 180], a));
      g.addColorStop(1, rgba([190, 210, 220], a));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(s * 0.82, -s * 0.01);
      ctx.bezierCurveTo(s * 0.66, -s * 0.10, s * 0.42, -s * 0.20, s * 0.05, -s * 0.21);
      ctx.bezierCurveTo(-s * 0.35, -s * 0.20, -s * 0.65, -s * 0.10, -s * 0.80, swing * 0.3);
      ctx.bezierCurveTo(-s * 0.62, s * 0.06, -s * 0.28, s * 0.15, s * 0.12, s * 0.15);
      ctx.bezierCurveTo(s * 0.5, s * 0.14, s * 0.72, s * 0.06, s * 0.82, -s * 0.01);
      ctx.closePath(); ctx.fill();
      // smile crease along the rostrum
      ctx.strokeStyle = rgba([70, 98, 120], 0.5 * a);
      ctx.lineWidth = Math.max(0.8, s * 0.02);
      ctx.beginPath();
      ctx.moveTo(s * 0.80, s * 0.015);
      ctx.quadraticCurveTo(s * 0.62, s * 0.05, s * 0.46, s * 0.02);
      ctx.stroke();
      // dorsal fin — the classic curved hook
      ctx.fillStyle = rgba([96, 128, 150], a);
      ctx.beginPath();
      ctx.moveTo(s * 0.06, -s * 0.19);
      ctx.quadraticCurveTo(-s * 0.02, -s * 0.42, -s * 0.20, -s * 0.34);
      ctx.quadraticCurveTo(-s * 0.14, -s * 0.22, -s * 0.24, -s * 0.18);
      ctx.closePath(); ctx.fill();
      // pectoral fin
      ctx.save();
      ctx.translate(s * 0.28, s * 0.10);
      ctx.rotate(0.55 + Math.sin(f.tail * 1.1) * 0.12);
      ctx.fillStyle = rgba([88, 120, 142], 0.95 * a);
      ctx.beginPath();
      ctx.ellipse(s * 0.10, 0, s * 0.13, s * 0.045, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      // eye + glint
      ctx.fillStyle = rgba([12, 20, 28], a);
      ctx.beginPath(); ctx.arc(s * 0.56, -s * 0.015, Math.max(1, s * 0.03), 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = rgba([255, 255, 255], 0.8 * a);
      ctx.beginPath(); ctx.arc(s * 0.575, -s * 0.03, Math.max(0.4, s * 0.011), 0, Math.PI * 2); ctx.fill();
    }

    // Sting ray — a kite-shaped disc gliding on rippling wings,
    // trailing a whip tail
    function drawRay(f, a) {
      const s = f.size;
      const wv = Math.sin(f.tail);
      // whip tail — a gentle traveling wave, no seesaw
      ctx.strokeStyle = rgba([96, 128, 148], 0.85 * a);
      ctx.lineWidth = Math.max(1, s * 0.035);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(-s * 0.38, 0);
      ctx.quadraticCurveTo(-s * 0.72, wv * s * 0.04, -s * 1.10, wv * s * 0.06);
      ctx.stroke();
      // disc — both wingtips breathe TOGETHER so the body stays level
      // and the ray reads as a stable glide
      const tip = s * (0.52 + wv * 0.05);
      const g = ctx.createRadialGradient(s * 0.05, 0, s * 0.06, 0, 0, s * 0.62);
      g.addColorStop(0, rgba([150, 178, 192], a));
      g.addColorStop(0.65, rgba([116, 148, 166], a));
      g.addColorStop(1, rgba([88, 118, 138], a));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(s * 0.52, 0);
      ctx.quadraticCurveTo(s * 0.16, -tip * 0.38, -s * 0.06, -tip);
      ctx.quadraticCurveTo(-s * 0.26, -tip * 0.34, -s * 0.38, 0);
      ctx.quadraticCurveTo(-s * 0.26, tip * 0.34, -s * 0.06, tip);
      ctx.quadraticCurveTo(s * 0.16, tip * 0.38, s * 0.52, 0);
      ctx.closePath(); ctx.fill();
      // spine ridge
      ctx.strokeStyle = rgba([76, 104, 124], 0.55 * a);
      ctx.lineWidth = Math.max(0.8, s * 0.025);
      ctx.beginPath();
      ctx.moveTo(s * 0.44, 0);
      ctx.lineTo(-s * 0.34, 0);
      ctx.stroke();
      // twin eyes near the nose
      ctx.fillStyle = rgba([14, 22, 30], a);
      for (const side of [-1, 1]) {
        ctx.beginPath();
        ctx.arc(s * 0.30, side * s * 0.10, Math.max(0.9, s * 0.03), 0, Math.PI * 2);
        ctx.fill();
      }
      // pale spots on the disc
      ctx.fillStyle = rgba([196, 216, 224], 0.30 * a);
      ctx.beginPath(); ctx.arc(-s * 0.02, -s * 0.20, s * 0.035, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(-s * 0.10, s * 0.16, s * 0.030, 0, Math.PI * 2); ctx.fill();
      ctx.beginPath(); ctx.arc(s * 0.12, s * 0.22, s * 0.026, 0, Math.PI * 2); ctx.fill();
    }

    // Sea horse — upright, gently bobbing, dorsal fin fluttering
    function drawSeahorse(f, a) {
      const s = f.size;
      const flutter = Math.sin(f.tail * 3);
      const body = [122, 190, 184], dark = [78, 140, 138];
      ctx.lineCap = 'round';
      // curled tail
      ctx.strokeStyle = rgba(dark, 0.9 * a);
      ctx.lineWidth = Math.max(1.2, s * 0.09);
      ctx.beginPath();
      ctx.moveTo(s * 0.02, s * 0.30);
      ctx.bezierCurveTo(-s * 0.10, s * 0.48, -s * 0.12, s * 0.62, 0, s * 0.66);
      ctx.bezierCurveTo(s * 0.10, s * 0.68, s * 0.12, s * 0.56, s * 0.03, s * 0.54);
      ctx.stroke();
      // body — an S-curve stroked thick
      const g = ctx.createLinearGradient(s * 0.2, 0, -s * 0.2, 0);
      g.addColorStop(0, rgba(body, a));
      g.addColorStop(1, rgba(dark, a));
      ctx.strokeStyle = g;
      ctx.lineWidth = Math.max(2, s * 0.22);
      ctx.beginPath();
      ctx.moveTo(s * 0.06, -s * 0.42);
      ctx.bezierCurveTo(-s * 0.14, -s * 0.30, -s * 0.12, -s * 0.02, s * 0.02, s * 0.06);
      ctx.bezierCurveTo(s * 0.12, s * 0.13, s * 0.08, s * 0.24, s * 0.02, s * 0.30);
      ctx.stroke();
      // head + snout
      ctx.strokeStyle = rgba(body, a);
      ctx.lineWidth = Math.max(1.6, s * 0.15);
      ctx.beginPath();
      ctx.moveTo(s * 0.06, -s * 0.44);
      ctx.quadraticCurveTo(s * 0.14, -s * 0.50, s * 0.16, -s * 0.44);
      ctx.stroke();
      ctx.lineWidth = Math.max(1, s * 0.07);
      ctx.beginPath();
      ctx.moveTo(s * 0.14, -s * 0.46);
      ctx.lineTo(s * 0.30, -s * 0.40);
      ctx.stroke();
      // coronet
      ctx.lineWidth = Math.max(0.8, s * 0.05);
      ctx.beginPath();
      ctx.moveTo(s * 0.04, -s * 0.52);
      ctx.lineTo(s * 0.02, -s * 0.60);
      ctx.stroke();
      // dorsal fin — translucent, fluttering fast
      ctx.fillStyle = rgba([180, 232, 226], (0.40 + flutter * 0.12) * a);
      ctx.beginPath();
      ctx.moveTo(-s * 0.12, -s * 0.16);
      ctx.quadraticCurveTo(-s * (0.30 + flutter * 0.03), -s * 0.02, -s * 0.10, s * 0.06);
      ctx.quadraticCurveTo(-s * 0.16, -s * 0.05, -s * 0.12, -s * 0.16);
      ctx.closePath(); ctx.fill();
      // belly ridges
      ctx.strokeStyle = rgba([226, 246, 243], 0.25 * a);
      ctx.lineWidth = 1;
      for (let i = 0; i < 3; i++) {
        ctx.beginPath();
        ctx.arc(s * 0.02, -s * 0.05 + i * s * 0.11, s * 0.10, -0.7, 0.7);
        ctx.stroke();
      }
      // eye
      ctx.fillStyle = rgba([12, 20, 28], a);
      ctx.beginPath(); ctx.arc(s * 0.10, -s * 0.44, Math.max(0.8, s * 0.035), 0, Math.PI * 2); ctx.fill();
    }

    // Whale — a vast, slow, blunt-browed giant with a pale belly,
    // downturned jaw, blowhole, and broad fluke
    function drawWhale(f, a) {
      const s = f.size;
      const swing = Math.sin(f.tail) * s * 0.06;
      const back = [40, 62, 86];
      // fluke — the broad two-lobed tail
      ctx.fillStyle = rgba(back, 0.95 * a);
      ctx.beginPath();
      ctx.moveTo(-s * 0.90, swing * 0.4);
      ctx.quadraticCurveTo(-s * 1.05, -s * 0.12 + swing, -s * 1.24, -s * 0.20 + swing);
      ctx.quadraticCurveTo(-s * 1.02, swing * 0.5, -s * 1.24, s * 0.17 + swing);
      ctx.quadraticCurveTo(-s * 1.05, s * 0.10 + swing, -s * 0.90, swing * 0.4);
      ctx.closePath(); ctx.fill();
      // body — high blunt brow, long back, narrow tail stock
      const g = ctx.createLinearGradient(0, -s * 0.28, 0, s * 0.24);
      g.addColorStop(0, rgba([56, 80, 106], a));
      g.addColorStop(0.6, rgba(back, a));
      g.addColorStop(1, rgba([50, 72, 96], a));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(s * 0.96, s * 0.10);                                   // tip of the jaw, set low
      ctx.bezierCurveTo(s * 1.00, -s * 0.08, s * 0.82, -s * 0.235, s * 0.55, -s * 0.255); // blunt brow
      ctx.bezierCurveTo(s * 0.15, -s * 0.285, -s * 0.30, -s * 0.21, -s * 0.60, -s * 0.125);
      ctx.bezierCurveTo(-s * 0.80, -s * 0.065, -s * 0.90, -s * 0.02, -s * 0.92, swing * 0.3);
      ctx.bezierCurveTo(-s * 0.86, s * 0.055, -s * 0.55, s * 0.14, -s * 0.15, s * 0.19);
      ctx.bezierCurveTo(s * 0.35, s * 0.24, s * 0.78, s * 0.20, s * 0.96, s * 0.10);
      ctx.closePath(); ctx.fill();
      // pale belly band along the underside — the two-tone that says whale
      ctx.fillStyle = rgba([112, 138, 158], 0.45 * a);
      ctx.beginPath();
      ctx.moveTo(s * 0.94, s * 0.105);
      ctx.bezierCurveTo(s * 0.50, s * 0.215, s * 0.05, s * 0.215, -s * 0.35, s * 0.155);
      ctx.bezierCurveTo(-s * 0.05, s * 0.135, s * 0.45, s * 0.10, s * 0.94, s * 0.105);
      ctx.closePath(); ctx.fill();
      // the long, downturned jaw line
      ctx.strokeStyle = rgba([22, 36, 54], 0.75 * a);
      ctx.lineWidth = Math.max(1, s * 0.016);
      ctx.beginPath();
      ctx.moveTo(s * 0.94, s * 0.095);
      ctx.quadraticCurveTo(s * 0.45, s * 0.19, 0, s * 0.195);
      ctx.stroke();
      // throat grooves under the jaw
      ctx.strokeStyle = rgba([150, 176, 194], 0.18 * a);
      ctx.lineWidth = Math.max(1, s * 0.012);
      for (let i = 1; i <= 3; i++) {
        ctx.beginPath();
        ctx.moveTo(s * (0.84 - i * 0.04), s * (0.10 + i * 0.028));
        ctx.quadraticCurveTo(s * 0.35, s * (0.185 + i * 0.014), s * 0.02, s * (0.19 + i * 0.008));
        ctx.stroke();
      }
      // small dorsal fin, set far back
      ctx.fillStyle = rgba([46, 68, 92], a);
      ctx.beginPath();
      ctx.moveTo(-s * 0.44, -s * 0.155);
      ctx.quadraticCurveTo(-s * 0.52, -s * 0.30, -s * 0.62, -s * 0.235);
      ctx.quadraticCurveTo(-s * 0.56, -s * 0.14, -s * 0.44, -s * 0.155);
      ctx.closePath(); ctx.fill();
      // long pectoral flipper
      ctx.save();
      ctx.translate(s * 0.30, s * 0.15);
      ctx.rotate(0.55 + Math.sin(f.tail * 0.8) * 0.08);
      ctx.fillStyle = rgba([34, 54, 76], 0.95 * a);
      ctx.beginPath();
      ctx.ellipse(s * 0.16, 0, s * 0.20, s * 0.05, 0, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
      // blowhole nick on the brow + a small eye above the jaw hinge
      ctx.strokeStyle = rgba([20, 34, 52], 0.8 * a);
      ctx.lineWidth = Math.max(1, s * 0.018);
      ctx.beginPath();
      ctx.moveTo(s * 0.50, -s * 0.265);
      ctx.lineTo(s * 0.44, -s * 0.27);
      ctx.stroke();
      ctx.fillStyle = rgba([8, 14, 22], a);
      ctx.beginPath(); ctx.arc(s * 0.64, s * 0.055, Math.max(1.2, s * 0.022), 0, Math.PI * 2); ctx.fill();
    }

    // Angelfish — a tall silver disc, dark stripes, trailing fin streamers
    function drawAngelfish(f, a) {
      const s = f.size, sw = Math.sin(f.tail);
      ctx.fillStyle = rgba([176, 208, 214], 0.55 * a);
      ctx.beginPath();
      ctx.moveTo(-s * 0.30, 0);
      ctx.quadraticCurveTo(-s * 0.52, -s * 0.16 + sw * s * 0.05, -s * 0.66, -s * 0.24 + sw * s * 0.08);
      ctx.quadraticCurveTo(-s * 0.50, sw * s * 0.05, -s * 0.66, s * 0.24 + sw * s * 0.08);
      ctx.quadraticCurveTo(-s * 0.52, s * 0.16 + sw * s * 0.05, -s * 0.30, 0);
      ctx.closePath(); ctx.fill();
      // dorsal + ventral streamers
      ctx.strokeStyle = rgba([190, 220, 226], 0.65 * a);
      ctx.lineWidth = Math.max(1, s * 0.045);
      ctx.lineCap = 'round';
      ctx.beginPath();
      ctx.moveTo(s * 0.02, -s * 0.44);
      ctx.quadraticCurveTo(-s * 0.14, -s * 0.76, -s * 0.42, -s * 0.86 + sw * s * 0.06);
      ctx.stroke();
      ctx.beginPath();
      ctx.moveTo(-s * 0.02, s * 0.44);
      ctx.quadraticCurveTo(-s * 0.18, s * 0.78, -s * 0.46, s * 0.86 + sw * s * 0.06);
      ctx.stroke();
      // tall compressed body
      const g = ctx.createLinearGradient(0, -s * 0.55, 0, s * 0.55);
      g.addColorStop(0, rgba([214, 232, 236], a));
      g.addColorStop(0.5, rgba([172, 204, 212], a));
      g.addColorStop(1, rgba([120, 158, 172], a));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(s * 0.46, 0);
      ctx.bezierCurveTo(s * 0.34, -s * 0.34, s * 0.10, -s * 0.56, -s * 0.06, -s * 0.50);
      ctx.bezierCurveTo(-s * 0.26, -s * 0.40, -s * 0.32, -s * 0.14, -s * 0.32, 0);
      ctx.bezierCurveTo(-s * 0.32, s * 0.14, -s * 0.26, s * 0.40, -s * 0.06, s * 0.50);
      ctx.bezierCurveTo(s * 0.10, s * 0.56, s * 0.34, s * 0.34, s * 0.46, 0);
      ctx.closePath(); ctx.fill();
      // vertical stripes, clipped to the body
      ctx.save();
      ctx.clip();
      ctx.fillStyle = rgba([44, 66, 84], 0.55 * a);
      ctx.fillRect(s * 0.10, -s * 0.6, s * 0.09, s * 1.2);
      ctx.fillRect(-s * 0.12, -s * 0.6, s * 0.10, s * 1.2);
      ctx.restore();
      // eye + glint
      ctx.fillStyle = rgba([16, 24, 32], a);
      ctx.beginPath(); ctx.arc(s * 0.30, -s * 0.08, Math.max(1.1, s * 0.045), 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = rgba([255, 255, 255], 0.85 * a);
      ctx.beginPath(); ctx.arc(s * 0.315, -s * 0.095, Math.max(0.5, s * 0.016), 0, Math.PI * 2); ctx.fill();
    }

    // Moon jelly — a translucent pulsing bell with trailing tentacles
    function drawJelly(f, a) {
      const s = f.size;
      const pulse = Math.sin(f.tail);
      const rx = s * (0.55 + pulse * 0.05);
      const ry = s * (0.42 - pulse * 0.045);
      const cb = depth.caustic;
      // tentacles first, so the bell overlaps them
      ctx.strokeStyle = rgba(cb, 0.30 * a);
      ctx.lineWidth = 1;
      for (let i = 0; i < 5; i++) {
        const tx = (i / 4 - 0.5) * rx * 1.5;
        ctx.beginPath();
        ctx.moveTo(tx, ry * 0.45);
        ctx.quadraticCurveTo(
          tx + Math.sin(f.drift + i * 1.7) * s * 0.16, ry + s * 0.45,
          tx + Math.sin(f.drift * 1.3 + i) * s * 0.24, ry + s * (0.8 + (i % 2) * 0.25));
        ctx.stroke();
      }
      // the bell
      const g = ctx.createRadialGradient(0, -ry * 0.3, s * 0.06, 0, 0, rx);
      g.addColorStop(0, rgba([225, 248, 245], 0.34 * a));
      g.addColorStop(0.7, rgba(cb, 0.13 * a));
      g.addColorStop(1, rgba(cb, 0.03 * a));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.ellipse(0, 0, rx, ry, 0, Math.PI, 0);
      ctx.quadraticCurveTo(rx * 0.55, ry * 0.55, 0, ry * 0.5);
      ctx.quadraticCurveTo(-rx * 0.55, ry * 0.55, -rx, 0);
      ctx.closePath(); ctx.fill();
      ctx.strokeStyle = rgba([225, 248, 245], 0.40 * a);
      ctx.lineWidth = 1.2;
      ctx.stroke();
      // the four inner rings that make it a moon jelly
      ctx.fillStyle = rgba([225, 248, 245], 0.22 * a);
      for (let i = 0; i < 4; i++) {
        const ang = (i / 4) * Math.PI * 2 + 0.6;
        ctx.beginPath();
        ctx.ellipse(Math.cos(ang) * rx * 0.22, -ry * 0.18 + Math.sin(ang) * ry * 0.16,
          s * 0.09, s * 0.07, 0, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    // Oarfish — the deep's ribbon-like "sea serpent": a long silver
    // body, a red dorsal fin running its full length, trailing crest
    // rays on the head, and the paddle-tipped pelvic "oars" it is
    // named for
    function drawOarfish(f, a) {
      const s = f.size;                 // half-length: the body spans ~2s
      const t = f.tail;
      const red = [212, 106, 98];
      // spine: a gentle ribbon undulation from nose (+s) to tail (-s)
      const N = 12;
      const xs = [], ys = [];
      for (let i = 0; i <= N; i++) {
        const u = i / N;
        xs.push(s * (1 - u * 2));
        ys.push(Math.sin(t - u * 4.2) * s * 0.06 * (0.3 + u * 0.7));
      }
      // dorsal fin — the full-length red ribbon, rippling as it swims
      ctx.fillStyle = rgba(red, 0.55 * a);
      ctx.beginPath();
      ctx.moveTo(xs[0], ys[0] - s * 0.05);
      for (let i = 1; i <= N; i++) {
        const u = i / N;
        const ripple = Math.sin(t * 2 - u * 9) * s * 0.02;
        ctx.lineTo(xs[i], ys[i] - s * (0.16 - u * 0.06) + ripple);
      }
      for (let i = N; i >= 0; i--) ctx.lineTo(xs[i], ys[i]);
      ctx.closePath(); ctx.fill();
      // body — a long silver ribbon tapering to the tail point
      const g = ctx.createLinearGradient(0, -s * 0.10, 0, s * 0.10);
      g.addColorStop(0, rgba([188, 208, 218], a));
      g.addColorStop(0.5, rgba([158, 182, 196], a));
      g.addColorStop(1, rgba([112, 138, 156], a));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(xs[0] + s * 0.10, ys[0]);
      for (let i = 0; i <= N; i++) {
        const u = i / N;
        ctx.lineTo(xs[i], ys[i] - s * 0.10 * (1 - u * 0.8));
      }
      for (let i = N; i >= 0; i--) {
        const u = i / N;
        ctx.lineTo(xs[i], ys[i] + s * 0.10 * (1 - u * 0.75));
      }
      ctx.closePath(); ctx.fill();
      // silvery midline shimmer
      ctx.strokeStyle = rgba([232, 244, 248], 0.30 * a);
      ctx.lineWidth = Math.max(0.8, s * 0.02);
      ctx.beginPath();
      ctx.moveTo(xs[0], ys[0]);
      for (let i = 1; i <= N; i++) ctx.lineTo(xs[i], ys[i]);
      ctx.stroke();
      // dark flank markings
      ctx.strokeStyle = rgba([64, 88, 106], 0.5 * a);
      ctx.lineWidth = Math.max(0.8, s * 0.015);
      for (let i = 2; i <= N - 2; i += 2) {
        ctx.beginPath();
        ctx.moveTo(xs[i], ys[i] - s * 0.05);
        ctx.lineTo(xs[i] - s * 0.04, ys[i] + s * 0.05);
        ctx.stroke();
      }
      // head crest — long red rays sweeping back from the crown
      ctx.lineCap = 'round';
      ctx.strokeStyle = rgba(red, 0.8 * a);
      ctx.lineWidth = Math.max(0.9, s * 0.022);
      for (let i = 0; i < 3; i++) {
        const sway = Math.sin(t * 1.4 + i) * s * 0.05;
        const tipX = s * (0.52 - i * 0.16);
        const tipY = -s * (0.34 + i * 0.13) + sway;
        ctx.beginPath();
        ctx.moveTo(s * 0.88, -s * 0.08);
        ctx.quadraticCurveTo(s * (0.72 - i * 0.10), -s * (0.30 + i * 0.10) + sway, tipX, tipY);
        ctx.stroke();
        ctx.fillStyle = rgba(red, 0.8 * a);
        ctx.beginPath();
        ctx.arc(tipX, tipY, Math.max(1, s * 0.028), 0, Math.PI * 2);
        ctx.fill();
      }
      // pelvic "oars" — two long filaments ending in little paddles
      for (const k of [0, 1]) {
        const sway = Math.sin(t * 1.1 + k * 2) * s * 0.06;
        const ox = s * (0.10 - k * 0.16), oy = s * (0.55 + k * 0.12);
        ctx.strokeStyle = rgba(red, 0.7 * a);
        ctx.lineWidth = Math.max(0.8, s * 0.018);
        ctx.beginPath();
        ctx.moveTo(s * (0.62 - k * 0.08), s * 0.08);
        ctx.quadraticCurveTo(s * (0.42 - k * 0.10), s * 0.35 + sway, ox, oy + sway);
        ctx.stroke();
        ctx.fillStyle = rgba(red, 0.75 * a);
        ctx.beginPath();
        ctx.ellipse(ox, oy + sway, Math.max(1.2, s * 0.045), Math.max(0.9, s * 0.028), 0.6, 0, Math.PI * 2);
        ctx.fill();
      }
      // large pale eye on the blunt head
      ctx.fillStyle = rgba([232, 244, 248], 0.9 * a);
      ctx.beginPath(); ctx.arc(s * 0.86, ys[0], Math.max(1.6, s * 0.045), 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = rgba([10, 16, 24], a);
      ctx.beginPath(); ctx.arc(s * 0.87, ys[0], Math.max(1, s * 0.028), 0, Math.PI * 2); ctx.fill();
    }

    // Anglerfish — rotund abyss-dweller trailing a bioluminescent lure
    function drawAngler(f, a) {
      const s = f.size, sw = Math.sin(f.tail * 0.7);
      const cb = depth.caustic;
      const flick = Math.sin(f.drift * 2.3) * 0.5 + 0.5;
      // short paddle tail
      ctx.fillStyle = rgba([26, 42, 60], 0.95 * a);
      ctx.beginPath();
      ctx.moveTo(-s * 0.36, 0);
      ctx.quadraticCurveTo(-s * 0.58, -s * 0.20 + sw * s * 0.08, -s * 0.64, sw * s * 0.10);
      ctx.quadraticCurveTo(-s * 0.58, s * 0.20 + sw * s * 0.08, -s * 0.36, 0);
      ctx.closePath(); ctx.fill();
      // dorsal spike
      ctx.fillStyle = rgba([22, 36, 54], 0.9 * a);
      ctx.beginPath();
      ctx.moveTo(-s * 0.02, -s * 0.34);
      ctx.lineTo(-s * 0.14, -s * 0.54);
      ctx.lineTo(-s * 0.24, -s * 0.30);
      ctx.closePath(); ctx.fill();
      // rotund, big-headed body
      const g = ctx.createRadialGradient(s * 0.05, -s * 0.10, s * 0.05, 0, 0, s * 0.55);
      g.addColorStop(0, rgba([46, 66, 90], a));
      g.addColorStop(1, rgba([16, 26, 40], a));
      ctx.fillStyle = g;
      ctx.beginPath();
      ctx.moveTo(s * 0.48, s * 0.06);
      ctx.bezierCurveTo(s * 0.46, -s * 0.30, s * 0.16, -s * 0.44, -s * 0.10, -s * 0.36);
      ctx.bezierCurveTo(-s * 0.34, -s * 0.28, -s * 0.42, -s * 0.10, -s * 0.40, s * 0.02);
      ctx.bezierCurveTo(-s * 0.38, s * 0.22, -s * 0.10, s * 0.36, s * 0.14, s * 0.32);
      ctx.bezierCurveTo(s * 0.34, s * 0.28, s * 0.46, s * 0.20, s * 0.48, s * 0.06);
      ctx.closePath(); ctx.fill();
      // jaw + needle teeth
      ctx.strokeStyle = rgba([8, 14, 22], 0.9 * a);
      ctx.lineWidth = Math.max(1, s * 0.035);
      ctx.beginPath();
      ctx.moveTo(s * 0.46, s * 0.10);
      ctx.quadraticCurveTo(s * 0.22, s * 0.20, s * 0.02, s * 0.16);
      ctx.stroke();
      ctx.fillStyle = rgba([230, 244, 246], 0.85 * a);
      for (let i = 0; i < 4; i++) {
        const tx = s * (0.38 - i * 0.09);
        const ty = s * (0.135 + i * 0.012);
        ctx.beginPath();
        ctx.moveTo(tx, ty);
        ctx.lineTo(tx - s * 0.022, ty + s * 0.055);
        ctx.lineTo(tx - s * 0.044, ty);
        ctx.closePath(); ctx.fill();
      }
      // small pale eye
      ctx.fillStyle = rgba([196, 224, 228], 0.9 * a);
      ctx.beginPath(); ctx.arc(s * 0.26, -s * 0.10, Math.max(1.2, s * 0.05), 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = rgba([6, 10, 16], a);
      ctx.beginPath(); ctx.arc(s * 0.27, -s * 0.10, Math.max(0.7, s * 0.028), 0, Math.PI * 2); ctx.fill();
      // the lure — a curved illicium ending in a glowing esca
      const lx = s * 0.52, ly = -s * 0.52;
      ctx.strokeStyle = rgba([120, 160, 170], 0.7 * a);
      ctx.lineWidth = Math.max(0.8, s * 0.025);
      ctx.beginPath();
      ctx.moveTo(s * 0.16, -s * 0.34);
      ctx.quadraticCurveTo(s * 0.20, -s * 0.72, lx, ly);
      ctx.stroke();
      const glow = 0.55 + flick * 0.45;
      const lr = Math.max(1.6, s * 0.075);
      ctx.save();
      ctx.shadowColor = rgba(cb, 0.95);
      ctx.shadowBlur = 14 * glow;
      ctx.fillStyle = rgba([210, 250, 240], glow * a);
      ctx.beginPath(); ctx.arc(lx, ly, lr, 0, Math.PI * 2); ctx.fill();
      ctx.restore();
      const hg = ctx.createRadialGradient(lx, ly, 0, lx, ly, lr * 6);
      hg.addColorStop(0, rgba(cb, 0.30 * glow * a));
      hg.addColorStop(1, rgba(cb, 0));
      ctx.fillStyle = hg;
      ctx.beginPath(); ctx.arc(lx, ly, lr * 6, 0, Math.PI * 2); ctx.fill();
    }

    const SPECIES = {
      fish:      { size: [14, 34],  speed: 0.40, tailSpeed: 0.13,  draw: drawFishClassic },
      dolphin:   { size: [46, 64],  speed: 0.55, tailSpeed: 0.09,  draw: drawDolphin, calm: true, pitch: 0.09 },
      angelfish: { size: [22, 32],  speed: 0.30, tailSpeed: 0.085, draw: drawAngelfish },
      ray:       { size: [34, 52],  speed: 0.28, tailSpeed: 0.04,  draw: drawRay, calm: true, pitch: 0, bobScale: 0 },
      seahorse:  { size: [24, 34],  speed: 0.05, tailSpeed: 0.30,  draw: drawSeahorse, pitch: 0 },
      jelly:     { size: [18, 34],  speed: 0.20, tailSpeed: 0.035, draw: drawJelly, drifts: true },
      angler:    { size: [30, 46],  speed: 0.14, tailSpeed: 0.05,  draw: drawAngler, calm: true },
      oarfish:   { size: [55, 85],  speed: 0.16, tailSpeed: 0.06,  draw: drawOarfish, calm: true, pitch: 0.02 },
      whale:     { size: [85, 130], speed: 0.22, tailSpeed: 0.045, draw: drawWhale, calm: true, pitch: 0.03 }
    };

    // Exact zone ranges as fractions of the dive:
    //   surface 0–20% · open water 20–67.5% · the deep 67.5–100%
    const BANDS = [
      { from: 0.000, to: 0.200, pool: ['fish', 'fish', 'fish', 'fish', 'dolphin', 'fish'] },
      { from: 0.200, to: 0.675, pool: ['ray', 'jelly', 'seahorse', 'whale', 'jelly', 'angelfish', 'seahorse', 'ray'] },
      { from: 0.675, to: 1.000, pool: ['angler', 'angler', 'oarfish', 'angler', 'oarfish', 'angler'] }
    ];
    // full strength inside the band's range, fading out over a short
    // margin beyond it so neighbouring zones cross-fade at the border
    const BAND_FADE = 0.09;
    function bandWeight(i, p) {
      const b = BANDS[i];
      if (p < b.from) return Math.max(0, 1 - (b.from - p) / BAND_FADE);
      if (p > b.to)   return Math.max(0, 1 - (p - b.to) / BAND_FADE);
      return 1;
    }
    function dominantBand(p) {
      let best = 0, bw = -1;
      for (let i = 0; i < BANDS.length; i++) {
        const wgt = bandWeight(i, p);
        if (wgt > bw) { bw = wgt; best = i; }
      }
      return best;
    }

    const creatures = [];
    const fishBubbles = [];

    function makeCreature(bandIdx, species) {
      const def = SPECIES[species];
      const layer = Math.random();                    // 0 = far, 1 = near
      // bigger individuals tend to swim nearer the viewer
      const size = def.size[0] + (def.size[1] - def.size[0]) * (layer * 0.6 + Math.random() * 0.4);
      const dir = Math.random() < 0.5 ? -1 : 1;
      const f = {
        species, def, band: bandIdx, layer, size, dir,
        x: w * (0.04 + Math.random() * 0.92),
        y: h * (0.10 + Math.random() * 0.78),
        speed: def.speed * (0.65 + layer * 0.55) * (0.8 + Math.random() * 0.4),
        bob: Math.random() * Math.PI * 2,
        bobSpeed: 0.008 + Math.random() * 0.01,
        // bobScale flattens the up-down oscillation for gliders (rays)
        bobAmp: (6 + Math.random() * 10) * (def.bobScale !== undefined ? def.bobScale : 1),
        baseY: 0,
        tail: Math.random() * Math.PI * 2,
        tailSpeed: def.tailSpeed * (0.85 + Math.random() * 0.3),
        drift: Math.random() * Math.PI * 2,
        burst: 0,
        skittish: 0.6 + Math.random() * 0.8,
        fade: 0,
        startle: null
      };
      f.baseY = f.y;
      return f;
    }

    function spawnFor(bandIdx) {
      const pool = BANDS[bandIdx].pool;
      return makeCreature(bandIdx, pool[Math.floor(Math.random() * pool.length)]);
    }

    function ensureCreatures(p) {
      const target = Math.max(6, Math.min(14, Math.round(w / 133)));
      while (creatures.length < target) creatures.push(spawnFor(dominantBand(p)));
      creatures.length = Math.min(creatures.length, target);
    }

    function updateCreatures(p) {
      ensureCreatures(p);
      const dom = dominantBand(p);
      for (const f of creatures) {
        // fade toward this band's presence at the current depth; once a
        // stray has fully faded out it is reborn IN PLACE (well, at a
        // fresh spot on screen) as a local species, fading back in —
        // so the changing of the guard is always visible
        const wgt = bandWeight(f.band, p);
        f.fade += (wgt - f.fade) * 0.05;
        if (wgt <= 0.01 && f.fade < 0.03 && f.band !== dom && Math.random() < 0.25) {
          Object.assign(f, spawnFor(dom));
          continue;
        }

        if (f.startle && --f.startle.delay <= 0) {
          f.burst = Math.max(f.burst, f.startle.burst);
          if (f.startle.dir) f.dir = f.startle.dir;
          f.startle = null;
        }
        f.burst *= 0.955;

        // every creature shies away from the pointer as it sweeps past;
        // the big species drift aside more lazily
        const mdx = f.x - mouse.x, mdy = f.y - mouse.y;
        const md = Math.hypot(mdx, mdy);
        const mR = 110 + f.size * 1.2;
        if (md > 0.001 && md < mR) {
          const push = (1 - md / mR) * (f.def.calm ? 0.5 : 1.2);
          f.x += (mdx / md) * push;
          if (f.def.drifts) f.y -= push * 0.4;
          else f.baseY += (mdy / md) * push;
        }

        if (f.def.drifts) {
          // jellies pulse upward and sway, wrapping top to bottom;
          // a nearby click sends them shooting upward
          f.tail += f.tailSpeed * (1 + f.burst * 2);
          f.drift += 0.012;
          const pulse = (Math.sin(f.tail) + 1) * 0.5;
          f.y -= f.speed * (0.4 + pulse) * (1 + f.burst * 8);
          f.x += Math.sin(f.drift * 0.7) * 0.3;
          if (f.y < -f.size * 2.4) {
            f.y = h + f.size * 2;
            f.x = w * (0.06 + Math.random() * 0.88);
          }
        } else {
          const sp = f.speed * (1 + f.burst * 4);
          f.tail += (f.tailSpeed + sp * 0.04) * (1 + f.burst * 1.6);
          f.bob += f.bobSpeed;
          f.baseY += Math.sin(f.bob * 0.43 + f.drift) * 0.12;  // slow vertical wander
          if (f.baseY < h * 0.08) f.baseY = h * 0.08;
          if (f.baseY > h * 0.90) f.baseY = h * 0.90;
          f.x += f.dir * sp;
          f.y = f.baseY + Math.sin(f.bob) * f.bobAmp;
          // swim clean off one side, return on the other
          const m = f.size * 2.5 + 40;
          if (f.dir > 0 && f.x > w + m) { f.x = -m; f.baseY = h * (0.10 + Math.random() * 0.75); }
          if (f.dir < 0 && f.x < -m)   { f.x = w + m; f.baseY = h * (0.10 + Math.random() * 0.75); }
          // near fish occasionally exhale a bubble
          if (f.layer > 0.55 && f.fade > 0.5 && Math.random() < 0.003 && fishBubbles.length < 20) {
            fishBubbles.push({
              x: f.x + f.dir * f.size * 0.5,
              y: f.y - f.size * 0.1,
              r: 1 + Math.random() * 1.8,
              drift: Math.random() * Math.PI * 2,
              vy: 0.3 + Math.random() * 0.35,
              life: 1
            });
          }
        }
      }
    }

    function drawCreature(f, alphaBase) {
      const a = alphaBase * f.fade;
      if (a <= 0.015) return;
      ctx.save();
      ctx.translate(f.x, f.y);
      if (!f.def.drifts) {
        ctx.scale(f.dir, 1);
        // gentle pitch with the bob; upright species (sea horse) skip it
        const pitch = (f.def.pitch !== undefined) ? f.def.pitch : 0.05;
        if (pitch) ctx.rotate(Math.sin(f.bob) * pitch);
      }
      f.def.draw(f, a);
      ctx.restore();
    }

    // Click (or tap) near the locals and the small ones scatter — the
    // closest bolt first, rim fish react a beat later; jellies shoot
    // upward. The big species (whale, dolphin, ray, anglerfish,
    // oarfish) are unbothered and glide on.
    window.addEventListener('pointerdown', e => {
      const cx = e.clientX, cy = e.clientY, R = 180;
      for (const f of creatures) {
        if (f.def.calm) continue;
        const d = Math.hypot(f.x - cx, f.y - cy);
        if (d < R) {
          const closeness = 1 - d / R;
          f.startle = {
            delay: Math.round((1 - closeness) * 12 + Math.random() * 8),
            dir: f.def.drifts ? 0 : (f.x >= cx ? 1 : -1),
            burst: Math.min(1, closeness * (0.5 + Math.random() * 0.6) * f.skittish)
          };
        }
      }
    }, { passive: true });

    function drawFishBubbles() {
      const cb = depth.caustic;
      for (let i = fishBubbles.length - 1; i >= 0; i--) {
        const bu = fishBubbles[i];
        bu.y -= bu.vy;
        bu.drift += 0.05;
        bu.x += Math.sin(bu.drift) * 0.25;
        bu.r += 0.006;
        bu.life -= 0.007;
        if (bu.life <= 0 || bu.y < -10) { fishBubbles.splice(i, 1); continue; }
        ctx.strokeStyle = 'rgba(' + cb[0] + ', ' + cb[1] + ', ' + cb[2] + ', ' + (0.4 * bu.life).toFixed(3) + ')';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.arc(bu.x, bu.y, bu.r, 0, Math.PI * 2);
        ctx.stroke();
        ctx.fillStyle = 'rgba(240, 250, 252, ' + (0.35 * bu.life).toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(bu.x - bu.r * 0.35, bu.y - bu.r * 0.35, bu.r * 0.22, 0, Math.PI * 2);
        ctx.fill();
      }
    }

    let t = 0;
    function draw() {
      t += 0.008;
      ctx.clearRect(0, 0, w, h);

      // Depth-aware light color
      const cr = depth.caustic;
      const strokeA = depth.causticA * (depth.causticMul || 1);
      const nodeA = strokeA * 0.75;

      // ---- Ocean life: update, then draw the FAR layer (behind the
      // light web). Which species appear depends on the scroll depth.
      const depthP = scrollDepth();
      updateCreatures(depthP);
      drawFishBubbles();
      for (const f of creatures) {
        if (f.layer <= 0.55) drawCreature(f, 0.45 + f.layer * 0.30);
      }

      // Drift each grid point on layered sine waves (water surface)
      for (const p of points) {
        if (typeof p.bx !== 'number') continue;
        let ox = Math.sin(t * p.speed + p.phase + p.by * 0.012) * p.amp;
        let oy = Math.cos(t * p.speed * 0.85 + p.phase + p.bx * 0.010) * p.amp;

        // Ripple away from mouse
        const dx = p.bx - mouse.x, dy = p.by - mouse.y;
        const dist = Math.hypot(dx, dy);
        if (dist < 240) {
          const force = (1 - dist / 240) * 26;
          ox += (dx / (dist || 1)) * force;
          oy += (dy / (dist || 1)) * force;
        }
        p.x = p.bx + ox;
        p.y = p.by + oy;
      }

      // Connect neighbours — the refracted light web on the pool floor
      const cols = points.cols;
      ctx.lineWidth = 1;
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const right = points[i + 1];
        const down = points[i + cols];
        const col = i % cols;

        if (right && col < cols - 1) strokeSeg(p, right);
        if (down) strokeSeg(p, down);
      }

      function strokeSeg(a, b) {
        const midY = (a.y + b.y) / 2;
        const fade = Math.max(0, 1 - midY / (h * 1.15));
        if (fade <= 0.02) return;
        ctx.strokeStyle = 'rgba(' + cr[0] + ', ' + cr[1] + ', ' + cr[2] + ', ' + (strokeA * fade).toFixed(3) + ')';
        ctx.beginPath();
        ctx.moveTo(a.x, a.y);
        const cx = (a.x + b.x) / 2 + Math.sin(t + a.phase) * 6;
        const cy = (a.y + b.y) / 2 + Math.cos(t + b.phase) * 6;
        ctx.quadraticCurveTo(cx, cy, b.x, b.y);
        ctx.stroke();
      }

      // Soft light nodes
      for (const p of points) {
        if (typeof p.x !== 'number') continue;
        const fade = Math.max(0, 1 - p.y / (h * 1.15));
        if (fade <= 0.02) continue;
        ctx.fillStyle = 'rgba(' + cr[0] + ', ' + cr[1] + ', ' + cr[2] + ', ' + (nodeA * fade).toFixed(3) + ')';
        ctx.beginPath();
        ctx.arc(p.x, p.y, 1.2, 0, Math.PI * 2);
        ctx.fill();
      }

      // ---- Ocean life: NEAR layer, sharp and vivid, in front of the web
      for (const f of creatures) {
        if (f.layer > 0.55) drawCreature(f, 0.92);
      }

      requestAnimationFrame(draw);
    }

    resize();
    draw();
  }

  /* ============ SCROLL REVEALS ============ */
  const reveals = document.querySelectorAll('.reveal');
  if (reveals.length) {
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          e.target.classList.add('visible');
          io.unobserve(e.target);
        }
      });
    }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' });
    reveals.forEach(el => io.observe(el));
  }

  // Stagger children
  document.querySelectorAll('.stagger-children').forEach(parent => {
    parent.querySelectorAll('.reveal').forEach((child, i) => {
      child.style.setProperty('--d', (i * 0.09).toFixed(2) + 's');
    });
  });

  /* ============ COUNTERS ============ */
  const counters = document.querySelectorAll('.stat-number[data-target]');
  if (counters.length) {
    const cio = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (!e.isIntersecting) return;
        cio.unobserve(e.target);
        const el = e.target;
        // A suffix like ".5" is treated as part of the number (7 + ".5" -> 7.5)
        const rawSuffix = el.dataset.suffix || '';
        const numericSuffix = /^\.\d+$/.test(rawSuffix);
        const target = parseFloat(el.dataset.target) + (numericSuffix ? parseFloat('0' + rawSuffix) : 0);
        const suffix = numericSuffix ? '' : rawSuffix;
        const decimals = numericSuffix ? 1 : 0;
        const finalText = target.toFixed(decimals) + suffix;
        if (reducedMotion) { el.textContent = finalText; return; }
        const dur = 1600;
        const start = performance.now();
        function tick(now) {
          const p = Math.min((now - start) / dur, 1);
          const eased = 1 - Math.pow(1 - p, 4);
          el.textContent = (target * eased).toFixed(decimals) + suffix;
          if (p < 1) requestAnimationFrame(tick);
          else el.textContent = finalText;
        }
        requestAnimationFrame(tick);
      });
    }, { threshold: 0.4 });
    counters.forEach(el => cio.observe(el));
  }

  /* ============ CARD GLOW (mouse-tracked radial) ============ */
  if (!isTouch) {
    document.querySelectorAll('.card').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        card.style.setProperty('--mx', ((e.clientX - r.left) / r.width * 100).toFixed(1) + '%');
        card.style.setProperty('--my', ((e.clientY - r.top) / r.height * 100).toFixed(1) + '%');
      });
    });
  }

  /* ============ PROJECT CARD TILT ============ */
  if (!isTouch && !reducedMotion) {
    document.querySelectorAll('.project-card').forEach(card => {
      card.addEventListener('mousemove', e => {
        const r = card.getBoundingClientRect();
        const rx = ((e.clientY - r.top) / r.height - 0.5) * -5;
        const ry = ((e.clientX - r.left) / r.width - 0.5) * 5;
        card.style.transform = 'perspective(900px) rotateX(' + rx.toFixed(2) + 'deg) rotateY(' + ry.toFixed(2) + 'deg) translateY(-5px)';
      });
      card.addEventListener('mouseleave', () => { card.style.transform = ''; });
    });
  }

  /* ============ MAGNETIC BUTTONS ============ */
  if (!isTouch && !reducedMotion) {
    document.querySelectorAll('.btn').forEach(btn => {
      btn.addEventListener('mousemove', e => {
        const r = btn.getBoundingClientRect();
        const x = (e.clientX - r.left - r.width / 2) * 0.18;
        const y = (e.clientY - r.top - r.height / 2) * 0.28;
        btn.style.transform = 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px)';
      });
      btn.addEventListener('mouseleave', () => { btn.style.transform = ''; });
    });
  }

  /* ============ MARQUEE (duplicate track for seamless loop) ============ */
  document.querySelectorAll('.marquee-track').forEach(track => {
    track.innerHTML += track.innerHTML;
  });

  /* ============ CONTACT FORM ============ */
  const form = document.getElementById('contact-form');
  if (form) {
    form.addEventListener('submit', e => {
      e.preventDefault();
      const name = encodeURIComponent(form.name.value.trim());
      const subject = encodeURIComponent(form.subject.value.trim() || 'Hello from your portfolio');
      const message = encodeURIComponent(form.message.value.trim());
      const email = encodeURIComponent(form.email.value.trim());
      const body = message + '%0D%0A%0D%0A— ' + name + ' (' + email + ')';
      window.location.href = 'mailto:Hemraj@osiris.cyber.nyu.edu?subject=' + subject + '&body=' + body;
      let note = form.querySelector('.form-note');
      if (!note) {
        note = document.createElement('p');
        note.className = 'form-note';
        form.appendChild(note);
      }
      note.textContent = 'Opening your email client…';
      note.classList.add('success');
    });
  }

  /* ============ CUSTOM CURSOR — air bubble + sinking droplet trail ============ */
  const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if (finePointer && !reducedMotion) {
    document.body.classList.add('custom-cursor-on');

    // The pointer: a single air bubble with a light-refraction highlight
    const bubble = document.createElement('div');
    bubble.className = 'cursor-bubble';
    // The trail: small droplets that fade, shrink, and sink like water
    const trailCanvas = document.createElement('canvas');
    trailCanvas.id = 'cursor-trail-canvas';
    document.body.append(trailCanvas, bubble);

    const tctx = trailCanvas.getContext('2d');
    let tw, th;
    function resizeTrail() {
      tw = trailCanvas.width = window.innerWidth;
      th = trailCanvas.height = window.innerHeight;
    }
    resizeTrail();
    window.addEventListener('resize', resizeTrail);

    let mx = -100, my = -100;   // real mouse
    let bx = -100, by = -100;   // bubble (eased, buoyant)
    let px = -100, py = -100;   // previous mouse, for droplet spacing
    const drops = [];
    let visible = false;

    document.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      if (!visible) { bx = mx; by = my; visible = true; bubble.style.opacity = '1'; }
      // Spawn droplets along the path, spaced by travel distance
      const dist = Math.hypot(mx - px, my - py);
      if (dist > 14) {
        const jitter = 5;
        drops.push({
          x: mx + (Math.random() - 0.5) * jitter,
          y: my + (Math.random() - 0.5) * jitter,
          r: 1.6 + Math.random() * 2.2,
          life: 1,
          vy: 0.15 + Math.random() * 0.3   // droplets sink, like water
        });
        px = mx; py = my;
      }
      if (drops.length > 60) drops.splice(0, drops.length - 60);
    }, { passive: true });

    document.addEventListener('mousedown', () => document.body.classList.add('cursor-down'));
    document.addEventListener('mouseup', () => document.body.classList.remove('cursor-down'));

    document.addEventListener('mouseleave', () => {
      visible = false;
      bubble.style.opacity = '0';
    });
    document.addEventListener('mouseenter', () => { bubble.style.opacity = '1'; });

    // Bubble brightens over interactive elements; hides while typing
    const hoverSel = 'a, button, .btn, .card, .tag, .skill-item, .blog-card, .stat-item, [data-modal], .modal-close';
    const typeSel = 'input, textarea, select';
    document.addEventListener('mouseover', e => {
      if (e.target.closest(typeSel)) document.body.classList.add('cursor-typing');
      else if (e.target.closest(hoverSel)) document.body.classList.add('cursor-hover');
    });
    document.addEventListener('mouseout', e => {
      const related = e.relatedTarget;
      if (e.target.closest(typeSel) && !(related && related.closest && related.closest(typeSel))) {
        document.body.classList.remove('cursor-typing');
      }
      if (e.target.closest(hoverSel) && !(related && related.closest && related.closest(hoverSel))) {
        document.body.classList.remove('cursor-hover');
      }
    });

    // The bubble carries the depth's caustic light, so it dims with the water
    function cursorLoop() {
      // Buoyant tracking — close behind the pointer with a hint of drag
      bx += (mx - bx) * 0.38;
      by += (my - by) * 0.38;
      bubble.style.left = bx + 'px';
      bubble.style.top = by + 'px';

      // Droplet trail — fade, shrink, sink
      tctx.clearRect(0, 0, tw, th);
      const cr = depth.caustic;
      for (let i = drops.length - 1; i >= 0; i--) {
        const d = drops[i];
        d.life -= 0.028;
        d.y += d.vy;
        if (d.life <= 0) { drops.splice(i, 1); continue; }
        tctx.fillStyle = 'rgba(' + cr[0] + ', ' + cr[1] + ', ' + cr[2] + ', ' + (0.45 * d.life).toFixed(3) + ')';
        tctx.beginPath();
        tctx.arc(d.x, d.y, d.r * d.life, 0, Math.PI * 2);
        tctx.fill();
      }
      requestAnimationFrame(cursorLoop);
    }
    cursorLoop();
  }

  /* ============ EXPERIENCE TOAST — home-page hint that the ocean is alive ============ */
  // Home only (the one page whose hero isn't a .page-hero), on every visit
  if (document.querySelector('.hero:not(.page-hero)')) {
    const toast = document.createElement('aside');
    toast.className = 'toast';
    toast.setAttribute('role', 'status');
    toast.innerHTML =
      '<div class="toast-icon" aria-hidden="true">' +
      '<svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">' +
      '<path d="M21 12c-3-4-7-5.2-10.5-3C9 10 8 12 8 12s1 2 2.5 3C14 17.2 18 16 21 12Z" fill="rgba(111,216,198,0.22)" stroke="#6fd8c6" stroke-width="1.5" stroke-linejoin="round"/>' +
      '<path d="M8 12 3.5 8.8v6.4L8 12Z" fill="#6fd8c6" opacity="0.8"/>' +
      '<circle cx="17.2" cy="11.2" r="0.9" fill="#eaf7f4"/>' +
      '<circle cx="20" cy="6.2" r="1" stroke="#6fd8c6" stroke-width="1"/>' +
      '<circle cx="22" cy="3.8" r="0.7" stroke="#6fd8c6" stroke-width="1" opacity="0.6"/>' +
      '</svg>' +
      '</div>' +
      '<div>' +
      '<div class="toast-title">Enhance your experience</div>' +
      '<div class="toast-text">Play with the fishes — and dive deeper to explore the ocean depths, where different creatures live at every level.</div>' +
      '</div>' +
      '<button class="toast-close" aria-label="Dismiss">&#10005;</button>' +
      '<div class="toast-bar" aria-hidden="true"></div>';
    document.body.appendChild(toast);

    const TOAST_LIFE = 9000;
    toast.style.setProperty('--toast-life', TOAST_LIFE + 'ms');
    let toastHideT;
    function hideToast() {
      window.clearTimeout(toastHideT);
      toast.classList.remove('show');
      window.setTimeout(() => toast.remove(), 600);
    }
    window.setTimeout(() => {
      toast.classList.add('show');
      toastHideT = window.setTimeout(hideToast, TOAST_LIFE);
    }, reducedMotion ? 600 : 1800);
    toast.querySelector('.toast-close').addEventListener('click', hideToast);
  }

  /* ============ DETAIL MODALS ============ */
  initModals();
});

/* ==============================================================
   MODAL SYSTEM — opens a detail pop-up for any [data-modal] card
   ============================================================== */
function initModals() {
  const DATA = window.MODAL_DATA || {};

  // Build the modal shell once
  const backdrop = document.createElement('div');
  backdrop.className = 'modal-backdrop';
  backdrop.setAttribute('aria-hidden', 'true');
  backdrop.innerHTML =
    '<div class="modal-panel" role="dialog" aria-modal="true" aria-labelledby="modal-title" tabindex="-1">' +
    '  <button class="modal-close" aria-label="Close details">&#10005;</button>' +
    '  <div class="modal-kicker"></div>' +
    '  <h3 class="modal-title" id="modal-title"></h3>' +
    '  <div class="modal-sub"></div>' +
    '  <div class="modal-body"></div>' +
    '  <div class="modal-tags"></div>' +
    '  <div class="modal-links"></div>' +
    '</div>';
  document.body.appendChild(backdrop);

  const panel = backdrop.querySelector('.modal-panel');
  const closeBtn = backdrop.querySelector('.modal-close');
  const elKicker = backdrop.querySelector('.modal-kicker');
  const elTitle = backdrop.querySelector('.modal-title');
  const elSub = backdrop.querySelector('.modal-sub');
  const elBody = backdrop.querySelector('.modal-body');
  const elTags = backdrop.querySelector('.modal-tags');
  const elLinks = backdrop.querySelector('.modal-links');
  let lastFocused = null;

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  }

  function render(entry) {
    elKicker.textContent = entry.kicker || '';
    elKicker.classList.toggle('gold', !!entry.gold);
    elTitle.textContent = entry.title || '';
    elSub.textContent = entry.sub || '';
    elSub.style.display = entry.sub ? '' : 'none';

    let html = '';
    (entry.sections || []).forEach(sec => {
      if (sec.h) html += '<h4>' + esc(sec.h) + '</h4>';
      (sec.p || []).forEach(p => { html += '<p>' + p + '</p>'; });
      if (sec.li && sec.li.length) {
        html += '<ul>' + sec.li.map(li => '<li>' + li + '</li>').join('') + '</ul>';
      }
    });
    elBody.innerHTML = html;

    elTags.innerHTML = (entry.tags || []).map(t => '<span class="tag">' + esc(t) + '</span>').join('');
    elTags.style.display = (entry.tags || []).length ? '' : 'none';

    elLinks.innerHTML = (entry.links || [])
      .map(l => '<a href="' + l.href + '" target="_blank" rel="noopener">' + esc(l.label) + ' <span aria-hidden="true">&#8599;</span></a>')
      .join('');
    elLinks.style.display = (entry.links || []).length ? '' : 'none';
  }

  function open(key) {
    const entry = DATA[key];
    if (!entry) return;
    lastFocused = document.activeElement;
    render(entry);
    backdrop.classList.add('open');
    backdrop.setAttribute('aria-hidden', 'false');
    document.body.classList.add('modal-open');
    panel.scrollTop = 0;
    panel.focus();
  }

  function close() {
    backdrop.classList.remove('open');
    backdrop.setAttribute('aria-hidden', 'true');
    document.body.classList.remove('modal-open');
    if (lastFocused && lastFocused.focus) lastFocused.focus();
  }

  // Open: any element carrying data-modal (cards, blog links, etc.)
  document.addEventListener('click', e => {
    const trigger = e.target.closest('[data-modal]');
    if (!trigger) return;
    // Let real external links inside a card behave normally
    if (e.target.closest('a[href^="http"], a[href^="mailto"]')) return;
    e.preventDefault();
    open(trigger.getAttribute('data-modal'));
  });

  // Keyboard access on cards
  document.querySelectorAll('[data-modal]').forEach(el => {
    if (el.tagName !== 'A' && el.tagName !== 'BUTTON') {
      el.setAttribute('tabindex', '0');
      el.setAttribute('role', 'button');
      el.addEventListener('keydown', e => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open(el.getAttribute('data-modal'));
        }
      });
    }
  });

  // Close: X button, backdrop click, Escape
  closeBtn.addEventListener('click', close);
  backdrop.addEventListener('click', e => { if (e.target === backdrop) close(); });
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && backdrop.classList.contains('open')) close();
  });
}
