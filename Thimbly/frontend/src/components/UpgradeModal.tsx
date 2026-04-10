import { X } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';

interface UpgradeModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function UpgradeModal({ isOpen, onClose }: UpgradeModalProps) {
  const { session } = useAuth();
  
  if (!isOpen) return null;

  const handlePurchase = async (credits: number, price: number) => {
    // Stub implementation: /api/checkout/create-session
    const checkoutUrl = `/api/checkout/create-session`;
    const payload = {
      price,
      metadata: {
        user_id: session?.user?.id,
        credits,
      }
    };
    
    console.log('POST', checkoutUrl, payload);
    
    // Stub redirect matching the required mock behaviour
    window.location.href = `https://checkout.stripe.com/test?session_id=test&credits=${credits}`;
  };

  return (
    <div data-testid="upgrade-modal" className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center">
      <div className="bg-white rounded-2xl shadow-xl w-full max-md p-6 border border-cottage-sand">
        <div className="flex justify-between items-center mb-6">
          <h2 data-testid="upgrade-modal-title" className="text-2xl font-serif font-bold text-cottage-wood">Add Credits</h2>
          <button onClick={onClose} className="p-2 hover:bg-cottage-sand/20 rounded-full transition-colors">
            <X className="w-5 h-5 text-cottage-wood/60" />
          </button>
        </div>
        
        <p className="text-cottage-wood/80 mb-6">
          You need credits to export your beautiful designs. Choose a pack below:
        </p>
        
        <div data-testid="credit-packs" className="flex flex-col gap-4">
          <button onClick={() => handlePurchase(1, 200)} className="w-full flex items-center justify-between p-4 rounded-xl border border-cottage-sand hover:border-cottage-sage hover:bg-cottage-sage/5 transition-all">
            <span className="font-bold text-cottage-wood">1 Credit</span>
            <span className="text-cottage-sage font-medium">$2.00</span>
          </button>
          
          <button onClick={() => handlePurchase(3, 500)} className="w-full flex items-center justify-between p-4 rounded-xl border-2 border-cottage-sage bg-cottage-sage/5 hover:bg-cottage-sage/10 transition-all">
            <span className="font-bold text-cottage-wood">3 Credits</span>
            <div className="flex flex-col items-end">
               <span className="text-sm line-through text-cottage-wood/40">$6.00</span>
               <span className="text-cottage-sage font-bold">$5.00</span>
            </div>
          </button>
          
          <button onClick={() => handlePurchase(10, 1500)} className="w-full flex items-center justify-between p-4 rounded-xl border border-cottage-sand hover:border-cottage-sage hover:bg-cottage-sage/5 transition-all">
            <span className="font-bold text-cottage-wood">10 Credits</span>
            <div className="flex flex-col items-end">
               <span className="text-sm line-through text-cottage-wood/40">$20.00</span>
               <span className="text-cottage-sage font-medium">$15.00</span>
            </div>
          </button>
        </div>
      </div>
    </div>
  );
}
