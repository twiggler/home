// Home page: starfield, click-to-start overlay (TIE lasers + audio), and the
// Star Wars-style CV crawl. Loaded as a module, so this runs after the DOM is
// parsed and its top-level scope stays private (no IIFE wrapper needed).

const scroll  = document.getElementById('crawl-scroll');
const overlay = document.getElementById('start-overlay');
const lc      = document.getElementById('laser-canvas');
const music   = document.getElementById('music');
let fired = false;

/* Starfield: draw once at load, no animation loop. */
function drawStarfield() {
  const c = document.getElementById('stars');
  const ctx = c.getContext('2d');
  c.width  = window.innerWidth;
  c.height = window.innerHeight;
  for (let i = 0; i < 220; i++) {
    const x = Math.random() * c.width;
    const y = Math.random() * c.height;
    const r = Math.random() * 1.3 + 0.15;
    const a = (Math.random() * 0.55 + 0.4).toFixed(2);
    ctx.beginPath();
    ctx.arc(x, y, r, 0, 6.2832);
    ctx.fillStyle = `rgba(255,255,255,${a})`;
    ctx.fill();
  }
}

function playTieSound() {
  try {
    const ac = new (window.AudioContext || window.webkitAudioContext)();
    for (const freq of [820, 900]) {
      const osc = ac.createOscillator();
      const gain = ac.createGain();
      const shaper = ac.createWaveShaper();
      const n = 256;
      const curve = new Float32Array(n);
      for (let i = 0; i < n; i++) {
        const x = i * 2 / n - 1;
        curve[i] = (Math.PI + 180) * x / (Math.PI + 180 * Math.abs(x));
      }
      shaper.curve = curve;
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, ac.currentTime);
      osc.frequency.exponentialRampToValueAtTime(freq * 0.17, ac.currentTime + 0.42);
      gain.gain.setValueAtTime(0.45, ac.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, ac.currentTime + 0.48);
      osc.connect(shaper); shaper.connect(gain); gain.connect(ac.destination);
      osc.start(); osc.stop(ac.currentTime + 0.5);
    }
  } catch (e) {}
}

function drawImpact(tx, ty) {
  const ic = document.getElementById('impact-canvas');
  ic.width = window.innerWidth; ic.height = window.innerHeight;
  const ctx = ic.getContext('2d');
  let t0 = null;
  const dur = 420;
  function frame(ts) {
    if (!t0) t0 = ts;
    const p = Math.min(1, (ts - t0) / dur);
    const a = 1 - p;
    ctx.clearRect(0, 0, ic.width, ic.height);
    /* Expanding ring */
    ctx.save();
    ctx.globalAlpha = a * 0.7;
    ctx.strokeStyle = '#00FF41';
    ctx.lineWidth = 2.5;
    ctx.shadowBlur = 14; ctx.shadowColor = '#00FF41';
    ctx.beginPath(); ctx.arc(tx, ty, p * 58, 0, Math.PI * 2); ctx.stroke();
    ctx.restore();
    /* 8 sparks radiating outward */
    for (let i = 0; i < 8; i++) {
      const angle = (i / 8) * Math.PI * 2;
      const r1 = p * 22;
      const r2 = r1 + (16 + (i % 3) * 12) * (1 - p * 0.35);
      ctx.save();
      ctx.globalAlpha = a * 0.95;
      ctx.strokeStyle = '#DFFFDF';
      ctx.lineWidth = 1.8;
      ctx.shadowBlur = 7; ctx.shadowColor = '#00FF41';
      ctx.beginPath();
      ctx.moveTo(tx + Math.cos(angle) * r1, ty + Math.sin(angle) * r1);
      ctx.lineTo(tx + Math.cos(angle) * r2, ty + Math.sin(angle) * r2);
      ctx.stroke();
      ctx.restore();
    }
    if (p < 1) { requestAnimationFrame(frame); }
    else { ctx.clearRect(0, 0, ic.width, ic.height); }
  }
  requestAnimationFrame(frame);
}

