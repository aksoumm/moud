/* ── MOUD app.js ─────────────────────────────────── */

const MOODS = [
  { label:'rad',   score:5, color:'#ff4b8b', glow:'rgba(255,75,139,.5)' },
  { label:'good',  score:4, color:'#ffbe3d', glow:'rgba(255,190,61,.5)'  },
  { label:'meh',   score:3, color:'#ff9f6b', glow:'rgba(255,159,107,.5)' },
  { label:'bad',   score:2, color:'#5bbde0', glow:'rgba(91,189,224,.5)'  },
  { label:'awful', score:1, color:'#9f70e8', glow:'rgba(159,112,232,.5)' },
];

const DAYS  = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];
const API   = '/api';

let db = { moods: [] };
let calYear, calMonth;

/* ── UTILS ─────────────────────────────────────────── */
const todayStr = () => new Date().toISOString().slice(0,10);
const byLabel  = l => MOODS.find(m => m.label === l);
const byScore  = s => MOODS.find(m => m.score === s);
const entry    = d => db.moods.find(e => e.date === d);

function fmtDate(s) {
  return new Date(s + 'T12:00:00').toLocaleDateString('en-US',
    { weekday:'long', day:'numeric', month:'long', year:'numeric' });
}

function toast(msg) {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.classList.add('show');
  clearTimeout(el._t);
  el._t = setTimeout(() => el.classList.remove('show'), 2000);
}

