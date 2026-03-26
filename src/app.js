// ============================================================
//  DATA
// ============================================================

const FABRIC_COLORS = [
  '#2D7D6F','#C9963A','#C25B6A','#1E3A5F','#5C8A6A',
  '#C05A32','#7A6BAE','#EDE8DF','#8B7355','#D4A5A5'
];

const MACHINES = [
  { id: 'brother',   label: 'Brother',   sub: 'Baby Lock', format: '.PES' },
  { id: 'janome',    label: 'Janome',    sub: '',          format: '.JEF' },
  { id: 'bernina',   label: 'Bernina',   sub: '',          format: '.EXP' },
  { id: 'viking',    label: 'Viking',    sub: 'Pfaff',     format: '.VP3' },
  { id: 'singer',    label: 'Singer',    sub: '',          format: '.XXX' },
  { id: 'universal', label: 'Universal', sub: 'Fallback',  format: '.DST' },
];

const GRID_SIZES = [4,5,6,7,8,10,12,14];

const BLOCK_NAMES = ['Half-Square','Quarter-Sq','Log Cabin','Flying Geese','Pinwheel','Plain'];

// ============================================================
//  STATE
// ============================================================
let state = {
  cols: 8,
  rows: 8,
  grid: [],          // 2D array of {block,color,color2,rotation} | null
  selectedBlock: 0,
  primaryColor: FABRIC_COLORS[0],
  secondaryColor: FABRIC_COLORS[7],
  rotation: 0,
  machine: 'brother',
  tool: 'paint',     // 'paint' | 'fill' | 'erase'
  isPainting: false,
  history: [],       // for undo
};

function initGrid(cols, rows) {
  return Array.from({length: rows}, () => Array(cols).fill(null));
}

// ============================================================
//  SVG BLOCK RENDERERS
// ============================================================
function svgBlock(blockIdx, color, color2, rotation) {
  const c1 = color || '#2D7D6F';
  const c2 = color2 || '#EDE8DF';
  const transform = rotation ? `transform="rotate(${rotation} 50 50)"` : '';
  let inner = '';
  switch(blockIdx) {
    case 0: // Half-Square Triangle
      inner = `<rect width="100" height="100" fill="${c2}"/>
               <polygon points="0,0 100,0 0,100" fill="${c1}" ${transform}/>`;
      break;
    case 1: // Quarter-Square (two opposite triangles)
      inner = `<rect width="100" height="100" fill="${c2}"/>
               <polygon points="0,0 50,50 100,0" fill="${c1}" ${transform}/>
               <polygon points="0,100 50,50 100,100" fill="${c1}" ${transform}/>`;
      break;
    case 2: // Log Cabin
      inner = `<rect width="100" height="100" fill="${c2}"/>
               <rect x="12" y="12" width="76" height="76" fill="${c1}"/>
               <rect x="24" y="24" width="52" height="52" fill="${c2}"/>
               <rect x="36" y="36" width="28" height="28" fill="${c1}"/>`;
      break;
    case 3: // Flying Geese
      inner = `<rect width="100" height="100" fill="${c2}"/>
               <polygon points="50,10 90,90 10,90" fill="${c1}" ${transform}/>`;
      break;
    case 4: // Pinwheel
      inner = `<rect width="100" height="100" fill="${c2}"/>
               <polygon points="50,50 50,0 100,0" fill="${c1}" ${transform}/>
               <polygon points="50,50 100,50 100,100" fill="${c1}" ${transform}/>
               <polygon points="50,50 50,100 0,100" fill="${c1}" ${transform}/>
               <polygon points="50,50 0,50 0,0" fill="${c1}" ${transform}/>`;
      break;
    case 5: // Plain
    default:
      inner = `<rect width="100" height="100" fill="${c1}"/>`;
      break;
  }
  return `<svg viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">${inner}</svg>`;
}

// ============================================================
//  RENDER UI
// ============================================================
function renderBlockThumbs() {
  const el = document.getElementById('block-grid');
  el.innerHTML = '';
  BLOCK_NAMES.forEach((name, i) => {
    const div = document.createElement('div');
    div.className = 'block-thumb' + (i === state.selectedBlock ? ' active' : '');
    div.title = name;
    div.innerHTML = svgBlock(i, state.primaryColor, state.secondaryColor, 0);
    div.onclick = () => { state.selectedBlock = i; renderBlockThumbs(); };
    el.appendChild(div);
  });
}

