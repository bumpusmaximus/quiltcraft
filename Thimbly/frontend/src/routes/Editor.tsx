import { useEffect } from 'react';
import { useGridStore } from '../store/useGridStore';
import { GridEngine } from '../components/GridEngine/GridEngine';
import { Toolbar } from '../components/GridEngine/Toolbar';
import { PalettePicker } from '../components/GridEngine/PalettePicker';
import { initializePattern } from '../utils/patternInitializers';
import { useAuth } from '../hooks/useAuth';
import { useCredits } from '../hooks/useCredits';
import { useExport } from '../hooks/useExport';
import { UpgradeModal } from '../components/UpgradeModal';
import { ExportProgress } from '../components/ExportProgress';

export function Editor() {
  const { gridData, resetHistory, craftType, projectId } = useGridStore();
  const { signOut } = useAuth();
  const { balance } = useCredits();
  const { exportDesign, exportStep, showUpgradeModal, errorMessage, closeUpgradeModal, downloadUrl } = useExport();

  useEffect(() => {
    if (gridData.length === 0) {
      const initialData = initializePattern(craftType, 50, 50);
      resetHistory(initialData);
    }
  }, [craftType, resetHistory, gridData.length]);

  const handleExport = async () => {
    const { success, url } = await exportDesign(projectId || 'temp-project-id', craftType, gridData);
    if (success && url) {
       window.open(url, '_blank');
    }
  };

  return (
    <div className="min-h-screen bg-cottage-cream text-cottage-wood font-sans flex flex-col">
      <header className="py-4 px-8 border-b border-cottage-sand bg-white/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <h1 className="text-3xl font-serif italic font-bold text-cottage-sage tracking-tight">
            Thimbly
          </h1>
          <div className="flex gap-6 items-center text-sm font-medium">
            <div className="px-3 py-1 bg-cottage-sand/30 rounded-full flex items-center gap-2 text-cottage-wood/80">
              {balance === null ? (
                <div className="w-16 h-4 bg-cottage-sand/40 animate-pulse rounded" />
              ) : (
                <span data-testid="user-credits">{balance} credits</span>
              )}
            </div>
            <button 
              data-testid="export-pdf-btn"
              onClick={handleExport} 
              className="px-4 py-2 bg-cottage-sage text-white rounded-full hover:bg-cottage-sage/90 transition-all shadow-sm active:scale-95"
            >
              Export PDF
            </button>
            <button onClick={signOut} className="text-cottage-wood/60 hover:text-cottage-wood transition-colors">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto w-full p-8 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-8 flex-1">
        <div className="relative flex-1 bg-white rounded-2xl shadow-xl overflow-hidden border border-cottage-sand/50 h-[calc(100vh-140px)]">
          <GridEngine width={50} height={50} />
        </div>

        <aside className="flex flex-col gap-6 overflow-y-auto pr-2 h-[calc(100vh-140px)]">
          <Toolbar />
          <PalettePicker />
          
          <div className="p-4 bg-cottage-sage/10 rounded-xl border border-cottage-sage/20">
            <h4 className="font-serif font-bold text-cottage-moss mb-2">Did you know?</h4>
            <p className="text-sm leading-relaxed text-cottage-wood/80 italic">
              "The earliest known cross-stitch piece dates back to 500 AD."
            </p>
          </div>
        </aside>
      </main>
      
      <UpgradeModal isOpen={showUpgradeModal} onClose={closeUpgradeModal} />
      <ExportProgress 
        step={exportStep} 
        errorMessage={errorMessage} 
        downloadUrl={downloadUrl}
        onClose={closeUpgradeModal} 
      />
    </div>
  );
}
