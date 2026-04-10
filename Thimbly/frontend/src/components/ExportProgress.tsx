import { CheckCircle, Loader2, XCircle } from 'lucide-react';

interface ExportProgressProps {
  step: 'idle' | 'validating' | 'uploading' | 'deducting' | 'error' | 'success';
  errorMessage?: string;
  downloadUrl?: string | null;
  onClose: () => void;
}

export function ExportProgress({ step, errorMessage, downloadUrl, onClose }: ExportProgressProps) {
  if (step === 'idle') return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 flex flex-col items-center justify-center text-center">
        {['validating', 'uploading', 'deducting'].includes(step) && (
          <>
            <Loader2 className="w-12 h-12 text-cottage-sage animate-spin mb-4" />
            <h3 className="text-xl font-serif font-bold text-cottage-wood mb-2">Exporting Design...</h3>
            <p className="text-cottage-wood/60 text-sm">
              {step === 'validating' && 'Validating request...'}
              {step === 'uploading' && 'Generating high-res file...'}
              {step === 'deducting' && 'Finalizing...'}
            </p>
          </>
        )}
        
        {step === 'success' && (
          <div data-testid="export-success-modal">
            <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
            <h3 className="text-xl font-serif font-bold text-cottage-wood mb-2">Export Complete!</h3>
            <p className="text-cottage-wood/60 text-sm mb-6">Your design has been saved successfully.</p>
            
            {downloadUrl && (
              <a 
                data-testid="download-link"
                href={downloadUrl} 
                className="block mb-6 text-cottage-sage font-bold underline hover:text-cottage-sage/80 transition-colors"
                target="_blank"
                rel="noopener noreferrer"
              >
                Download Pattern
              </a>
            )}

            <button onClick={onClose} className="px-6 py-2 bg-cottage-sage text-white rounded-full font-medium hover:bg-cottage-sage/90 transition-colors">
              Close
            </button>
          </div>
        )}
        
        {step === 'error' && (
          <>
            <XCircle className="w-12 h-12 text-red-500 mb-4" />
            <h3 className="text-xl font-serif font-bold text-cottage-wood mb-2">Export Failed</h3>
            <p className="text-red-500/80 text-sm mb-6">{errorMessage || 'Something went wrong.'}</p>
            <button onClick={onClose} className="px-6 py-2 border border-cottage-sand text-cottage-wood rounded-full font-medium hover:bg-cottage-sand/20 transition-colors">
              Close
            </button>
          </>
        )}
      </div>
    </div>
  );
}