/* Twin laser bolts converging on (tx, ty); resolves when the bolts fade out. */
function fireLasers(tx, ty, withSound) {
  return new Promise((resolve) => {
    lc.width  = window.innerWidth;
    lc.height = window.innerHeight;
    const ctx = lc.getContext('2d');
    /* Twin cannon sources: top-left and top-right, like a TIE above the viewer */
    const sources = [
      { x: window.innerWidth * 0.08, y: window.innerHeight + 20 },
      { x: window.innerWidth * 0.92, y: window.innerHeight + 20 }
    ];
    let t0 = null;
    const dur = 520;
    function frame(ts) {
      if (!t0) t0 = ts;
      const p = Math.min(1, (ts - t0) / dur);
      /* Hold full brightness until 60%, then fade out */
      const alpha = p < 0.6 ? 1 : 1 - (p - 0.6) / 0.4;
      ctx.clearRect(0, 0, lc.width, lc.height);
      for (const src of sources) {
        /* Outer glow */
        ctx.save();
        ctx.globalAlpha = alpha * 0.45;
        ctx.shadowBlur  = 28;
        ctx.shadowColor = '#00FF41';
        ctx.strokeStyle = '#00FF41';
        ctx.lineWidth   = 9;
        ctx.beginPath(); ctx.moveTo(src.x, src.y); ctx.lineTo(tx, ty); ctx.stroke();
        /* Bright white core */
        ctx.globalAlpha = alpha;
        ctx.shadowBlur  = 5;
        ctx.shadowColor = '#CCFFCC';
        ctx.strokeStyle = '#DFFFDF';
        ctx.lineWidth   = 2.5;
        ctx.beginPath(); ctx.moveTo(src.x, src.y); ctx.lineTo(tx, ty); ctx.stroke();
        ctx.restore();
      }
      if (p < 1) { requestAnimationFrame(frame); }
      else { ctx.clearRect(0, 0, lc.width, lc.height); resolve(); }
    }
    if (withSound) playTieSound();
    drawImpact(tx, ty);
    requestAnimationFrame(frame);
  });
}

async function begin(e, muted) {
  if (fired) return;
  fired = true;
  if (e && e.target && e.target.classList.contains('begin-btn')) {
    e.target.classList.add('hit');
  }
  const x = (e && e.clientX != null) ? e.clientX : window.innerWidth  / 2;
  const y = (e && e.clientY != null) ? e.clientY : window.innerHeight / 2;
  await fireLasers(x, y, !muted);
  overlay.remove();
  if (!muted) music.play().catch(() => {});
  scroll.classList.add('running');
}

/* Build the crawl from CV data, then refine the animation params. */
async function buildCrawl() {
  let data = [];
  try {
    const res = await fetch('cv-data.json');
    if (res.ok) data = await res.json();
  } catch (_) {}

  if (!Array.isArray(data) || data.length === 0) {
    data = [{
      company: 'Data Not Yet Available',
      details: [],
      bullets: ['Trigger the GitHub Action to sync your CV from Google Docs.']
    }];
  }

  const ROMAN = ['I','II','III','IV','V','VI','VII','VIII','IX','X',
                 'XI','XII','XIII','XIV','XV','XVI','XVII','XVIII','XIX','XX'];

  const esc = (s) => String(s)
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');

  const html = data.map((item, i) => {
    const bullets = (item.bullets || [])
      .map((b) => `<p class="ep-bullet">${esc(b)}</p>`)
      .join('\n');
    const details = (item.details || []).filter(Boolean).join(' \u00B7 ');
    return [
      '<div class="episode">',
      '  <hr class="ep-divider">',
      `  <p class="ep-num">Episode ${ROMAN[i] || String(i + 1)}</p>`,
      `  <h2 class="ep-company">${esc(item.company)}</h2>`,
      details ? `  <p class="ep-details">${esc(details)}</p>` : '',
      bullets,
      '</div>'
    ].filter(Boolean).join('\n');
  }).join('\n');

  scroll.insertAdjacentHTML('beforeend', html);

  /* Refine crawl distance/speed once the real content height is known. The CSS
     fallbacks (var(--crawl-dur,90s)/var(--crawl-end,-4000px)) cover a click that
     starts the animation before this runs. */
  requestAnimationFrame(() => {
    const tiltEl   = scroll.parentElement;        /* .crawl-tilt */
    const tiltH    = tiltEl.offsetHeight;
    const contentH = scroll.scrollHeight;
    const end      = -(tiltH + contentH + 100);   /* px to scroll before loop */
    const dur      = Math.round(Math.abs(end) / 50);   /* 50 px / second */

    scroll.style.setProperty('--crawl-end', `${end}px`);
    scroll.style.setProperty('--crawl-dur', `${dur}s`);
  });
}

/* Wire the start buttons synchronously so an early click is never lost. */
function wireStartButtons() {
  document.getElementById('btn-sound').addEventListener('click', (e) => begin(e, false));
  document.getElementById('btn-muted').addEventListener('click', (e) => begin(e, true));
}

/* ── Init: draw the sky, wire the start buttons, then build the crawl. ── */
drawStarfield();
wireStartButtons();
buildCrawl();
