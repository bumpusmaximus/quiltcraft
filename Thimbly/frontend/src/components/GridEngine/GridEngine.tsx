import { useEffect, useRef, useState, useCallback } from 'react';
import { useGridStore } from '../../store/useGridStore';
import { findDMCColor } from '../../utils/palettes/dmc-117';
import { CrossStitchRules, QuiltRules, KnitRules } from './CraftRules';

interface GridEngineProps {
  width: number;
  height: number;
  cellSize?: number;
}

export const GridEngine: React.FC<GridEngineProps> = ({ 
  width, 
  height, 
  cellSize = 20 
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { 
    gridData, 
    viewport, 
    setViewport, 
    activeTool, 
    setCell, 
    activeColor,
    craftType 
  } = useGridStore();
  
  const rules = craftType === 'cross_stitch' ? CrossStitchRules : craftType === 'quilt' ? QuiltRules : KnitRules;
  
  const [isPanning, setIsPanning] = useState(false);
  const [lastMousePos, setLastMousePos] = useState({ x: 0, y: 0 });

  // Main Render Loop
  const draw = useCallback(() => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    if (!ctx) return;

    const { scale, offsetX, offsetY } = viewport;

    // Clear and translate
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    
    ctx.translate(offsetX, offsetY);
    ctx.scale(scale, scale);

    // 1. Draw Craft Overlay (Seam allowance, etc.)
    if (rules.renderOverlay) {
      rules.renderOverlay(ctx, width, height, cellSize);
    }

    // 2. Draw Stitch Data with Viewport Frustum Culling (Performance Optimization)
    const startX = Math.max(0, Math.floor(-offsetX / (cellSize * scale)));
    const startY = Math.max(0, Math.floor(-offsetY / (cellSize * scale)));
    const endX = Math.min(width, Math.ceil((canvasRef.current.width - offsetX) / (cellSize * scale)));
    const endY = Math.min(height, Math.ceil((canvasRef.current.height - offsetY) / (cellSize * scale)));

    for (let y = startY; y < endY; y++) {
      for (let x = startX; x < endX; x++) {
        const cell = gridData[y]?.[x];
        if (!cell) continue;
        const color = findDMCColor(cell.colorId);
        if (!color) continue;

        ctx.fillStyle = color.hex;
        ctx.fillRect(x * cellSize + 0.5, y * cellSize + 0.5, cellSize - 1, cellSize - 1);
        
        // Symbols (Injected from Rules)
        const symbol = rules.getCellSymbol(cell);
        if (symbol && cellSize > 10) {
          ctx.fillStyle = 'rgba(0,0,0,0.3)';
          ctx.font = `${cellSize * 0.6}px sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(symbol, (x + 0.5) * cellSize, (y + 0.5) * cellSize);
        }
      }
    }
  }, [gridData, viewport, cellSize, width, height, rules]);

  // Trigger draw on structural changes instead of infinite animation loop
  useEffect(() => {
    draw();
  }, [draw]);

  // Interaction Handlers
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    if (!canvasRef.current) return;

    const zoomSpeed = 0.001;
    const prevScale = viewport.scale;
    const newScale = Math.max(0.1, Math.min(5, prevScale - e.deltaY * zoomSpeed));
    
    const rect = canvasRef.current.getBoundingClientRect();
    const cursorX = e.clientX - rect.left;
    const cursorY = e.clientY - rect.top;

    // Calculate new offsets to zoom towards cursor
    const newOffsetX = cursorX - (cursorX - viewport.offsetX) * (newScale / prevScale);
    const newOffsetY = cursorY - (cursorY - viewport.offsetY) * (newScale / prevScale);

    setViewport({ 
      scale: newScale,
      offsetX: newOffsetX,
      offsetY: newOffsetY
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || activeTool === 'pan') {
      setIsPanning(true);
      setLastMousePos({ x: e.clientX, y: e.clientY });
    } else {
      // Logic for drawing
      handleDrawAction(e);
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isPanning) {
      const dx = e.clientX - lastMousePos.x;
      const dy = e.clientY - lastMousePos.y;
      setViewport({ 
        offsetX: viewport.offsetX + dx, 
        offsetY: viewport.offsetY + dy 
      });
      setLastMousePos({ x: e.clientX, y: e.clientY });
    } else if (e.buttons === 1) {
      handleDrawAction(e);
    }
  };

  const handleMouseUp = () => {
    setIsPanning(false);
  };

  const handleDrawAction = (e: React.MouseEvent) => {
    if (!canvasRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left - viewport.offsetX) / viewport.scale;
    const y = (e.clientY - rect.top - viewport.offsetY) / viewport.scale;

    const gridX = Math.floor(x / cellSize);
    const gridY = Math.floor(y / cellSize);

    if (gridX >= 0 && gridX < width && gridY >= 0 && gridY < height) {
      if (activeTool === 'stitch') {
        setCell(gridX, gridY, activeColor);
      } else if (activeTool === 'erase') {
        setCell(gridX, gridY, null);
      }
    }
  };

  const bgScaleSize = cellSize * viewport.scale;
  
  return (
    <div 
      className="relative w-full h-full overflow-hidden bg-paper rounded-lg shadow-inner cursor-crosshair border-2 border-cottage-sand"
      style={{
        backgroundImage: `
          repeating-linear-gradient(#E2E8F0 0 1px, transparent 1px 100%),
          repeating-linear-gradient(90deg, #E2E8F0 0 1px, transparent 1px 100%)
        `,
        backgroundSize: `${bgScaleSize}px ${bgScaleSize}px`,
        backgroundPosition: `${viewport.offsetX}px ${viewport.offsetY}px`
      }}
    >
      <canvas
        ref={canvasRef}
        width={1200}
        height={800}
        className="w-full h-full"
        onWheel={handleWheel}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onContextMenu={(e) => e.preventDefault()}
      />
    </div>
  );
};
