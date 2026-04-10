import { useGridStore } from '../../store/useGridStore';
import { DMC_117_PALETTE } from '../../utils/palettes/dmc-117';
import { cn } from '../../utils/cn';

export const PalettePicker: React.FC = () => {
  const { activeColor, setActiveColor } = useGridStore();

  return (
    <div className="p-4 bg-white rounded-lg shadow-sm border border-cottage-sand">
      <h3 className="mb-3 text-lg font-serif text-cottage-wood">DMC Palette</h3>
      <div className="grid grid-cols-4 gap-2">
        {DMC_117_PALETTE.map((color) => (
          <button
            key={color.id}
            className={cn(
              "w-10 h-10 rounded-md border-2 transition-all hover:scale-110",
              activeColor === color.id ? "border-cottage-wood scale-105" : "border-transparent"
            )}
            style={{ backgroundColor: color.hex }}
            onClick={() => setActiveColor(color.id)}
            title={`${color.id} - ${color.name}`}
          />
        ))}
      </div>
    </div>
  );
};
