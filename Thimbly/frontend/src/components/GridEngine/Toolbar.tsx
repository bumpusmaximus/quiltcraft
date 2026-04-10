import { 
  Undo2, 
  Redo2, 
  Eraser, 
  Move, 
  Plus,
  Download
} from 'lucide-react';
import type { CraftType } from '../../store/useGridStore';
import { useGridStore } from '../../store/useGridStore';
import { cn } from '../../utils/cn';
import { validateExport } from '../../lib/api';

export const Toolbar: React.FC = () => {
  const { 
    activeTool, 
    setActiveTool, 
    undo, 
    redo, 
    historyIndex, 
    history,
    setCraftType,
    craftType
  } = useGridStore();

  const canUndo = historyIndex > 0;
  const canRedo = historyIndex < history.length - 1;

  return (
    <div className="flex flex-col gap-4 p-4 bg-white rounded-lg shadow-sm border border-cottage-sand">
      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-serif text-cottage-wood font-bold">Tools</h3>
        <div className="grid grid-cols-3 gap-2">
          <ToolButton 
            active={activeTool === 'stitch'} 
            onClick={() => setActiveTool('stitch')}
            title="Stitch Tool"
            icon={<Plus size={20} />}
          />
          <ToolButton 
            active={activeTool === 'erase'} 
            onClick={() => setActiveTool('erase')}
            title="Eraser Tool"
            icon={<Eraser size={20} />}
          />
          <ToolButton 
            active={activeTool === 'pan'} 
            onClick={() => setActiveTool('pan')}
            title="Pan Tool"
            icon={<Move size={20} />}
          />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-serif text-cottage-wood font-bold">History</h3>
        <div className="flex gap-2">
          <HistoryButton onClick={undo} disabled={!canUndo} icon={<Undo2 size={18} />} />
          <HistoryButton onClick={redo} disabled={!canRedo} icon={<Redo2 size={18} />} />
        </div>
      </div>

      <div className="flex flex-col gap-2">
        <h3 className="text-lg font-serif text-cottage-wood font-bold">Craft</h3>
        <select
          value={craftType}
          onChange={(e) => setCraftType(e.target.value as CraftType)}
          className="w-full p-2 rounded-md bg-cottage-cream border border-cottage-sand text-cottage-wood font-medium focus:outline-none focus:ring-1 focus:ring-cottage-wood cursor-pointer"
        >
          <option value="cross_stitch">Cross Stitch</option>
          <option value="quilt">Quilting</option>
          <option value="knit">Knitting</option>
        </select>
      </div>

      <button
        onClick={async () => {
          try {
            // Stub Export Validation call
            const idempotencyKey = `export-test-${Date.now()}`;
            await validateExport('test-token', idempotencyKey, craftType);
            alert('Export Validated successfully!');
          } catch (error) {
            const e = error as { response?: { data?: { error?: string } }, message?: string };
            alert('Export Status: ' + (e?.response?.data?.error || e.message));
          }
        }}
        className="mt-2 flex items-center justify-center gap-2 w-full p-3 bg-cottage-wood text-white rounded-md font-serif text-lg hover:bg-cottage-moss transition-all transform active:scale-95 shadow-md"
      >
        <Download size={20} />
        Export Pattern
      </button>
    </div>
  );
};

interface ToolButtonProps {
  active: boolean;
  onClick: () => void;
  title: string;
  icon: React.ReactNode;
}

const ToolButton = ({ active, onClick, title, icon }: ToolButtonProps) => (
  <button
    onClick={onClick}
    className={cn(
      "p-2 rounded-md transition-all flex items-center justify-center border-2",
      active ? "bg-cottage-sand border-cottage-wood text-cottage-wood" : "border-transparent text-slate-400 hover:bg-cottage-cream"
    )}
    title={title}
  >
    {icon}
  </button>
);

interface HistoryButtonProps {
  onClick: () => void;
  disabled: boolean;
  icon: React.ReactNode;
}

const HistoryButton = ({ onClick, disabled, icon }: HistoryButtonProps) => (
  <button
    onClick={onClick}
    disabled={disabled}
    className={cn(
      "flex-1 p-2 rounded-md transition-all flex items-center justify-center",
      !disabled ? "hover:bg-cottage-cream text-cottage-wood cursor-pointer" : "text-slate-200 cursor-not-allowed"
    )}
  >
    {icon}
  </button>
);