/* ── CANVAS BACKGROUND ──────────────────────────────── */
function initCanvas() {
  const canvas = document.getElementById('bg-canvas');
  const ctx = canvas.getContext('2d');
  let W, H, stars = [];

  function resize() {
    W = canvas.width  = window.innerWidth;
    H = canvas.height = window.innerHeight;
    stars = Array.from({ length: 60 }, () => ({
      x: Math.random() * W,
      y: Math.random() * H,
      r: Math.random() * 1.4 + .3,
      a: Math.random(),
      da: (Math.random() * .006 + .002) * (Math.random() < .5 ? 1 : -1),
    }));
  }

  function draw() {
    ctx.clearRect(0, 0, W, H);

    // deep gradient
    const g = ctx.createRadialGradient(W*.5, H*.3, 0, W*.5, H*.3, H*.9);
    g.addColorStop(0, 'rgba(40,20,80,.35)');
    g.addColorStop(1, 'rgba(8,6,18,0)');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, W, H);

    // stars
    stars.forEach(s => {
      s.a += s.da;
      if (s.a > 1 || s.a < 0) s.da *= -1;
      ctx.beginPath();
      ctx.arc(s.x, s.y, s.r, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(220,210,255,${s.a * .7})`;
      ctx.fill();
    });

    requestAnimationFrame(draw);
  }

  window.addEventListener('resize', resize);
  resize();
  draw();
}

/* ── BLOB SVG ───────────────────────────────────────── */
// Organic blob shape using cubic bezier curves
function blobPath(cx, cy, rx, ry) {
  // slightly irregular blob
  const kx = rx * .6, ky = ry * .55;
  return `M ${cx},${cy - ry}
    C ${cx + kx},${cy - ry}  ${cx + rx},${cy - ky}  ${cx + rx},${cy}
    C ${cx + rx},${cy + ky}  ${cx + kx*1.1},${cy + ry*.95}  ${cx},${cy + ry}
    C ${cx - kx*1.1},${cy + ry*.95}  ${cx - rx},${cy + ky}  ${cx - rx},${cy}
    C ${cx - rx},${cy - ky}  ${cx - kx},${cy - ry}  ${cx},${cy - ry} Z`;
}

const FACES = {
  rad: (cx, cy, s) => `
    <path d="M${cx-s*.28} ${cy-s*.06} Q${cx} ${cy-s*.22} ${cx+s*.28} ${cy-s*.06}"
      stroke="#1a0a12" stroke-width="${s*.07}" fill="none" stroke-linecap="round"/>
    <path d="M${cx-s*.3} ${cy+s*.12} Q${cx} ${cy+s*.35} ${cx+s*.3} ${cy+s*.12}"
      stroke="#1a0a12" stroke-width="${s*.07}" fill="#1a0a12" stroke-linecap="round"/>`,

  good: (cx, cy, s) => `
    <circle cx="${cx-s*.22}" cy="${cy-s*.08}" r="${s*.065}" fill="#1a0a12"/>
    <circle cx="${cx+s*.22}" cy="${cy-s*.08}" r="${s*.065}" fill="#1a0a12"/>
    <path d="M${cx-s*.28} ${cy+s*.14} Q${cx} ${cy+s*.34} ${cx+s*.28} ${cy+s*.14}"
      stroke="#1a0a12" stroke-width="${s*.07}" fill="none" stroke-linecap="round"/>`,

  meh: (cx, cy, s) => `
    <circle cx="${cx-s*.22}" cy="${cy-s*.06}" r="${s*.065}" fill="#1a0a12"/>
    <circle cx="${cx+s*.22}" cy="${cy-s*.06}" r="${s*.065}" fill="#1a0a12"/>
    <line x1="${cx-s*.25}" y1="${cy+s*.18}" x2="${cx+s*.25}" y2="${cy+s*.18}"
      stroke="#1a0a12" stroke-width="${s*.07}" stroke-linecap="round"/>`,

  bad: (cx, cy, s) => `
    <path d="M${cx-s*.28} ${cy-s*.1} Q${cx-s*.2} ${cy-s*.18} ${cx-s*.12} ${cy-s*.1}"
      stroke="#0d1f2a" stroke-width="${s*.065}" fill="none" stroke-linecap="round"/>
    <path d="M${cx+s*.12} ${cy-s*.1} Q${cx+s*.2} ${cy-s*.18} ${cx+s*.28} ${cy-s*.1}"
      stroke="#0d1f2a" stroke-width="${s*.065}" fill="none" stroke-linecap="round"/>
    <path d="M${cx-s*.26} ${cy+s*.22} Q${cx} ${cy+s*.08} ${cx+s*.26} ${cy+s*.22}"
      stroke="#0d1f2a" stroke-width="${s*.07}" fill="none" stroke-linecap="round"/>`,

  awful: (cx, cy, s) => `
    <line x1="${cx-s*.3}" y1="${cy-s*.18}" x2="${cx-s*.14}" y2="${cy-s*.02}"
      stroke="#1a0a2a" stroke-width="${s*.07}" stroke-linecap="round"/>
    <line x1="${cx-s*.14}" y1="${cy-s*.18}" x2="${cx-s*.3}" y2="${cy-s*.02}"
      stroke="#1a0a2a" stroke-width="${s*.07}" stroke-linecap="round"/>
    <line x1="${cx+s*.14}" y1="${cy-s*.18}" x2="${cx+s*.3}" y2="${cy-s*.02}"
      stroke="#1a0a2a" stroke-width="${s*.07}" stroke-linecap="round"/>
    <line x1="${cx+s*.3}" y1="${cy-s*.18}" x2="${cx+s*.14}" y2="${cy-s*.02}"
      stroke="#1a0a2a" stroke-width="${s*.07}" stroke-linecap="round"/>
    <path d="M${cx-s*.26} ${cy+s*.22} Q${cx} ${cy+s*.08} ${cx+s*.26} ${cy+s*.22}"
      stroke="#1a0a2a" stroke-width="${s*.07}" fill="none" stroke-linecap="round"/>`,
};

function makeBlobSVG(mood, size, color, glow) {
  const cx = size / 2, cy = size / 2;
  const rx = size * .42, ry = size * .44;
  const face = FACES[mood] || FACES.good;
  return `<svg class="blob-fig" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}"
    style="--glow:${glow || 'rgba(255,255,255,.3)'}" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="${blobPath(cx,cy,rx,ry)}" fill="${color}"/>
    ${face(cx, cy, size)}
  </svg>`;
}

function makeEmptyBlobSVG(size, opacity = .07) {
  const cx = size/2, cy = size/2, rx = size*.42, ry = size*.44;
  return `<svg width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" fill="none">
    <path d="${blobPath(cx,cy,rx,ry)}" fill="rgba(255,255,255,${opacity})"/>
  </svg>`;
}

function makeBlobBtn(m, size, selectedLabel) {
  const btn = document.createElement('button');
  btn.className = 'blob-btn' + (selectedLabel === m.label ? ' selected' : '');
  btn.style.setProperty('--glow', m.glow);
  btn.innerHTML = makeBlobSVG(m.label, size, m.color, m.glow)
    + `<span class="blob-lbl">${m.label}</span>`;
  return btn;
}

/* ── DATA ───────────────────────────────────────────── */
async function loadData() {
  try {
    const r = await fetch('./data.json?t=' + Date.now());
    if (r.ok) db = await r.json();
  } catch { db = { moods: [] }; }
}

async function saveMood(date, label) {
  const score = byLabel(label)?.score;
  if (!score) return;
  const idx = db.moods.findIndex(e => e.date === date);
  const obj = { date, mood: score, label };
  if (idx >= 0) db.moods[idx] = obj;
  else { db.moods.push(obj); db.moods.sort((a,b) => a.date.localeCompare(b.date)); }
  try {
    await fetch(API + '/log-mood', {
      method:'POST',
      headers:{'Content-Type':'application/json'},
      body: JSON.stringify(obj),
    });
    toast('Saved ✓');
  } catch {
    localStorage.setItem('moud_pending', JSON.stringify(db));
    toast('Saved locally');
  }
}

/* ── NAVIGATION ─────────────────────────────────────── */
function initNav() {
  document.querySelectorAll('.nav-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const v = btn.dataset.view;
      document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
      document.querySelectorAll('.view').forEach(el => el.classList.remove('active'));
      btn.classList.add('active');
      document.getElementById('view-' + v).classList.add('active');
      if (v === 'calendar') renderCalendar();
      if (v === 'stats')    renderStats();
    });
  });
}

/* ── HOME ───────────────────────────────────────────── */
function renderHome() {
  const t = todayStr();
  document.getElementById('home-date').textContent =
    new Date().toLocaleDateString('en-US', { weekday:'long', day:'numeric', month:'long' });

  const e = entry(t);
  const blobRow   = document.getElementById('blob-row');
  const loggedWrap = document.getElementById('home-today');

  if (e) {
    blobRow.style.display   = 'none';
    loggedWrap.style.display = 'flex';
    const m = byLabel(e.label);
    document.getElementById('today-mood-display').innerHTML =
      makeBlobSVG(m.label, 96, m.color, m.glow)
      + `<span class="blob-lbl" style="font-size:14px">${m.label}</span>`;
    document.getElementById('change-btn').onclick = () => {
      loggedWrap.style.display = 'none';
      blobRow.style.display    = 'flex';
      buildBlobRow(blobRow, 54, e?.label, async (m) => {
        await saveMood(t, m.label);
        renderHome();
      });
    };
  } else {
    loggedWrap.style.display = 'none';
    blobRow.style.display    = 'flex';
    buildBlobRow(blobRow, 54, null, async (m) => {
      await saveMood(t, m.label);
      renderHome();
    });
  }
}

function buildBlobRow(container, size, selectedLabel, onPick) {
  container.innerHTML = '';
  MOODS.forEach(m => {
    const btn = makeBlobBtn(m, size, selectedLabel);
    btn.addEventListener('click', () => onPick(m));
    container.appendChild(btn);
  });
}

/* ── CALENDAR ───────────────────────────────────────── */
function renderCalendar() {
  const now = new Date();
  if (calYear === undefined) { calYear = now.getFullYear(); calMonth = now.getMonth(); }

  document.getElementById('cal-month-label').textContent =
    new Date(calYear, calMonth, 1).toLocaleDateString('en-US', { month:'long', year:'numeric' });

  const firstDow     = new Date(calYear, calMonth, 1).getDay();
  const daysInMonth  = new Date(calYear, calMonth + 1, 0).getDate();
  const t            = todayStr();
  const grid         = document.getElementById('cal-grid');
  grid.innerHTML     = '';

  // empty spacers
  for (let i = 0; i < firstDow; i++) {
    const sp = document.createElement('div');
    sp.className = 'cal-cell spacer';
    grid.appendChild(sp);
  }

  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${calYear}-${String(calMonth+1).padStart(2,'0')}-${String(d).padStart(2,'0')}`;
    const e  = entry(ds);
    const isToday  = ds === t;
    const isFuture = ds > t;

    const cell = document.createElement('div');
    cell.className = 'cal-cell' + (isToday ? ' is-today' : '') + (isFuture ? ' future' : '');

    if (isFuture) {
      cell.innerHTML = makeEmptyBlobSVG(32, .04) + `<span class="cal-num">${d}</span>`;
    } else if (e) {
      const m = byLabel(e.label);
      cell.innerHTML = makeBlobSVG(m.label, 32, m.color, m.glow) + `<span class="cal-num">${d}</span>`;
      cell.addEventListener('click', () => openModal(ds, e));
    } else {
      cell.innerHTML = makeEmptyBlobSVG(32, .07) + `<span class="cal-num">${d}</span>`;
      cell.addEventListener('click', () => openModal(ds, null));
    }

    grid.appendChild(cell);
  }
}

document.getElementById('cal-prev').addEventListener('click', () => {
  calMonth--; if (calMonth < 0) { calMonth = 11; calYear--; }
  renderCalendar();
});
document.getElementById('cal-next').addEventListener('click', () => {
  const n = new Date();
  if (calYear === n.getFullYear() && calMonth === n.getMonth()) return;
  calMonth++; if (calMonth > 11) { calMonth = 0; calYear++; }
  renderCalendar();
});

/* ── MODAL ──────────────────────────────────────────── */
function openModal(dateStr, e) {
  document.getElementById('modal-date').textContent = fmtDate(dateStr);
  document.getElementById('modal').style.display = 'flex';
  buildBlobRow(
    document.getElementById('modal-blob-row'),
    48, e?.label,
    async (m) => {
      await saveMood(dateStr, m.label);
      closeModal();
      renderCalendar();
      renderHome();
    }
  );
}

function closeModal() {
  document.getElementById('modal').style.display = 'none';
}
document.getElementById('modal').addEventListener('click', e => {
  if (e.target === document.getElementById('modal')) closeModal();
});

/* ── STATS ──────────────────────────────────────────── */
function renderStats() {
  const total = db.moods.length;
  document.getElementById('arc-count').textContent = total;

  // counts
  const counts = {};
  MOODS.forEach(m => counts[m.label] = 0);
  db.moods.forEach(e => { if (counts[e.label] !== undefined) counts[e.label]++; });

  drawArc(counts, total);
  drawCountRow(counts);

  document.getElementById('streak-val').textContent = calcStreak();
  document.getElementById('best-day-val').textContent = bestWeekday();

  drawWeekdayBars();
}

function drawArc(counts, total) {
  const svg = document.getElementById('arc-svg');
  svg.innerHTML = '';
  const cx = 110, cy = 105, R = 84, sw = 18;
  const half = Math.PI * R;

  // background track
  const bg = arcPath(cx, cy, R);
  bg.setAttribute('stroke', 'rgba(255,255,255,.05)');
  bg.setAttribute('stroke-width', sw);
  bg.setAttribute('stroke-linecap', 'round');
  svg.appendChild(bg);

  if (!total) return;

  let offset = 0;
  [...MOODS].reverse().forEach(m => {
    const pct = counts[m.label] / total;
    const len = pct * half;
    if (len < 1) return;

    const seg = arcPath(cx, cy, R);
    seg.setAttribute('stroke', m.color);
    seg.setAttribute('stroke-width', sw);
    seg.setAttribute('stroke-linecap', 'round');
    seg.setAttribute('stroke-dasharray', `${half}`);
    seg.setAttribute('stroke-dashoffset', `${half - len}`);
    seg.setAttribute('transform', `rotate(${(offset / half) * 180}, ${cx}, ${cy})`);
    svg.appendChild(seg);
    offset += len;
  });
}

function arcPath(cx, cy, r) {
  const el = document.createElementNS('http://www.w3.org/2000/svg', 'path');
  el.setAttribute('d', `M${cx-r},${cy} A${r},${r} 0 0,1 ${cx+r},${cy}`);
  el.setAttribute('fill', 'none');
  return el;
}

function drawCountRow(counts) {
  const row = document.getElementById('mood-count-row');
  row.innerHTML = '';
  MOODS.forEach(m => {
    const item = document.createElement('div');
    item.className = 'count-item';
    item.innerHTML = makeBlobSVG(m.label, 30, m.color, m.glow)
      + `<span class="count-num" style="color:${m.color}">${counts[m.label]}</span>`
      + `<span class="count-lbl">${m.label}</span>`;
    row.appendChild(item);
  });
}

function calcStreak() {
  if (!db.moods.length) return 0;
  const dates = new Set(db.moods.map(e => e.date));
  let streak = 0, d = new Date();
  if (!dates.has(todayStr())) d.setDate(d.getDate() - 1);
  while (true) {
    const s = d.toISOString().slice(0,10);
    if (!dates.has(s)) break;
    streak++;
    d.setDate(d.getDate() - 1);
  }
  return streak;
}

function bestWeekday() {
  const sums = Array(7).fill(0), counts = Array(7).fill(0);
  db.moods.forEach(e => {
    const dow = new Date(e.date + 'T12:00:00').getDay();
    sums[dow] += e.mood; counts[dow]++;
  });
  let best = -1, bestIdx = -1;
  sums.forEach((s, i) => {
    if (!counts[i]) return;
    const avg = s / counts[i];
    if (avg > best) { best = avg; bestIdx = i; }
  });
  return bestIdx >= 0 ? DAYS[bestIdx] : '—';
}

function drawWeekdayBars() {
  const sums = Array(7).fill(0), counts = Array(7).fill(0);
  db.moods.forEach(e => {
    const dow = new Date(e.date + 'T12:00:00').getDay();
    sums[dow] += e.mood; counts[dow]++;
  });
  const avgs = sums.map((s,i) => counts[i] ? s/counts[i] : 0);

  const container = document.getElementById('weekday-bars');
  container.innerHTML = '';
  DAYS.forEach((day, i) => {
    const pct = avgs[i] / 5;
    const m = byScore(Math.round(avgs[i]));
    const color = m ? m.color : 'rgba(255,255,255,.1)';
    const col = document.createElement('div');
    col.className = 'wb-col';
    col.innerHTML = `
      <div class="wb-track">
        <div class="wb-fill" style="height:${pct*100}%;background:${color}"></div>
      </div>
      <span class="wb-day">${day.slice(0,1)}</span>`;
    container.appendChild(col);
  });
}

/* ── EXPORT ─────────────────────────────────────────── */
document.getElementById('export-json').addEventListener('click', () => {
  dl(new Blob([JSON.stringify(db, null, 2)], {type:'application/json'}), 'moud-data.json');
});
document.getElementById('export-csv').addEventListener('click', () => {
  let csv = 'date,mood_score,mood_label\n';
  db.moods.forEach(e => { csv += `${e.date},${e.mood},${e.label}\n`; });
  dl(new Blob([csv], {type:'text/csv'}), 'moud-data.csv');
});
function dl(blob, name) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob); a.download = name; a.click();
}

