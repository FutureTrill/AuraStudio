
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { generateWebsite, EngineType } from '../services/gemini';
import { storageService } from '../services/storage';
import { Message } from '../types';
import { supabase } from '../lib/supabase';

const StudioPage: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([
    { role: 'assistant', content: "Aura_Core v1.0.4 Online. System is idle. Waiting for design parameters.", timestamp: new Date() }
  ]);
  const [userInput, setUserInput] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [isShuttingDown, setIsShuttingDown] = useState(false);
  const [isEntering, setIsEntering] = useState(true);
  const [selectedEngine, setSelectedEngine] = useState<EngineType>('aura_core');
  const [generatedCode, setGeneratedCode] = useState<string>('');
  const [activeTab, setActiveTab] = useState<'preview' | 'code'>('preview');
  const [promptCount, setPromptCount] = useState(0);
  const [showAuthGate, setShowAuthGate] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [projectHistory, setProjectHistory] = useState<any[]>([]);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  
  const scrollRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  useEffect(() => {
    const entryTimer = setTimeout(() => setIsEntering(false), 1000);
    
    const initializeSession = async () => {
      if (!supabase) {
        const storedCount = parseInt(localStorage.getItem('aura_prompt_count') || '0', 10);
        setPromptCount(storedCount);
        if (storedCount >= 3) setShowAuthGate(true);
        return;
      }

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const uid = session.user.id;
          setUserId(uid);
          
          const [profile, latestProject, history] = await Promise.all([
            storageService.getUserProfile(uid),
            storageService.getLatestProject(uid),
            storageService.getAllProjects(uid)
          ]);

          if (profile) setPromptCount(profile.usage_count);
          if (history) setProjectHistory(history);
          if (latestProject) {
            setGeneratedCode(latestProject.code);
            if (latestProject.chat_history) setMessages(latestProject.chat_history);
          }
        } else {
          const storedCount = parseInt(localStorage.getItem('aura_prompt_count') || '0', 10);
          setPromptCount(storedCount);
          if (storedCount >= 3) setShowAuthGate(true);
        }
      } catch (err) {
        console.error("Neural handshake failed:", err);
      }
    };
    
    initializeSession();
    return () => clearTimeout(entryTimer);
  }, []);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages]);

  const loadProjectFromHistory = (project: any) => {
    setGeneratedCode(project.code);
    if (project.chat_history) setMessages(project.chat_history);
    setIsHistoryOpen(false);
  };

  const downloadCode = () => {
    if (!generatedCode) return;
    const blob = new Blob([generatedCode], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `aura_build_${new Date().getTime()}.html`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const copyToClipboard = () => {
    if (!generatedCode) return;
    navigator.clipboard.writeText(generatedCode);
    alert("Source code copied to neural clipboard.");
  };

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!userInput.trim() || isGenerating) return;

    if (!userId && promptCount >= 3) {
      setShowAuthGate(true);
      return;
    }

    const currentPrompt = userInput;
    const newUserMessage: Message = { role: 'user', content: currentPrompt, timestamp: new Date() };
    const updatedMessages = [...messages, newUserMessage];
    setMessages(updatedMessages);
    setUserInput('');
    setIsGenerating(true);

    try {
      const chatHistory = updatedMessages.slice(-6).map(m => ({ role: m.role, content: m.content }));
      const responseText = await generateWebsite(currentPrompt, chatHistory, selectedEngine);
      
      const summaryMatch = responseText.match(/SUMMARY:\s*(.*)/i);
      const codeBlockRegex = /```html\s*([\s\S]*?)\s*```/i;
      const codeMatch = responseText.match(codeBlockRegex);
      
      const summary = summaryMatch ? summaryMatch[1].trim() : `Build complete using ${selectedEngine.toUpperCase()}.`;
      const code = codeMatch ? codeMatch[1].trim() : responseText.trim();
      
      const finalMessages: Message[] = [...updatedMessages, { role: 'assistant', content: summary, timestamp: new Date() }];
      
      setGeneratedCode(code);
      setMessages(finalMessages);
      
      if (userId) {
        const saveResult = await storageService.saveProject(
          userId, 
          `Build_${new Date().toISOString().slice(5,16).replace('T',' ')}`, 
          code, 
          finalMessages
        );
        if (saveResult) {
          setPromptCount(saveResult.newCount);
          const history = await storageService.getAllProjects(userId);
          setProjectHistory(history);
        }
      } else {
        const newCount = promptCount + 1;
        setPromptCount(newCount);
        localStorage.setItem('aura_prompt_count', newCount.toString());
      }
    } catch (error: any) {
      setMessages(prev => [...prev, { role: 'assistant', content: `SYS_ERROR: ${error.message}`, timestamp: new Date() }]);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleExit = async () => {
    setIsShuttingDown(true);
    setTimeout(async () => {
      if (supabase) await supabase.auth.signOut();
      localStorage.removeItem('aura_prompt_count');
      navigate('/');
    }, 1200);
  };

  return (
    <div className={`flex h-screen flex-col bg-[#d4d0c8] select-none overflow-hidden font-sans transition-all duration-1000 ${isShuttingDown ? 'opacity-0' : 'opacity-100'}`}>
      
      {isEntering && (
        <div className="fixed inset-0 bg-[#3b5a75] z-[10001] flex items-center justify-center animate-out fade-out duration-1000 fill-mode-forwards">
           <div className="text-white font-bold text-sm tracking-widest animate-pulse uppercase">Establishing Workspace...</div>
        </div>
      )}

      {isShuttingDown && (
        <div className="fixed inset-0 bg-[#3b5a75] z-[10000] flex flex-col items-center justify-center animate-in fade-in duration-500">
          <div className="win-panel p-8 bg-[#d4d0c8] text-black shadow-2xl border-4 border-white flex flex-col items-center gap-4">
             <div className="w-10 h-10 border-4 border-blue-800 rounded-full border-t-transparent animate-spin"></div>
             <p className="text-[11px] font-bold uppercase tracking-wider">Saving Session State...</p>
          </div>
        </div>
      )}

      <div className="flex bg-[#d4d0c8] p-1 border-b border-gray-400 gap-4 text-[11px] items-center">
        <button onClick={handleExit} className="flex items-center gap-1 font-bold px-3 py-0.5 bg-blue-800 text-white rounded-sm active:shadow-inner hover:bg-blue-700">
          <span className="text-[10px]">■</span> EXIT
        </button>

        <button 
          onClick={() => setIsHistoryOpen(!isHistoryOpen)} 
          className={`win-button font-bold text-[10px] uppercase ${isHistoryOpen ? 'bg-gray-400' : ''}`}
        >
          {isHistoryOpen ? 'Hide History' : 'Project History'}
        </button>

        <div className="flex items-center gap-2 border-l border-gray-400 pl-4">
          <span className="text-[10px] font-bold text-gray-700 uppercase">Engine:</span>
          <select 
            value={selectedEngine}
            onChange={(e) => setSelectedEngine(e.target.value as EngineType)}
            className="win-inset px-2 py-0.5 text-[10px] font-bold outline-none border border-gray-500 bg-white cursor-pointer hover:border-blue-600 transition-colors"
          >
            <option value="aura_core">Aura_Core [Flash]</option>
            <option value="neural_gpt">Aura_Pro [GPT]</option>
          </select>
        </div>

        <div className="ml-auto flex items-center gap-3 pr-2 border-l border-gray-400 pl-3">
          <div className="flex items-center gap-2">
            <div className={`w-2 h-2 rounded-full ${supabase ? (userId ? 'bg-green-500' : 'bg-blue-500') : 'bg-red-500'}`}></div>
            <span className="text-[10px] uppercase font-bold text-gray-500 tracking-tighter">
              {supabase ? (userId ? 'Cloud Sync Active' : 'Local Workspace') : 'Archive Offline'}
            </span>
          </div>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden p-1 gap-1 relative">
        {isHistoryOpen && (
          <div className="absolute inset-y-0 left-0 w-[240px] bg-[#d4d0c8] border-r border-gray-400 z-50 shadow-2xl flex flex-col animate-in slide-in-from-left duration-300">
            <div className="win-title-bar">
              <span>Saved Projects</span>
              <button onClick={() => setIsHistoryOpen(false)} className="px-1 bg-red-800">X</button>
            </div>
            <div className="flex-1 overflow-y-auto p-2 space-y-1 custom-scrollbar">
              {projectHistory.length === 0 ? (
                <div className="text-[10px] italic text-gray-600 p-4">No saved projects in this workspace.</div>
              ) : (
                projectHistory.map((project) => (
                  <button 
                    key={project.id}
                    onClick={() => loadProjectFromHistory(project)}
                    className="w-full text-left p-2 border border-transparent hover:border-white hover:bg-gray-100 transition-all"
                  >
                    <div className="text-[10px] font-bold truncate">{project.name}</div>
                    <div className="text-[8px] text-gray-500 uppercase">{new Date(project.created_at).toLocaleString()}</div>
                  </button>
                ))
              )}
            </div>
          </div>
        )}

        <div className="w-[340px] flex flex-col gap-1">
           <div className="win-panel flex-1 flex flex-col overflow-hidden">
             <div className="win-title-bar">
               <div className="flex items-center gap-2"><span>Aura_Console</span></div>
               <button onClick={() => setMessages([messages[0]])} className="w-4 h-4 win-button p-0 flex items-center justify-center text-[10px] bg-red-700 text-white font-bold">X</button>
             </div>
             
             <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 font-mono text-[11px] bg-black text-[#00ff00] custom-scrollbar shadow-inner selection:bg-green-900">
                <div className="mb-4 opacity-30 text-[9px] border-b border-gray-800 pb-2">
                  AURA STUDIO v1.0.4<br/>
                  ACTIVE_LINK: {userId ? 'IDENTIFIED' : 'GUEST'}
                </div>
                {messages.map((msg, idx) => (
                  <div key={idx} className="mb-3 animate-aura-in">
                    <span className={msg.role === 'user' ? 'text-blue-400' : 'text-green-500'}>
                      {msg.role === 'user' ? '> ' : 'AURA> '}
                    </span>
                    <span className="text-gray-100">{msg.content}</span>
                  </div>
                ))}
                {isGenerating && <div className="text-white animate-pulse">_PROCESSING...</div>}
             </div>
             
             <div className="p-3 bg-[#d4d0c8] border-t border-gray-400 shadow-inner">
               <form onSubmit={handleSendMessage} className="space-y-2">
                 <input autoFocus value={userInput} onChange={(e) => setUserInput(e.target.value)} placeholder="Describe your website..." className="w-full win-inset px-3 py-2 text-xs font-mono outline-none h-10 border-2 border-gray-500 focus:border-blue-600 transition-colors" />
                 <button type="submit" disabled={isGenerating} className="win-button w-full font-bold h-9 bg-gray-200 uppercase tracking-tight">Generate Build</button>
               </form>
             </div>
           </div>

           <div className="win-panel p-3 bg-[#d4d0c8]">
              <div className="text-[10px] font-bold border-b border-gray-500 pb-1 mb-3 uppercase tracking-tight text-gray-700">Resource Monitor</div>
              <div className="space-y-3">
                <div className="w-full h-4 bg-white border border-gray-500 p-[1px] relative">
                   <div className={`h-full bg-blue-800 transition-all duration-700 ${isGenerating ? 'w-[85%]' : 'w-[8%]'}`}></div>
                   <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold mix-blend-difference text-white uppercase">Engine Load</span>
                </div>
                <div className="w-full h-4 bg-white border border-gray-500 p-[1px] relative">
                   <div className={`h-full ${userId ? 'bg-green-600' : 'bg-orange-600'} transition-all duration-500`} style={{ width: userId ? '100%' : `${(promptCount/3)*100}%` }}></div>
                   <span className="absolute inset-0 flex items-center justify-center text-[8px] font-bold mix-blend-difference text-white uppercase">Session Tokens</span>
                </div>
              </div>
           </div>
        </div>

        <div className="flex-1 flex flex-col gap-1 overflow-hidden">
           <div className="win-panel flex-1 flex flex-col overflow-hidden">
             <div className="win-title-bar">
               <div className="flex gap-1 items-end pt-1">
                 <button onClick={() => setActiveTab('preview')} className={`px-4 py-1 text-[10px] border-t border-x font-bold transition-all ${activeTab === 'preview' ? 'bg-[#d4d0c8] border-white text-black -mb-[1px] z-10' : 'bg-gray-400 border-gray-600 text-gray-700 hover:bg-gray-300'}`}>Visualizer</button>
                 <button onClick={() => setActiveTab('code')} className={`px-4 py-1 text-[10px] border-t border-x font-bold transition-all ${activeTab === 'code' ? 'bg-[#d4d0c8] border-white text-black -mb-[1px] z-10' : 'bg-gray-400 border-gray-600 text-gray-700 hover:bg-gray-300'}`}>Source Viewer</button>
               </div>
               {activeTab === 'code' && generatedCode && (
                 <div className="flex gap-1 py-1 pr-1">
                    <button onClick={copyToClipboard} className="win-button py-0 px-2 h-4 text-[9px] bg-blue-100 font-bold uppercase">Copy</button>
                    <button onClick={downloadCode} className="win-button py-0 px-2 h-4 text-[9px] bg-green-100 font-bold uppercase">Download</button>
                 </div>
               )}
             </div>

             <div className="flex-1 win-inset m-1 bg-white relative overflow-hidden">
               {activeTab === 'preview' ? (
                 generatedCode ? <iframe srcDoc={generatedCode} title="preview" className="w-full h-full border-none animate-aura-in" /> : 
                 <div className="w-full h-full flex flex-col items-center justify-center text-center opacity-30 italic text-xs p-10 animate-pulse">Waiting for design command to generate visualization.</div>
               ) : (
                 <textarea value={generatedCode} readOnly className="w-full h-full p-4 font-mono text-[11px] outline-none border-none resize-none bg-[#fafafa] custom-scrollbar selection:bg-blue-100" />
               )}
               {isGenerating && (
                 <div className="absolute inset-0 bg-white/40 backdrop-blur-[1px] flex items-center justify-center z-20">
                    <div className="win-panel p-4 bg-[#d4d0c8] shadow-2xl flex flex-col items-center gap-2">
                       <div className="w-24 h-1 bg-gray-300 border border-gray-600 overflow-hidden"><div className="h-full bg-blue-800 w-1/2 animate-loading-slide"></div></div>
                       <span className="text-[9px] font-bold uppercase tracking-wider text-gray-600">Generating Interface...</span>
                    </div>
                 </div>
               )}
             </div>
           </div>
        </div>
      </div>

      <style>{`
        @keyframes loading-slide { from { transform: translateX(-100%); } to { transform: translateX(200%); } }
        .animate-loading-slide { animation: loading-slide 1.2s infinite linear; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: #d4d0c8; border: 1px solid #fff; box-shadow: inset -1px -1px #444; }
      `}</style>

      {showAuthGate && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-[9999] backdrop-blur-[1px] animate-aura-in">
          <div className="win-panel w-[320px] shadow-2xl">
             <div className="win-title-bar bg-red-800"><div>Quota Reached</div></div>
             <div className="p-5 bg-[#d4d0c8] space-y-4">
                <p className="text-[11px] font-bold">Standard session quota reached (3/3). Create an account to continue saving your workspace projects.</p>
                <div className="flex gap-2">
                   <button onClick={() => navigate('/login')} className="win-button flex-1 font-bold py-2 bg-blue-100">Login / Signup</button>
                   <button onClick={() => setShowAuthGate(false)} className="win-button flex-1 py-2">Close</button>
                </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StudioPage;
