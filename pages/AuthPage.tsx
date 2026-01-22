
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

interface AuthPageProps {
  isSignUp?: boolean;
}

const AuthPage: React.FC<AuthPageProps> = ({ isSignUp = false }) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isFinishing, setIsFinishing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dbLinked, setDbLinked] = useState<boolean | null>(null);
  const navigate = useNavigate();

  // Reset inputs and errors when switching between login and signup
  useEffect(() => {
    setEmail('');
    setPassword('');
    setError(null);
  }, [isSignUp]);

  useEffect(() => {
    const checkLink = async () => {
      if (!supabase) {
        setDbLinked(false);
        return;
      }
      // Quick check to see if the profiles table exists
      try {
        const { error } = await supabase.from('profiles').select('count', { count: 'exact', head: true }).limit(1);
        if (error && error.code === 'PGRST116') { // Table exists but empty
          setDbLinked(true);
        } else if (error && error.code === '42P01') { // Table does not exist
          setDbLinked(false);
        } else {
          setDbLinked(true);
        }
      } catch {
        setDbLinked(false);
      }
    };
    checkLink();
  }, []);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) {
      setError("Aura_Link failed. Check project credentials.");
      return;
    }
    
    setIsLoading(true);
    setError(null);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({ 
          email, 
          password,
          options: {
            data: { display_name: email.split('@')[0] }
          }
        });
        if (error) throw error;
        
        // If user is auto-confirmed (common in dev), log them in
        if (data?.session) {
          setIsFinishing(true);
          setTimeout(() => navigate('/studio'), 1500);
        } else {
          alert("Registration signal accepted. Please check your inbox to verify your account.");
          navigate('/login');
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        setIsFinishing(true);
        setTimeout(() => {
          navigate('/studio');
        }, 1500);
      }
    } catch (err: any) {
      setError(err.message || "Uplink failed. Authentication server unreachable.");
    } finally {
      setIsLoading(false);
    }
  };

  if (isFinishing) {
    return (
      <div className="min-h-screen bg-[#3b5a75] flex items-center justify-center animate-in fade-in duration-700">
        <div className="win-panel p-10 bg-[#d4d0c8] flex flex-col items-center gap-6 shadow-2xl border-4 border-white max-w-sm w-full">
           <div className="relative w-16 h-16">
              <div className="absolute inset-0 border-4 border-blue-800 rounded-full animate-ping opacity-25"></div>
              <div className="absolute inset-0 border-4 border-blue-800 rounded-full animate-spin border-t-transparent"></div>
           </div>
           <div className="text-center space-y-2">
              <h2 className="text-sm font-bold uppercase tracking-widest">Uplink Established</h2>
              <p className="text-[10px] text-gray-600 font-mono">Synchronizing Neural Buffers...</p>
           </div>
           <div className="w-full h-2 bg-white border border-gray-400 overflow-hidden">
              <div className="h-full bg-blue-800 w-0 animate-[progress_1.5s_ease-in-out_forwards]"></div>
           </div>
        </div>
        <style>{`
          @keyframes progress { from { width: 0%; } to { width: 100%; } }
        `}</style>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#3b5a75]">
      <div className="win-panel w-full max-w-[400px] overflow-hidden shadow-2xl animate-aura-in">
        <div className="win-title-bar">
          <div className="flex items-center gap-1">Aura Security Protocol</div>
          <button onClick={() => navigate('/')} className="win-button py-0 px-2 h-4 bg-red-700 text-white font-bold">X</button>
        </div>
        
        <div key={isSignUp ? 'signup-mode' : 'login-mode'} className="p-6 bg-[#d4d0c8] animate-aura-in transition-all duration-300">
          <div className="flex gap-4 mb-6">
             <div className="w-12 h-12 bg-gray-400 border-2 border-white shadow-inner flex items-center justify-center flex-shrink-0 transition-transform hover:scale-105">
                <div className={`w-6 h-6 border-4 border-white rounded-full ${isSignUp ? 'bg-blue-600' : 'bg-transparent'}`}></div>
             </div>
             <div>
                <h2 className="text-sm font-bold">{isSignUp ? 'Identity Registration' : 'Network Access'}</h2>
                <p className="text-[10px] text-gray-700">
                  {isSignUp 
                    ? 'Establish a new neural node within the Aura Cloud archive.' 
                    : 'Enter credentials to authenticate with Aura_Core.'}
                </p>
             </div>
          </div>

          {dbLinked === false && (
            <div className="mb-4 p-2 bg-yellow-100 border border-yellow-400 text-[9px] text-yellow-800 leading-tight animate-pulse">
              <b>UPLINK NOTICE:</b> Supabase connected but tables not detected. Please run the SQL in BACKEND_INTEGRATION.md to enable all features.
            </div>
          )}

          {error && (
            <div className="mb-4 p-2 bg-red-100 border border-red-400 text-[10px] text-red-700 font-bold font-mono">
              SYS_ERROR: {error.toUpperCase()}
            </div>
          )}

          <form onSubmit={handleAuth} className="space-y-4">
            <div className="flex items-center gap-4">
              <label className="w-20 text-[10px] font-bold text-right uppercase tracking-tighter">Auth ID:</label>
              <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="flex-1 win-inset px-2 py-1 text-xs outline-none focus:bg-blue-50 border-gray-400 transition-colors" />
            </div>
            <div className="flex items-center gap-4">
              <label className="w-20 text-[10px] font-bold text-right uppercase tracking-tighter">Keyphrase:</label>
              <input type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="flex-1 win-inset px-2 py-1 text-xs outline-none focus:bg-blue-50 border-gray-400 transition-colors" />
            </div>

            <div className="pt-2">
              <button disabled={isLoading} className="win-button w-full font-bold text-xs h-9 bg-blue-100 hover:bg-blue-200 transition-all active:scale-[0.98]">
                {isLoading ? 'ESTABLISHING...' : (isSignUp ? 'REGISTER ACCOUNT' : 'ESTABLISH LINK')}
              </button>
            </div>
          </form>

          <div className="mt-6 border-t border-gray-400 pt-4 flex justify-between items-center">
             <Link to={isSignUp ? '/login' : '/signup'} className="text-[10px] underline text-blue-900 font-bold hover:text-blue-700 transition-colors">
                {isSignUp ? 'Existing user?' : 'New user signup'}
             </Link>
             <button onClick={() => navigate('/')} className="win-button px-4 py-0.5 text-[10px]">Cancel</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
