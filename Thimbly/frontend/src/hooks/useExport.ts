import { useState } from 'react';
import { validateExport, completeExport } from '../lib/api';
import { useAuth } from './useAuth';
import { useCredits } from './useCredits';

export function useExport() {
  const { session } = useAuth();
  const { deductCreditLocal, revertCredit } = useCredits();
  const [isExporting, setIsExporting] = useState(false);
  const [exportStep, setExportStep] = useState<'idle' | 'validating' | 'uploading' | 'deducting' | 'error' | 'success'>('idle');
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);

  const exportDesign = async (projectId: string, craftType: string, designData: any, isRetry = false): Promise<{ success: boolean; url?: string }> => {
    if (!session?.access_token) {
      setErrorMessage('Must be logged in to export.');
      return { success: false };
    }
    
    if (!isRetry) {
      const hasCredits = deductCreditLocal();
      if (!hasCredits) {
        setShowUpgradeModal(true);
        return { success: false };
      }
    }

    setIsExporting(true);
    setExportStep('validating');
    setErrorMessage('');
    setDownloadUrl(null);
    
    const idempotencyKey = typeof crypto.randomUUID === 'function' 
      ? crypto.randomUUID() 
      : `ik-${Date.now()}-${Math.random().toString(36).slice(2)}`;

    try {
      // 1. Validate
      await validateExport(session.access_token, idempotencyKey, craftType);
      
      setExportStep('uploading');
      
      // 2. Complete Export
      const res = await completeExport(session.access_token, idempotencyKey, projectId, 'png', designData);
      
      setExportStep('success');
      setIsExporting(false);
      setDownloadUrl(res.url);
      return { success: true, url: res.url }; // assumes api returns url
    } catch (err: any) {
      setExportStep('error');
      setIsExporting(false);
      
      const status = err.response?.status;
      if (status === 402) {
        revertCredit();
        setShowUpgradeModal(true);
      } else if (status === 409 && !isRetry) {
        // Idempotency conflict, try once more
        return exportDesign(projectId, craftType, designData, true);
      } else {
        revertCredit();
        setErrorMessage(err.response?.data?.message || 'An error occurred during export.');
      }
      return { success: false };
    }
  };

  const closeUpgradeModal = () => setShowUpgradeModal(false);

  return { exportDesign, isExporting, exportStep, showUpgradeModal, errorMessage, closeUpgradeModal, downloadUrl };
}
