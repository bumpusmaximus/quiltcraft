// export-worker.js — Cloudflare Worker for QuiltCraft stitch file generation
// Deploy with: wrangler deploy workers/export-worker.js --name quiltcraft-export
//
// Handles:
//   POST /generate  — accepts JSON {cols, rows, cellSize, machine, grid}, returns binary stitch file
//   GET  /health    — returns {status: "ok", version: "1.0.0"}
//
// DST reference: https://edutechwiki.unige.ch/en/Embroidery_format_DST
// PES reference: http://www.achatina.de/sewing/main/TECHNICL.HTM

// ============================================================
//  DST HELPERS (self-contained — no imports from src/)
// ============================================================

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

function encodeDSTRecord(dx, dy, type) {
  // DST encodes delta in nibbles across 3 bytes
  // Simplified encoding: clamp to ±121 and use jump flags for large moves
  const b0 = encodeAxis(dx);
  const b1 = encodeAxis(dy);
  let b2 = 0x03; // stitch
  if (type === 1) b2 = 0x83; // jump
  if (type === 2) b2 = 0xF3; // end
  return [b0, b1, b2];
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
    case 3: { // Flying geese — radiate from apex
      const apex = rotPt(ox+size/2, oy);
      for (let i = 0; i <= lines; i++) {
        const t = i / lines;
        pts.push(apex);
        pts.push(rotPt(ox + t*size, oy+size));
      }
      break;
    }
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

function generateDST(gridState) {
  const SCALE = 10; // 0.1mm per DST unit; cellSize px → units
  const pxToUnit = (px) => Math.round(px * SCALE / 10);
  const cs = gridState.cellSize;

  // Collect all stitch points from filled cells
  const allStitches = []; // [{x, y, type}] type: 0=stitch, 1=jump, 2=stop

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

// ============================================================
//  PES (Brother) format — stub
//  TODO: PES format - see http://www.achatina.de/sewing/main/TECHNICL.HTM
// ============================================================
function generatePES(gridState) {
  // TODO: PES format - see http://www.achatina.de/sewing/main/TECHNICL.HTM
  return new Uint8Array(0);
}

// ============================================================
//  JEF (Janome) format — stub
//  TODO: JEF format
// ============================================================
function generateJEF(gridState) {
  // TODO: JEF format
  return new Uint8Array(0);
}

// ============================================================
//  FORMAT MAP
// ============================================================
const FORMAT_MAP = {
  brother: { ext: 'pes',  generate: generatePES },
  janome:  { ext: 'jef',  generate: generateJEF },
  bernina: { ext: 'exp',  generate: generateDST },  // EXP is DST-compatible for MVP
  viking:  { ext: 'vp3',  generate: generateDST },  // VP3 stub — falls back to DST
  singer:  { ext: 'xxx',  generate: generateDST },  // XXX stub — falls back to DST
  universal: { ext: 'dst', generate: generateDST },
};

// ============================================================
//  WORKER ENTRY POINT
// ============================================================
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // CORS headers — allow all origins for MVP
    const corsHeaders = {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    };

    // Handle preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: corsHeaders });
    }

    // GET /health
    if (url.pathname === '/health' && request.method === 'GET') {
      return Response.json(
        { status: 'ok', version: '1.0.0' },
        { headers: corsHeaders }
      );
    }

    // POST /generate
    if (url.pathname === '/generate' && request.method === 'POST') {
      let gridState;

      // Parse and validate request body
      try {
        gridState = await request.json();
      } catch (e) {
        return Response.json(
          { error: 'Invalid JSON body' },
          { status: 400, headers: corsHeaders }
        );
      }

      const { cols, rows, cellSize, machine, grid } = gridState;

      if (
        typeof cols !== 'number' || typeof rows !== 'number' ||
        typeof cellSize !== 'number' || !Array.isArray(grid)
      ) {
        return Response.json(
          { error: 'Missing required fields: cols, rows, cellSize, grid' },
          { status: 422, headers: corsHeaders }
        );
      }

      if (cols < 1 || cols > 64 || rows < 1 || rows > 64) {
        return Response.json(
          { error: 'cols and rows must be between 1 and 64' },
          { status: 422, headers: corsHeaders }
        );
      }

      // Select format handler
      const fmt = FORMAT_MAP[machine] || FORMAT_MAP.universal;
      let fileBytes;

      try {
        fileBytes = fmt.generate(gridState);
      } catch (e) {
        return Response.json(
          { error: 'File generation failed', detail: e.message },
          { status: 500, headers: corsHeaders }
        );
      }

      const filename = `QuiltCraft_Design.${fmt.ext}`;

      return new Response(fileBytes, {
        status: 200,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/octet-stream',
          'Content-Disposition': `attachment; filename="${filename}"`,
          'Content-Length': String(fileBytes.byteLength),
        },
      });
    }

    // 404 for everything else
    return new Response('Not found', { status: 404, headers: corsHeaders });
  }
};
