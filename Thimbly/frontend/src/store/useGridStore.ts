import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type CraftType = 'cross_stitch' | 'quilt' | 'knit';

export interface GridCell {
  colorId: string;
  symbol?: string;
}

export type GridData = (GridCell | null)[][];

interface Viewport {
  scale: number;
  offsetX: number;
  offsetY: number;
}

interface GridState {
  gridData: GridData;
  history: GridData[];
  historyIndex: number;
  viewport: Viewport;
  activeTool: 'stitch' | 'erase' | 'pan';
  activeColor: string;
  craftType: CraftType;
  projectId: string | null;
  isSaving: boolean;
  
  // Actions
  setGridData: (data: GridData) => void;
  setCell: (x: number, y: number, colorId: string | null) => void;
  undo: () => void;
  redo: () => void;
  setViewport: (viewport: Partial<Viewport>) => void;
  setActiveTool: (tool: 'stitch' | 'erase' | 'pan') => void;
  setActiveColor: (colorId: string) => void;
  setCraftType: (type: CraftType) => void;
  setProjectId: (id: string | null) => void;
  setIsSaving: (isSaving: boolean) => void;
  resetHistory: (initialData: GridData) => void;
}

const MAX_HISTORY = 50;

export const useGridStore = create<GridState>()(
  persist(
    (set, get) => ({
      gridData: [],
      history: [],
      historyIndex: -1,
      viewport: { scale: 1, offsetX: 0, offsetY: 0 },
      activeTool: 'stitch',
      activeColor: 'DMC:310',
      craftType: 'cross_stitch',
      projectId: null,
      isSaving: false,

      setGridData: (data) => set({ gridData: data }),

      setCell: (x, y, colorId) => {
        const { gridData, history, historyIndex } = get();
        if (!gridData[y] || x < 0 || x >= gridData[0].length) return;

        // Skip if same color
        if (gridData[y][x]?.colorId === colorId) return;

        // Lightweight structural share (clone only modified row and outer array)
        const newRow = [...gridData[y]];
        newRow[x] = colorId ? { colorId } : null;
        
        const newData = [...gridData];
        newData[y] = newRow;

        // Add to history
        const newHistory = [...history.slice(0, historyIndex + 1), newData];
        if (newHistory.length > MAX_HISTORY) newHistory.shift();
        
        set({ 
          gridData: newData, 
          history: newHistory, 
          historyIndex: newHistory.length - 1
        });
      },

      undo: () => {
        const { history, historyIndex } = get();
        if (historyIndex <= 0) return;
        const prevIndex = historyIndex - 1;
        set({ gridData: history[prevIndex], historyIndex: prevIndex });
      },

      redo: () => {
        const { history, historyIndex } = get();
        if (historyIndex >= history.length - 1) return;
        const nextIndex = historyIndex + 1;
        set({ gridData: history[nextIndex], historyIndex: nextIndex });
      },

      setViewport: (newViewport) => set((state) => ({ 
        viewport: { ...state.viewport, ...newViewport } 
      })),

      setActiveTool: (tool) => set({ activeTool: tool }),
      
      setActiveColor: (colorId) => set({ activeColor: colorId }),

      setCraftType: (type) => set({ craftType: type }),
      
      setProjectId: (id) => set({ projectId: id }),
      
      setIsSaving: (isSaving) => set({ isSaving }),

      resetHistory: (initialData) => set({ 
        gridData: initialData, 
        history: [initialData], 
        historyIndex: 0 
      }),
    }),
    {
      name: 'thimbly-grid-storage',
      partialize: (state) => ({ 
        gridData: state.gridData, 
        viewport: state.viewport,
        craftType: state.craftType,
        projectId: state.projectId
      }),
    }
  )
);