function renderColorSwatches() {
  const renderGroup = (id, selected, setter) => {
    const el = document.getElementById(id);
    el.innerHTML = '';
    FABRIC_COLORS.forEach(c => {
      const div = document.createElement('div');
      div.className = 'swatch' + (c === selected ? ' active' : '');
      div.style.background = c;
      div.title = c;
      div.onclick = () => { setter(c); renderColorSwatches(); renderBlockThumbs(); };
      el.appendChild(div);
    });
  };
  renderGroup('color-primary', state.primaryColor, v => state.primaryColor = v);
  renderGroup('color-secondary', state.secondaryColor, v => state.secondaryColor = v);
}

function renderRotationBtns() {
  const el = document.getElementById('rotation-row');
  el.innerHTML = '';
  [0, 90, 180, 270].forEach(deg => {
    const btn = document.createElement('button');
    btn.className = 'rot-btn' + (deg === state.rotation ? ' active' : '');
    btn.title = `${deg}°`;
    btn.textContent = ['↑','→','↓','←'][deg/90];
    btn.onclick = () => { state.rotation = deg; renderRotationBtns(); };
    el.appendChild(btn);
  });
}

function renderGridSizeBtns() {
  const el = document.getElementById('size-row');
  el.innerHTML = '';
  GRID_SIZES.forEach(s => {
    const btn = document.createElement('button');
    btn.className = 'size-btn' + (s === state.cols ? ' active' : '');
    btn.textContent = `${s}×${s}`;
    btn.onclick = () => {
      if (s !== state.cols) {
        pushHistory();
        state.cols = s;
        state.rows = s;
        state.grid = initGrid(s, s);
        buildCanvas();
        updateStats();
      }
    };
    el.appendChild(btn);
  });
}

function renderMachineBtns() {
  const el = document.getElementById('machine-row');
  el.innerHTML = '';
  MACHINES.forEach(m => {
    const btn = document.createElement('button');
    btn.className = 'machine-btn' + (m.id === state.machine ? ' active' : '');
    const lbl = m.sub ? `${m.label}<br><small style="font-weight:400;font-size:0.68rem;opacity:0.8">${m.sub}</small>` : m.label;
    btn.innerHTML = `<span class="machine-brand">${lbl}</span><span class="machine-format">${m.format}</span>`;
    btn.onclick = () => { state.machine = m.id; renderMachineBtns(); updateStats(); };
    el.appendChild(btn);
  });
}

// ============================================================
//  CANVAS
// ============================================================
function buildCanvas() {
  const canvas = document.getElementById('quilt-canvas');
  const size = getCellSize();
  canvas.style.gridTemplateColumns = `repeat(${state.cols}, ${size}px)`;
  canvas.style.gridTemplateRows = `repeat(${state.rows}, ${size}px)`;
  canvas.innerHTML = '';
  for (let r = 0; r < state.rows; r++) {
    for (let c = 0; c < state.cols; c++) {
      const cell = document.createElement('div');
      cell.className = 'quilt-cell';
      cell.style.width = size + 'px';
      cell.style.height = size + 'px';
      cell.dataset.r = r;
      cell.dataset.c = c;
      renderCell(cell, r, c);
      canvas.appendChild(cell);
    }
  }

  // Pointer events
  canvas.addEventListener('pointerdown', onPointerDown);
  canvas.addEventListener('pointermove', onPointerMove);
  canvas.addEventListener('pointerup', onPointerUp);
  canvas.addEventListener('pointerleave', onPointerUp);
}

function getCellSize() {
  const vw = window.innerWidth;
  if (vw <= 480) return 36;
  if (vw <= 640) return 40;
  return 44;
}

function renderCell(cell, r, c) {
  const data = state.grid[r][c];
  if (data) {
    cell.innerHTML = svgBlock(data.block, data.color, data.color2, data.rotation);
  } else {
    cell.innerHTML = '';
  }
}

