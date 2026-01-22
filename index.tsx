
import React, { useState, useEffect, useRef } from 'react';
import ReactDOM from 'react-dom/client';
import { MemoryRouter as Router, Routes, Route, Navigate, useNavigate, Link } from 'react-router-dom';
import { GoogleGenAI } from "@google/genai";
import { createClient } from '@supabase/supabase-js';

// --- DATABASE CONFIGURATION ---
const supabaseUrl = 'https://dsskcarhhhqgirlilfua.supabase.co';
const supabaseAnonKey = 'sb_publishable_vL2yEBwIu80oi75r1JVFNg_ne83yZUw';
const supabase = (supabaseUrl && supabaseAnonKey) ? createClient(supabaseUrl, supabaseAnonKey) : null;

// --- TYPES ---
interface Message {
  role: 'user' | 'assistant' | 'model';
  content: string;
  timestamp: Date;
}

// --- SERVICES ---
const storageService = {
  async getUserProfile(userId: string) {
    if (!supabase) return null;
    const { data } = await supabase.from('profiles').select('*').eq('id', userId).single();
    return data;
  },
  async getAllProjects(userId: string) {
    if (!supabase) return [];
    const { data } = await supabase.from('projects').select('*').eq('user_id', userId).order('created_at', { ascending: false });
    return data || [];
  },
  async getLatestProject(userId: string) {
    if (!supabase) return null;
    const { data } = await supabase.from('projects').select('*').eq('user_id', userId).order('created_at', { ascending: false }).limit(1).single();
    return data;
  },
  async saveProject(userId: string, name: string, code: string, chatHistory: Message[]) {
    if (!supabase) return null;
    await supabase.from('projects').insert({ user_id: userId, name, code, chat_history: chatHistory });
    const profile = await this.getUserProfile(userId);
    const newCount = (profile?.usage_count || 0) + 1;
    await supabase.from('profiles').update({ usage_count: newCount }).eq('id', userId);
    return { success: true, newCount };
  }
};

