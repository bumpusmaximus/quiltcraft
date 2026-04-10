import { useState } from 'react';
import { useNavigate, Navigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function LoginStub() {
  const { session, signIn } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (session) {
    return <Navigate to="/editor" replace />;
  }

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg('');
    try {
      const { error } = await signIn(email, password); 
      if (error) {
        setErrorMsg(error.message);
      } else {
        navigate('/editor');
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Unknown error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-cottage-cream text-cottage-wood">
      <div className="bg-white p-12 rounded-2xl shadow-xl flex flex-col items-center max-w-md w-full border border-cottage-sand">
         {errorMsg && <div className="p-3 bg-red-100 text-red-600 rounded-lg text-sm w-full mb-4">{errorMsg}</div>}
         <h1 className="text-4xl font-serif italic font-bold text-cottage-sage tracking-tight mb-8">
            Thimbly
         </h1>
         <p className="text-center mb-8 text-cottage-wood/80">Log in to sync your needlecraft designs and export high-res patterns.</p>
         
         <form onSubmit={handleLogin} className="w-full flex flex-col gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-cottage-wood/60 ml-1">Email</label>
              <input 
                data-testid="email-input"
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="testuser@thimbly.dev" 
                className="w-full px-4 py-3 bg-cottage-sand/10 border border-cottage-sand rounded-xl focus:outline-none focus:ring-2 focus:ring-cottage-sage/30 transition-all font-medium"
              />
            </div>
            
            <div className="flex flex-col gap-1">
              <label className="text-xs font-bold uppercase tracking-wider text-cottage-wood/60 ml-1">Password</label>
              <input 
                data-testid="password-input"
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••" 
                className="w-full px-4 py-3 bg-cottage-sand/10 border border-cottage-sand rounded-xl focus:outline-none focus:ring-2 focus:ring-cottage-sage/30 transition-all font-medium"
              />
            </div>

            <button 
              data-testid="login-submit"
              type="submit" 
              disabled={loading} 
              className="w-full mt-4 py-3 bg-cottage-sage text-white rounded-xl font-bold hover:bg-cottage-sage/90 transition-colors disabled:opacity-50 shadow-md active:scale-[0.98]"
            >
              {loading ? 'Logging in...' : 'Sign In'}
            </button>
         </form>
      </div>
    </div>
  );
}