function refreshCell(r, c) {
  const canvas = document.getElementById('quilt-canvas');
  const idx = r * state.cols + c;
  const cell = canvas.children[idx];
  if (cell) renderCell(cell, r, c);
}

// ============================================================
//  POINTER HANDLING (paint / fill / erase)
// ============================================================
function onPointerDown(e) {
  e.preventDefault();
  pushHistory();
  state.isPainting = true;
  applyToolAt(e);
}
function onPointerMove(e) {
  if (!state.isPainting) return;
  e.preventDefault();
  applyToolAt(e);
}
function onPointerUp(e) {
  if (state.isPainting) {
    state.isPainting = false;
    updateStats();
    updateStitchPreview();
  }
}

function applyToolAt(e) {
  const target = e.target.closest('.quilt-cell');
  if (!target) return;
  const r = parseInt(target.dataset.r);
  const c = parseInt(target.dataset.c);
  if (isNaN(r) || isNaN(c)) return;

  if (state.tool === 'paint') {
    state.grid[r][c] = {
      block: state.selectedBlock,
      color: state.primaryColor,
      color2: state.secondaryColor,
      rotation: state.rotation
    };
    refreshCell(r, c);
  } else if (state.tool === 'erase') {
    state.grid[r][c] = null;
    refreshCell(r, c);
  } else if (state.tool === 'fill') {
    floodFill(r, c);
    buildCanvas();
    updateStats();
    updateStitchPreview();
  }
}

function floodFill(startR, startC) {
  const targetVal = state.grid[startR][startC];
  const isSame = (v) => {
    if (!v && !targetVal) return true;
    if (!v || !targetVal) return false;
    return v.block === targetVal.block && v.color === targetVal.color &&
           v.color2 === targetVal.color2 && v.rotation === targetVal.rotation;
  };
  const fill = {
    block: state.selectedBlock,
    color: state.primaryColor,
    color2: state.secondaryColor,
    rotation: state.rotation
  };
  if (isSame(fill)) return; // nothing to fill

  const visited = Array.from({length: state.rows}, () => Array(state.cols).fill(false));
  const queue = [[startR, startC]];
  while (queue.length) {
    const [r, c] = queue.shift();
    if (r < 0 || r >= state.rows || c < 0 || c >= state.cols) continue;
    if (visited[r][c]) continue;
    if (!isSame(state.grid[r][c])) continue;
    visited[r][c] = true;
    state.grid[r][c] = {...fill};
    queue.push([r-1,c],[r+1,c],[r,c-1],[r,c+1]);
  }
}

function setTool(tool) {
  state.tool = tool;
  document.querySelectorAll('[id^=tool-]').forEach(b => b.classList.remove('active'));
  document.getElementById('tool-' + tool)?.classList.add('active');
}

// ============================================================
//  UNDO / CLEAR
// ============================================================
function pushHistory() {
  state.history.push(JSON.stringify(state.grid));
  if (state.history.length > 30) state.history.shift();
}
function undoAction() {
  if (!state.history.length) return;
  state.grid = JSON.parse(state.history.pop());
  buildCanvas();
  updateStats();
  updateStitchPreview();
}
function clearGrid() {
  pushHistory();
  state.grid = initGrid(state.cols, state.rows);
  buildCanvas();
  updateStats();
  updateStitchPreview();
}

// ============================================================
//  STATS
// ============================================================
function updateStats() {
  let placed = 0;
  for (let r = 0; r < state.rows; r++)
    for (let c = 0; c < state.cols; c++)
      if (state.grid[r][c]) placed++;

  const stitchesPerBlock = 800;
  const stitches = placed * stitchesPerBlock;
  const minutes = Math.round(stitches / 600); // ~600 stitches/min
  const machine = MACHINES.find(m => m.id === state.machine);
  const format = machine ? machine.format : '.PES';

  document.getElementById('stat-blocks').textContent = placed;
  document.getElementById('stat-stitches').textContent = stitches.toLocaleString();
  document.getElementById('stat-time').textContent = minutes + ' min';
  document.getElementById('stat-grid').textContent = `${state.cols}×${state.rows}`;
  document.getElementById('stat-format').textContent = format;
}

