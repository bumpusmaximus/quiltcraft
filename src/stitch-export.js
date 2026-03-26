// stitch-export.js — Embroidery stitch file generators
// Supports DST (Tajima) natively; PES and JEF are stubs pending format implementation.

import { getBlockStitchPoints } from './blocks.js';

// ============================================================
//  DST (Tajima) format
//  Reference: https://edutechwiki.unige.ch/en/Embroidery_format_DST
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
  // Each byte: bit7=y+121, bit6=y+81, bit5=x-121, bit4=x+81 (etc)
  // Simplified encoding: clamp to ±121 and use jump for large moves
  const b0 = encodeAxis(dx);
  const b1 = encodeAxis(dy);
  let b2 = 0x03; // stitch
  if (type === 1) b2 = 0x83; // jump
  if (type === 2) b2 = 0xF3; // end
  return [b0, b1, b2];
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
//  Dispatcher — picks the right generator based on machine
// ============================================================
function generateStitchFile(gridState) {
  switch (gridState.machine) {
    case 'brother':
    case 'singer':
      return generatePES(gridState);
    case 'janome':
      return generateJEF(gridState);
    case 'universal':
    default:
      return generateDST(gridState);
  }
}

export { generateDST, encodeDSTRecord, encodeAxis, generatePES, generateJEF, generateStitchFile };
