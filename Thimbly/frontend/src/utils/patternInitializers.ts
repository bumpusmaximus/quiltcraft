import type { GridData, CraftType } from '../store/useGridStore';

export const createEmptyGrid = (width: number, height: number): GridData => {
  return Array.from({ length: height }, () => Array.from({ length: width }, () => null));
};

export const initializePattern = (type: CraftType, width: number, height: number): GridData => {
  const grid = createEmptyGrid(width, height);
  const centerX = Math.floor(width / 2);
  const centerY = Math.floor(height / 2);

  if (type === 'cross_stitch') {
    // Bee Pattern (simplified)
    const bee = [
      [0, 1, 1, 1, 0],
      [1, 2, 2, 2, 1],
      [1, 1, 1, 1, 1],
      [1, 2, 2, 2, 1],
      [0, 1, 1, 1, 0],
    ];
    
    bee.forEach((row, ry) => {
      row.forEach((cell, rx) => {
        if (cell === 1) grid[centerY - 2 + ry][centerX - 2 + rx] = { colorId: 'DMC:444' };
        if (cell === 2) grid[centerY - 2 + ry][centerX - 2 + rx] = { colorId: 'DMC:310' };
      });
    });
    // Wings
    grid[centerY - 1][centerX - 3] = { colorId: 'DMC:B5200' };
    grid[centerY - 1][centerX + 3] = { colorId: 'DMC:B5200' };
  } else if (type === 'quilt') {
    // Flower Pattern
    const flower = [
      [0, 0, 1, 0, 0],
      [0, 1, 2, 1, 0],
      [1, 2, 2, 2, 1],
      [0, 1, 2, 1, 0],
      [0, 0, 1, 0, 0],
    ];
    
    flower.forEach((row, ry) => {
      row.forEach((cell, rx) => {
        if (cell === 1) grid[centerY - 2 + ry][centerX - 2 + rx] = { colorId: 'DMC:701' };
        if (cell === 2) grid[centerY - 2 + ry][centerX - 2 + rx] = { colorId: 'DMC:666' };
      });
    });
  }

  return grid;
};