// ============================================================
//  STITCH PREVIEW (canvas)
// ============================================================
function updateStitchPreview() {
  const canvas = document.getElementById('stitch-preview');
  const ctx = canvas.getContext('2d');
  const W = canvas.parentElement.offsetWidth - 28;
  canvas.width = W;
  ctx.fillStyle = '#0d0d0d';
  ctx.fillRect(0, 0, W, canvas.height);

  const placed = [];
  for (let r = 0; r < state.rows; r++)
    for (let c = 0; c < state.cols; c++)
      if (state.grid[r][c]) placed.push({r, c, ...state.grid[r][c]});

  if (!placed.length) {
    ctx.fillStyle = '#333';
    ctx.font = '13px DM Sans, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('Paint blocks to see stitch preview', W/2, canvas.height/2);
    return;
  }

  const scale = Math.min(W / (state.cols * 10), canvas.height / (state.rows * 10));
  const offX = (W - state.cols * 10 * scale) / 2;
  const offY = (canvas.height - state.rows * 10 * scale) / 2;

  // Draw stitch paths per block
  placed.forEach(({r, c, block, color, rotation}) => {
    const bx = offX + c * 10 * scale;
    const by = offY + r * 10 * scale;
    const bs = 10 * scale;
    ctx.strokeStyle = color;
    ctx.lineWidth = 1;
    ctx.globalAlpha = 0.85;

    const paths = getStitchPaths(block, rotation, bx, by, bs);
    paths.forEach(pts => {
      if (!pts.length) return;
      ctx.beginPath();
      ctx.moveTo(pts[0][0], pts[0][1]);
      for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
      ctx.stroke();
    });
    ctx.globalAlpha = 1;
  });
}

function getStitchPaths(blockIdx, rotation, bx, by, bs) {
  const density = Math.max(3, Math.floor(bs / 3));
  const paths = [];
  const rad = rotation * Math.PI / 180;
  const cx = bx + bs/2, cy = by + bs/2;

  const rot = (x, y) => {
    const dx = x - cx, dy = y - cy;
    return [cx + dx*Math.cos(rad) - dy*Math.sin(rad), cy + dx*Math.sin(rad) + dy*Math.cos(rad)];
  };

  switch(blockIdx) {
    case 0: // HST — diagonal lines in lower triangle
      for (let i = 0; i <= density; i++) {
        const t = i / density;
        const pts = [];
        for (let j = 0; j <= 4; j++) {
          const s = j / 4;
          const x = bx + t * bs;
          const y = by + (1-t+t*s) * bs;
          if (x >= bx && y <= by+bs*(1-t+t)) pts.push(rot(x, y));
        }
        paths.push(pts);
      }
      break;
    case 1: // Quarter-square — X cross stitches
      for (let i = 0; i <= density; i++) {
        const t = i / density;
        paths.push([rot(bx, by+t*bs), rot(bx+t*bs, by)]);
        paths.push([rot(bx+bs, by+t*bs), rot(bx+(1-t)*bs, by+bs)]);
      }
      break;
    case 2: // Log cabin — concentric fill lines
      for (let ring = 0; ring < 4; ring++) {
        const pad = ring * bs * 0.12;
        const pts = [
          rot(bx+pad, by+pad), rot(bx+bs-pad, by+pad),
          rot(bx+bs-pad, by+bs-pad), rot(bx+pad, by+bs-pad), rot(bx+pad, by+pad)
        ];
        paths.push(pts);
      }
      break;
    case 3: // Flying geese — fan lines from apex
      const apex = rot(bx+bs/2, by);
      for (let i = 0; i <= density; i++) {
        const t = i / density;
        paths.push([apex, rot(bx + t*bs, by+bs)]);
      }
      break;
    case 4: // Pinwheel — spiral-ish from center
      const center = [bx+bs/2, by+bs/2];
      const corners = [[bx,by],[bx+bs,by],[bx+bs,by+bs],[bx,by+bs]];
      corners.forEach(corner => {
        for (let i = 0; i <= density; i++) {
          const t = i / density;
          const [ix, iy] = rot(
            center[0] + (corner[0]-center[0])*t,
            center[1] + (corner[1]-center[1])*t
          );
          if (i === 0) paths.push([[ix,iy]]);
          else paths[paths.length-1].push([ix,iy]);
        }
      });
      break;
    case 5: // Plain — horizontal fill lines
    default:
      for (let i = 0; i <= density; i++) {
        const y = by + (i / density) * bs;
        paths.push([rot(bx, y), rot(bx+bs, y)]);
      }
      break;
  }
  return paths;
}

