// blocks.js — Quilt block definitions, SVG renderer, and stitch path generators

const BLOCK_NAMES = ['Half-Square','Quarter-Sq','Log Cabin','Flying Geese','Pinwheel','Plain'];

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

export { BLOCK_NAMES, svgBlock, getStitchPaths, getBlockStitchPoints };