const generateWebsite = async (prompt: string, chatHistory: Message[]) => {
  // Ensure we check for API Key presence
  if (!process.env.API_KEY) {
    throw new Error("API Key initialization failed. Check environment configuration.");
  }

  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const systemInstruction = `
    You are the AURA_CORE v1.0.4 Senior Full Stack Architect.
    PROTOCOL: Respond with SUMMARY: [1 sentence] and then CODE: [Wrapped in \`\`\`html code \`\`\`].
    Use Tailwind CSS, Lucide Icons, and modern glassmorphism.
    Output a single standalone HTML file.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-pro-preview',
      contents: [
        ...chatHistory.map(h => ({ 
          role: h.role === 'user' ? 'user' : 'model', 
          parts: [{ text: h.content }] 
        })),
        { role: 'user', parts: [{ text: prompt }] }
      ],
      config: { 
        systemInstruction, 
        temperature: 0.7 
      }
    });

    return response.text || "SYSTEM_FAILURE: Empty response.";
  } catch (err: any) {
    throw new Error(`AURA_API_ERROR: ${err.message}`);
  }
};

// --- UI COMPONENTS ---
const WinTitleBar = ({ title, onClose }: { title: string, onClose?: () => void }) => (
  <div className="win-title-bar select-none">
    <div className="flex items-center gap-2">
      <div className="w-3 h-3 bg-white/20 rounded-sm"></div>
      <span className="truncate">{title}</span>
    </div>
    {onClose && (
      <button onClick={onClose} className="win-button py-0 px-2 h-4 bg-red-800 text-white font-bold hover:bg-red-700">×</button>
    )}
  </div>
);

// --- PAGES ---
const LandingPage = () => {
  const navigate = useNavigate();
  const [isInitializing, setIsInitializing] = useState(false);
  const [dbStatus, setDbStatus] = useState('checking');

  useEffect(() => {
    const checkDb = async () => {
      if (!supabase) { setDbStatus('offline'); return; }
      try {
        await supabase.from('profiles').select('count', { count: 'exact', head: true }).limit(1);
        setDbStatus('online');
      } catch { setDbStatus('offline'); }
    };
    checkDb();
  }, []);

  const handleStart = () => {
    setIsInitializing(true);
    setTimeout(() => navigate('/studio'), 2800);
  };

  return (
    <div className="min-h-screen bg-[#3b5a75] flex items-center justify-center p-4">
      {!isInitializing ? (
        <div className="win-panel w-full max-w-2xl animate-aura-in shadow-[10px_10px_0px_rgba(0,0,0,0.3)]">
          <WinTitleBar title="Aura Studio Setup v1.0.4" />
          <div className="flex bg-[#d4d0c8]">
            <div className="w-56 bg-blue-900 p-8 text-white hidden md:flex flex-col gap-6">
              <div className="w-16 h-16 bg-white rounded-lg flex items-center justify-center shadow-inner">
                <div className="w-10 h-10 border-4 border-blue-900 rounded-full animate-pulse"></div>
              </div>
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest">Aura_Core</h3>
                <p className="text-[10px] opacity-60">Neural Synthesis Engine</p>
              </div>
              <div className="mt-auto opacity-20 text-[9px] font-mono">NODE_ID: 0x992-A<br/>BUILD: 2025.02.14</div>
            </div>
            <div className="flex-1 p-10 space-y-6">
              <h1 className="text-3xl font-bold text-blue-900 italic tracking-tight">System Initialization</h1>
              <p className="text-xs text-gray-800 leading-relaxed">
                Welcome to Aura Studio. This environment is optimized for high-performance website synthesis.
                Proceeding will establish a secure neural handshake with the AURA_CORE backbone.
              </p>
              <div className="win-inset bg-white p-4 h-32 overflow-y-auto font-mono text-[10px] text-gray-600 shadow-inner">
                [ STATUS REPORT ]<br/>
                > KERNEL: STABLE (0x01)<br/>
                > UPLINK: {dbStatus.toUpperCase()}<br/>
                > ASSETS: READY<br/>
                > READY FOR SYNTHESIS...
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <button onClick={handleStart} className="win-button bg-blue-100 font-bold px-8 py-2">Initialize &gt;</button>
                <button onClick={() => navigate('/login')} className="win-button px-8 py-2">Secure Login</button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="win-panel w-80 animate-aura-in">
          <WinTitleBar title="Mounting Aura_Core..." />
          <div className="p-8 space-y-6 bg-[#d4d0c8]">
             <div className="flex justify-center"><div className="w-12 h-12 border-4 border-blue-800 border-t-transparent rounded-full animate-spin"></div></div>
             <div className="space-y-2">
                <div className="flex justify-between text-[9px] font-bold"><span>UPLINK_PROGRESS</span><span>SYNCHRONIZING</span></div>
                <div className="w-full h-4 bg-white border border-gray-600 p-[1px]">
                  <div className="h-full bg-blue-800 animate-[loading_2.6s_ease-in_out_forwards]"></div>
                </div>
             </div>
          </div>
        </div>
      )}
      <style>{`
        @keyframes loading { from { width: 0%; } to { width: 100%; } }
        @keyframes aura-fade-in { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-aura-in { animation: aura-fade-in 0.4s ease-out; }
      `}</style>
    </div>
  );
};

const AuthPage = ({ isSignUp = false }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setIsLoading(true);
    try {
      if (isSignUp) await supabase.auth.signUp({ email, password });
      else await supabase.auth.signInWithPassword({ email, password });
      navigate('/studio');
    } catch (err: any) { alert(err.message); } finally { setIsLoading(false); }
  };

  return (
    <div className="min-h-screen bg-[#3b5a75] flex items-center justify-center p-4">
      <div className="win-panel w-full max-w-sm">
        <WinTitleBar title={isSignUp ? "Identity Registry" : "Secure Authentication"} />
        <form onSubmit={handleAuth} className="p-8 bg-[#d4d0c8] space-y-6">
           <div className="space-y-1">
             <label className="text-[10px] font-bold uppercase text-gray-600">User Identification (Email)</label>
             <input type="email" value={email} onChange={e => setEmail(e.target.value)} required className="w-full win-inset p-2 text-xs font-mono" />
           </div>
           <div className="space-y-1">
             <label className="text-[10px] font-bold uppercase text-gray-600">Access Key (Password)</label>
             <input type="password" value={password} onChange={e => setPassword(e.target.value)} required className="w-full win-inset p-2 text-xs font-mono" />
           </div>
           <button className="win-button w-full font-bold h-10 bg-blue-100">{isLoading ? "ESTABLISHING..." : (isSignUp ? "CREATE IDENTITY" : "AUTHORIZE")}</button>
           <div className="flex justify-between pt-4 border-t border-gray-400 text-[10px]">
             <Link to={isSignUp ? "/login" : "/signup"} className="text-blue-900 underline">{isSignUp ? "Existing User" : "New Registration"}</Link>
             <button type="button" onClick={() => navigate('/')}>Cancel</button>
           </div>
        </form>
      </div>
    </div>
  );
};

const StudioPage = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([{ role: 'assistant', content: "Aura_Core v1.0.4 Online. System Idle.", timestamp: new Date() }]);
  const [input, setInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [code, setCode] = useState('');
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [userId, setUserId] = useState<string | null>(null);
  const consoleRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase?.auth.getSession().then(({ data: { session } }) => { if (session?.user) setUserId(session.user.id); });
  }, []);

  useEffect(() => { if (consoleRef.current) consoleRef.current.scrollTop = consoleRef.current.scrollHeight; }, [messages, isGenerating]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input || isGenerating) return;
    const currentInput = input;
    setMessages(prev => [...prev, { role: 'user', content: currentInput, timestamp: new Date() }]);
    setInput('');
    setIsGenerating(true);
    try {
      const response = await generateWebsite(currentInput, messages);
      const codeMatch = response.match(/```html\s*([\s\S]*?)\s*```/i);
      const summaryMatch = response.match(/SUMMARY:\s*(.*)/i);
      const cleanCode = codeMatch ? codeMatch[1].trim() : response;
      const summary = summaryMatch ? summaryMatch[1].trim() : "Neural synthesis completed successfully.";
      
      setCode(cleanCode);
      setMessages(prev => [...prev, { role: 'assistant', content: summary, timestamp: new Date() }]);
      if (userId) storageService.saveProject(userId, "Project_Build", cleanCode, messages);
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `CRITICAL_ERROR: ${err.message}`, timestamp: new Date() }]);
    } finally { setIsGenerating(false); }
  };

  return (
    <div className="h-screen flex flex-col bg-[#d4d0c8] overflow-hidden">
      <div className="win-title-bar bg-gray-300 border-b border-gray-500 !text-black !font-normal px-2 py-1 flex items-center justify-between">
        <div className="flex gap-4 text-[11px] font-bold">
           <button onClick={() => navigate('/')} className="hover:text-blue-900">FILE</button>
           <button className="opacity-50">EDIT</button>
           <button className="opacity-50">VIEW</button>
           <button className="hover:text-blue-900">UPLINK</button>
        </div>
        <div className="text-[10px] font-mono text-gray-600">AURA_STUDIO_NODE_01</div>
      </div>

      <div className="flex-1 flex p-1 gap-1 overflow-hidden">
        {/* LEFT PANEL: CONSOLE */}
        <div className="w-80 flex flex-col gap-1">
          <div className="win-panel flex-1 flex flex-col overflow-hidden">
            <WinTitleBar title="Aura_Console" />
            <div ref={consoleRef} className="flex-1 bg-black text-green-500 font-mono text-[11px] p-4 overflow-y-auto leading-relaxed selection:bg-green-900">
               <div className="opacity-30 mb-4 border-b border-gray-800 pb-2">AURA STUDIO v1.0.4 [DEBUG MODE]<br/>ACTIVE_UPLINK: {userId ? 'SECURE' : 'GUEST'}</div>
               {messages.map((m, i) => (
                 <div key={i} className="mb-3 animate-aura-in">
                   <span className={m.role === 'user' ? 'text-blue-400' : 'text-green-500'}>{m.role === 'user' ? '> ' : 'AURA> '}</span>
                   <span className="text-gray-100">{m.content}</span>
                 </div>
               ))}
               {isGenerating && <div className="text-white animate-pulse">_PROCESSING_SYNTHESIS...</div>}
            </div>
            <form onSubmit={handleSend} className="p-3 bg-[#d4d0c8] border-t border-gray-400">
              <input value={input} onChange={e => setInput(e.target.value)} placeholder="Enter design command..." className="w-full win-inset p-3 text-xs font-mono mb-2 h-12" autoFocus />
              <button disabled={isGenerating} className="win-button w-full font-bold h-10 bg-gray-100 uppercase tracking-tighter">Synthesize Build</button>
            </form>
          </div>
        </div>

        {/* RIGHT PANEL: VISUALIZER */}
        <div className="flex-1 flex flex-col gap-1 overflow-hidden">
          <div className="win-panel flex-1 flex flex-col overflow-hidden">
             <div className="win-title-bar !bg-gray-400 flex justify-between">
                <div className="flex gap-1 h-full items-end">
                   <button onClick={() => setActiveTab('preview')} className={`px-4 py-1 text-[10px] border-t border-x font-bold ${activeTab === 'preview' ? 'bg-[#d4d0c8] text-black border-white' : 'bg-gray-500 text-gray-700 opacity-60'}`}>Visualizer</button>
                   <button onClick={() => setActiveTab('code')} className={`px-4 py-1 text-[10px] border-t border-x font-bold ${activeTab === 'code' ? 'bg-[#d4d0c8] text-black border-white' : 'bg-gray-500 text-gray-700 opacity-60'}`}>Source Viewer</button>
                </div>
                {code && <div className="flex gap-1 pr-1 pb-1"><button onClick={() => {navigator.clipboard.writeText(code); alert("Copied.");}} className="win-button py-0 px-2 h-4 text-[9px] bg-blue-100">COPY</button></div>}
             </div>
             <div className="flex-1 win-inset m-1 bg-white relative overflow-hidden">
                {activeTab === 'preview' ? (
                  code ? <iframe srcDoc={code} className="w-full h-full border-none animate-aura-in" sandbox="allow-scripts" /> : 
                  <div className="w-full h-full flex flex-col items-center justify-center opacity-20 italic p-20 text-center text-xs">Awaiting neural data to render interface visualization...</div>
                ) : (
                  <textarea readOnly value={code} className="w-full h-full p-6 font-mono text-[10px] resize-none outline-none bg-[#fafafa]" />
                )}
                {isGenerating && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-[1px] flex items-center justify-center z-50">
                    <div className="win-panel p-6 bg-[#d4d0c8] shadow-2xl flex flex-col items-center gap-3">
                       <div className="w-48 h-2 bg-gray-300 border border-gray-600 overflow-hidden"><div className="h-full bg-blue-800 w-1/2 animate-[loading_1s_linear_infinite]"></div></div>
                       <span className="text-[9px] font-bold uppercase tracking-widest text-gray-600">Reconstructing Atomic UI...</span>
                    </div>
                  </div>
                )}
             </div>
          </div>
        </div>
      </div>
      <style>{`
        @keyframes loading { from { transform: translateX(-100%); } to { transform: translateX(200%); } }
        ::-webkit-scrollbar { width: 14px; }
        ::-webkit-scrollbar-thumb { background: #d4d0c8; border: 1px solid #fff; box-shadow: inset -1px -1px #444; }
      `}</style>
    </div>
  );
};

// --- APP ---
const App = () => (
  <Router>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<AuthPage />} />
      <Route path="/signup" element={<AuthPage isSignUp />} />
      <Route path="/studio" element={<StudioPage />} />
      <Route path="*" element={<Navigate to="/" />} />
    </Routes>
  </Router>
);

const root = ReactDOM.createRoot(document.getElementById('root')!);
root.render(<App />);