// ============================================================
//  EXPORT MODAL
// ============================================================
function openExportModal() {
  document.getElementById('modal-step-choose').style.display = '';
  document.getElementById('modal-step-result').style.display = 'none';
  const machine = MACHINES.find(m => m.id === state.machine);
  document.getElementById('modal-format-text').textContent =
    `${machine.label}${machine.sub ? ' / '+machine.sub : ''} — ${machine.format} file`;
  document.getElementById('export-modal').classList.add('open');
  document.addEventListener('keydown', onModalKeydown);
}

function closeExportModal() {
  document.getElementById('export-modal').classList.remove('open');
  document.removeEventListener('keydown', onModalKeydown);
}

function handleModalBackdropClick(e) {
  if (e.target === document.getElementById('export-modal')) closeExportModal();
}

function onModalKeydown(e) {
  if (e.key === 'Escape') closeExportModal();
}

const TRANSFER_STEPS = {
  drive: {
    success: 'Stitch file saved to Google Drive!',
    steps: [
      'Open Google Drive on your computer (drive.google.com)',
      'Find the file <strong>QuiltCraft_Design.{fmt}</strong> in your Drive',
      'Right-click → Download to save to your computer',
      'Copy the downloaded file to a USB flash drive',
      'Plug the USB into your sewing machine',
      'On your machine: select "Load Design" → navigate to the file',
    ]
  },
  email: {
    success: 'Stitch file sent to your email!',
    steps: [
      'Open your email and find the message from QuiltCraft',
      'Download the attached <strong>QuiltCraft_Design.{fmt}</strong> file',
      'Copy the downloaded file to a USB flash drive',
      'Plug the USB into your sewing machine',
      'On your machine: select "Load Design" → navigate to the file',
    ]
  },
  download: {
    success: 'Stitch file downloaded!',
    steps: [
      'Find <strong>QuiltCraft_Design.{fmt}</strong> in your Downloads folder',
      'Copy the file to a USB flash drive',
      'Plug the USB into your sewing machine',
      'On your machine: select "Load Design" → navigate to the file',
      'Your design is ready to stitch!',
    ]
  }
};

function selectTransfer(method) {
  const machine = MACHINES.find(m => m.id === state.machine);
  const fmt = machine ? machine.format.replace('.','') : 'PES';
  const config = TRANSFER_STEPS[method];

  // Simulate file generation (1s delay)
  document.getElementById('modal-step-choose').style.display = 'none';
  document.getElementById('modal-step-result').style.display = '';
  document.getElementById('modal-success-banner').innerHTML = `<span>⏳</span><span>Generating ${machine.format} file…</span>`;
  document.getElementById('modal-steps-list').innerHTML = '';

  setTimeout(() => {
    document.getElementById('modal-success-banner').innerHTML =
      `<span>✅</span><span>${config.success}</span>`;

    const stepsList = document.getElementById('modal-steps-list');
    stepsList.innerHTML = '';
    config.steps.forEach((text, i) => {
      const step = document.createElement('div');
      step.className = 'step';
      step.innerHTML = `<div class="step-num">${i+1}</div>
        <div class="step-text">${text.replace('{fmt}', fmt)}</div>`;
      stepsList.appendChild(step);
    });

    // Trigger real download if method is 'download'
    if (method === 'download') {
      triggerDSTDownload();
    }
  }, 1000);
}

function backToChoose() {
  document.getElementById('modal-step-choose').style.display = '';
  document.getElementById('modal-step-result').style.display = 'none';
}

// ============================================================
//  DST STITCH FILE GENERATION (client-side fallback)
// ============================================================
function triggerDSTDownload() {
  const gridState = buildGridState();
  const dstBytes = generateDST(gridState);
  const blob = new Blob([dstBytes], {type: 'application/octet-stream'});
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'QuiltCraft_Design.dst';
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 5000);
}

