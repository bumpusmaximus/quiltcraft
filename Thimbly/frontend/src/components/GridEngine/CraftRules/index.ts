import type { GridCell, GridData } from '../../../store/useGridStore';

export interface CraftRule {
  type: 'cross_stitch' | 'quilt' | 'knit';
  name: string;
  getCellSymbol: (cellData: GridCell) => string;
  validatePlacement: (x: number, y: number, gridData: GridData) => boolean;
  renderOverlay?: (ctx: CanvasRenderingContext2D, width: number, height: number, cellSize: number) => void;
  renderCellExtra?: (ctx: CanvasRenderingContext2D, x: number, y: number, cellSize: number) => void;
}

export const CrossStitchRules: CraftRule = {
  type: 'cross_stitch',
  name: 'Cross Stitch',
  getCellSymbol: () => '×',
  validatePlacement: () => true,
};

export const QuiltRules: CraftRule = {
  type: 'quilt',
  name: 'Quilting',
  getCellSymbol: () => '',
  validatePlacement: () => true,
  renderOverlay: (ctx, width, height, cellSize) => {
    // 1/4" seam allowance overlay
    ctx.strokeStyle = 'rgba(0,0,0,0.1)';
    ctx.setLineDash([5, 5]);
    ctx.strokeRect(0.25 * cellSize, 0.25 * cellSize, (width - 0.5) * cellSize, (height - 0.5) * cellSize);
    ctx.setLineDash([]);
  },
};

export const KnitRules: CraftRule = {
  type: 'knit',
  name: 'Knitting',
  getCellSymbol: () => '⋔', // V-shape for knit stitch
  validatePlacement: () => true,
};