/* ── IMPORT DAYLIO ──────────────────────────────────── */
document.getElementById('import-csv').addEventListener('change', async e => {
  const file = e.target.files[0]; if (!file) return;
  const text = await file.text();
  const lines = text.split('\n').filter(Boolean);
  const header = lines[0].split(',');
  const fi = header.indexOf('full_date'), mi = header.indexOf('mood');
  if (fi < 0 || mi < 0) { document.getElementById('import-status').textContent = '⚠️ Invalid CSV'; return; }

  const VALID = new Set(['rad','good','meh','bad','awful']);
  let n = 0;
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(',');
    const date  = cols[fi]?.trim().replace(/"/g,'');
    const label = cols[mi]?.trim().replace(/"/g,'');
    if (!date || !VALID.has(label)) continue;
    const idx = db.moods.findIndex(e => e.date === date);
    const obj = { date, mood: byLabel(label).score, label };
    if (idx >= 0) db.moods[idx] = obj; else db.moods.push(obj);
    n++;
  }
  db.moods.sort((a,b) => a.date.localeCompare(b.date));

  try {
    await fetch(API + '/import-moods', {
      method:'POST', headers:{'Content-Type':'application/json'},
      body: JSON.stringify(db),
    });
  } catch { localStorage.setItem('moud_pending', JSON.stringify(db)); }

  document.getElementById('import-status').textContent = `✅ ${n} entries imported`;
  toast(`${n} entries imported`);
  renderHome();
  renderStats();
});

/* ── INIT ───────────────────────────────────────────── */
async function init() {
  initCanvas();
  initNav();
  await loadData();
  renderHome();
}

init();