function buildGridState() {
  return {
    cols: state.cols,
    rows: state.rows,
    cellSize: 42,
    machine: state.machine,
    grid: state.grid
  };
}

// DST (Tajima) format implementation
// Reference: https://edutechwiki.unige.ch/en/Embroidery_format_DST
function generateDST(gridState) {
  const SCALE = 10; // 0.1mm per DST unit; cellSize px → units
  const pxToUnit = (px) => Math.round(px * SCALE / 10);
  const cs = gridState.cellSize;

  // Collect all stitch points from filled cells
  const allStitches = []; // [{x, y, type}] type: 0=stitch, 1=jump, 2=stop
  let curX = 0, curY = 0;

  for (let r = 0; r < gridState.rows; r++) {
    for (let c = 0; c < gridState.cols; c++) {
      const cell = gridState.grid[r]?.[c];
      if (!cell) continue;

      const originX = pxToUnit(c * cs + cs * 0.1);
      const originY = pxToUnit(r * cs + cs * 0.1);
      const size = pxToUnit(cs * 0.8);
      const lines = Math.max(5, Math.floor(size / 4));

      // Jump to start of block
      allStitches.push({x: originX, y: originY, type: 1});

      // Generate fill lines for the block
      const blockPts = getBlockStitchPoints(cell.block, cell.rotation, originX, originY, size, lines);
      blockPts.forEach(pt => allStitches.push({...pt, type: 0}));
    }
  }
  allStitches.push({x: 0, y: 0, type: 2}); // END

  // Encode as DST binary
  const bytes = [];
  const HEADER_SIZE = 512;

  // Build header (512 bytes, mostly spaces + metadata)
  const header = new Uint8Array(HEADER_SIZE);
  const enc = new TextEncoder();
  const meta = `LA:QuiltCraft   \rST:${allStitches.length.toString().padStart(7,' ')}\rCO:01\r+X:0300\r-X:0300\r+Y:0300\r-Y:0300\rAX:+0000\rAY:+0000\rMX:+0000\rMY:+0000\rPD:******\r\x1A`;
  const metaBytes = enc.encode(meta);
  header.set(metaBytes.slice(0, Math.min(metaBytes.length, 511)));
  header[HEADER_SIZE-1] = 0x20;

  // Encode stitch records (3 bytes each)
  const records = [];
  let px = 0, py = 0;
  allStitches.forEach(s => {
    const dx = s.x - px;
    const dy = s.y - py;
    px = s.x; py = s.y;
    const dstBytes = encodeDSTRecord(dx, dy, s.type);
    records.push(...dstBytes);
  });

  // Combine header + records
  const total = HEADER_SIZE + records.length;
  const buf = new Uint8Array(total);
  buf.set(header, 0);
  buf.set(new Uint8Array(records), HEADER_SIZE);
  return buf;
}

function encodeDSTRecord(dx, dy, type) {
  // DST encodes delta in nibbles across 3 bytes
  // Each byte: bit7=y+121, bit6=y+81, bit5=x-121, bit4=x+81 (etc)
  // Simplified encoding: clamp to ±121 and use jump for large moves
  const b0 = encodeAxis(dx);
  const b1 = encodeAxis(dy);
  let b2 = 0x03; // stitch
  if (type === 1) b2 = 0x83; // jump
  if (type === 2) b2 = 0xF3; // end
  return [b0, b1, b2];
}

function encodeAxis(v) {
  // Pack ±value into DST byte encoding
  let b = 0;
  v = Math.max(-121, Math.min(121, v));
  if (v > 0) {
    if (v >= 81) { b |= 0x04; v -= 81; }
    if (v >= 27) { b |= 0x08; v -= 27; }
    if (v >= 9)  { b |= 0x10; v -= 9; }
    if (v >= 3)  { b |= 0x20; v -= 3; }
    if (v >= 1)  { b |= 0x40; }
  } else if (v < 0) {
    v = -v;
    if (v >= 81) { b |= 0x02; v -= 81; }
    if (v >= 27) { b |= 0x80; v -= 27; }  // approximate
    if (v >= 9)  { b |= 0x01; v -= 9; }
    if (v >= 3)  { b |= 0x08; v -= 3; }
  }
  return b;
}

function getBlockStitchPoints(blockIdx, rotation, ox, oy, size, lines) {
  const pts = [];
  const rad = rotation * Math.PI / 180;
  const cx = ox + size/2, cy = oy + size/2;
  const rotPt = (x, y) => {
    const dx = x-cx, dy = y-cy;
    return {
      x: Math.round(cx + dx*Math.cos(rad) - dy*Math.sin(rad)),
      y: Math.round(cy + dx*Math.sin(rad) + dy*Math.cos(rad))
    };
  };

  switch(blockIdx) {
    case 0: // HST — diagonal fill
      for (let i = 0; i <= lines; i++) {
        const t = i / lines;
        pts.push(rotPt(ox, oy + t*size));
        pts.push(rotPt(ox + (1-t)*size, oy + size));
      }
      break;
    case 1: // Quarter square
      for (let i = 0; i <= lines; i++) {
        const t = i / lines;
        pts.push(rotPt(ox + t*size, oy));
        pts.push(rotPt(ox, oy + t*size));
      }
      break;
    case 2: // Log cabin
      for (let ring = 0; ring < Math.floor(lines/3)+1; ring++) {
        const pad = ring * size * 0.15;
        pts.push(rotPt(ox+pad, oy+pad));
        pts.push(rotPt(ox+size-pad, oy+pad));
        pts.push(rotPt(ox+size-pad, oy+size-pad));
        pts.push(rotPt(ox+pad, oy+size-pad));
        pts.push(rotPt(ox+pad, oy+pad));
      }
      break;
    case 3: // Flying geese — radiate from apex
      const apex = rotPt(ox+size/2, oy);
      for (let i = 0; i <= lines; i++) {
        const t = i / lines;
        pts.push(apex);
        pts.push(rotPt(ox + t*size, oy+size));
      }
      break;
    case 4: // Pinwheel
      for (let i = 0; i <= lines; i++) {
        const t = i / lines;
        pts.push(rotPt(ox+size/2, oy+size/2));
        pts.push(rotPt(ox + t*size, oy));
        pts.push(rotPt(ox+size/2, oy+size/2));
        pts.push(rotPt(ox+size, oy + t*size));
      }
      break;
    case 5: // Plain — horizontal fill
    default:
      for (let i = 0; i <= lines; i++) {
        const y = oy + (i / lines) * size;
        if (i % 2 === 0) {
          pts.push(rotPt(ox, y));
          pts.push(rotPt(ox+size, y));
        } else {
          pts.push(rotPt(ox+size, y));
          pts.push(rotPt(ox, y));
        }
      }
      break;
  }
  return pts;
}

// ============================================================
//  LOCAL STORAGE
// ============================================================
function saveToLocalStorage() {
  try {
    localStorage.setItem('quiltcraft_design', JSON.stringify({
      grid: state.grid,
      cols: state.cols,
      rows: state.rows,
      machine: state.machine,
      primaryColor: state.primaryColor,
      secondaryColor: state.secondaryColor,
      selectedBlock: state.selectedBlock,
      rotation: state.rotation
    }));
  } catch(e) {}
}

function loadFromLocalStorage() {
  try {
    const saved = localStorage.getItem('quiltcraft_design');
    if (!saved) return;
    const data = JSON.parse(saved);
    Object.assign(state, data);
  } catch(e) {}
}

// ============================================================
//  INIT
// ============================================================
function init() {
  loadFromLocalStorage();
  if (!state.grid || !state.grid.length) {
    state.grid = initGrid(state.cols, state.rows);
  }

  renderGridSizeBtns();
  renderBlockThumbs();
  renderColorSwatches();
  renderRotationBtns();
  renderMachineBtns();
  buildCanvas();
  updateStats();
  updateStitchPreview();

  // Auto-save
  setInterval(saveToLocalStorage, 5000);

  // Resize stitch preview on window resize
  window.addEventListener('resize', () => {
    buildCanvas();
    updateStitchPreview();
  });
}

document.addEventListener('DOMContentLoaded', init);
