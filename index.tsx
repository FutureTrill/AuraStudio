import React, { useState, useEffect, useRef } from "react";
import ReactDOM from "react-dom/client";
import {
  MemoryRouter as Router,
  Routes,
  Route,
  Navigate,
  useNavigate,
  Link,
} from "react-router-dom";
import { GoogleGenAI } from "@google/genai";
import { createClient } from "@supabase/supabase-js";

// --- CONFIG ---
const supabaseUrl = "https://dsskcarhhhqgirlilfua.supabase.co";
const supabaseAnonKey = "sb_publishable_vL2yEBwIu80oi75r1JVFNg_ne83yZUw";
const supabase =
  supabaseUrl && supabaseAnonKey
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

// --- TYPES ---
interface Message {
  role: "user" | "assistant" | "model";
  content: string;
  timestamp: Date;
}

// --- SERVICES ---
const storageService = {
  // BACKEND INTEGRATION: Replace these with your actual API endpoints
  async saveProject(userId: string, code: string, history: Message[]) {
    if (!supabase) return null;
    return await supabase
      .from("projects")
      .insert({
        user_id: userId,
        name: "Aura Build",
        code,
        chat_history: history,
      });
  },
  async getUserProjects(userId: string) {
    if (!supabase) return [];
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    return data || [];
  },
};

const generateWebsite = async (prompt: string, chatHistory: Message[]) => {
  // Use a fallback for local testing if process.env isn't populated yet
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error(
      "AURA_KEY_MISSING: Authentication with Gemini failed. Ensure API_KEY is set.",
    );
  }

  const ai = new GoogleGenAI({ apiKey });
  const systemInstruction = `
    You are AURA_CORE v2.0, a high-end web architect. 
    Output logic: 1. SUMMARY: [brief sentence] 2. CODE: [Standalone HTML with Tailwind].
    Use Lucide icons andInter font. Modern, sleek, professional design only.
  `;

  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: [
        ...chatHistory.map((h) => ({
          role: h.role === "user" ? "user" : "model",
          parts: [{ text: h.content }],
        })),
        { role: "user", parts: [{ text: prompt }] },
      ],
      config: { systemInstruction, temperature: 0.7 },
    });
    return response.text || "";
  } catch (err: any) {
    throw new Error(err.message);
  }
};

// --- PAGES ---
const LandingPage = () => {
  const navigate = useNavigate();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="min-h-screen bg-[#0a0a0c] flex flex-col items-center justify-center relative overflow-hidden px-6">
      {/* Background Decor */}
      <div className="absolute top-[-20%] left-[-10%] w-[60%] h-[60%] aura-gradient opacity-10 rounded-full blur-[120px] animate-pulse-slow"></div>
      <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-blue-900 opacity-10 rounded-full blur-[100px] animate-pulse-slow"></div>

      <div className="z-10 text-center space-y-8 max-w-3xl">
        <div className="inline-block glass-panel px-4 py-1.5 rounded-full text-[10px] uppercase tracking-[0.2em] font-semibold text-blue-400 mb-4 animate-fade-in">
          Neural Architecture Engine v2.0
        </div>
        <h1 className="text-6xl md:text-8xl font-bold tracking-tighter text-white animate-fade-in">
          Build the Web at{" "}
          <span className="aura-text-gradient">Thought Speed</span>.
        </h1>
        <p className="text-zinc-400 text-lg md:text-xl max-w-xl mx-auto leading-relaxed font-light">
          Aura Studio translates natural language into high-performance,
          responsive web interfaces using the Aura_Core synthesis engine.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center pt-8">
          <button
            onClick={() => navigate("/studio")}
            onMouseEnter={() => setIsHovered(true)}
            onMouseLeave={() => setIsHovered(false)}
            className="aura-gradient px-10 py-4 rounded-xl font-bold text-white shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-2"
          >
            Start Creating
            <div
              className={`transition-transform duration-300 ${isHovered ? "translate-x-1" : ""}`}
            >
              →
            </div>
          </button>
          <button
            onClick={() => navigate("/login")}
            className="glass-panel px-10 py-4 rounded-xl font-bold text-white transition-all hover:bg-white/5"
          >
            Sign In
          </button>
        </div>
      </div>

      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-6 opacity-30 grayscale hover:grayscale-0 transition-all duration-500">
        <span className="text-[10px] uppercase tracking-widest font-bold">
          Powered by Gemini 3.0
        </span>
        <div className="w-1 h-1 bg-zinc-600 rounded-full"></div>
        <span className="text-[10px] uppercase tracking-widest font-bold">
          Tailwind v4 Optimized
        </span>
      </div>
    </div>
  );
};

const AuthPage = ({ isSignUp = false }: { isSignUp?: boolean }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setLoading(true);
    try {
      if (isSignUp) await supabase.auth.signUp({ email, password });
      else await supabase.auth.signInWithPassword({ email, password });
      navigate("/studio");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#0a0a0c] flex items-center justify-center p-6">
      <div className="glass-panel w-full max-w-md p-10 rounded-3xl space-y-8 shadow-2xl">
        <div className="space-y-2">
          <h2 className="text-3xl font-bold text-white tracking-tight">
            {isSignUp ? "Join Aura" : "Welcome Back"}
          </h2>
          <p className="text-zinc-500 text-sm">
            {isSignUp
              ? "Start your journey into AI synthesis."
              : "Access your saved neural nodes."}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">
              Electronic Mail
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="name@nexus.com"
            />
          </div>
          <div className="space-y-2">
            <label className="text-[10px] uppercase tracking-widest font-bold text-zinc-500">
              Access Key
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-blue-500 transition-colors"
              placeholder="••••••••"
            />
          </div>
          <button className="w-full aura-gradient py-4 rounded-xl font-bold text-white shadow-lg hover:opacity-90 transition-all">
            {loading
              ? "Authenticating..."
              : isSignUp
                ? "Create Identity"
                : "Establish Link"}
          </button>
        </form>

        <div className="pt-6 border-t border-zinc-800 flex justify-between items-center text-xs">
          <Link
            to={isSignUp ? "/login" : "/signup"}
            className="text-blue-400 hover:text-blue-300 transition-colors font-medium"
          >
            {isSignUp ? "Existing user?" : "New registration?"}
          </Link>
          <button
            onClick={() => navigate("/")}
            className="text-zinc-500 hover:text-white transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
};

const StudioPage = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "AURA_CORE initialized. Awaiting design parameters.",
      timestamp: new Date(),
    },
  ]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [code, setCode] = useState("");
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [userId, setUserId] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    supabase?.auth
      .getSession()
      .then(({ data: { session } }) => setUserId(session?.user?.id || null));
  }, []);

  useEffect(() => {
    if (scrollRef.current)
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, isGenerating]);

  const handleSynthesize = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input || isGenerating) return;

    const userMsg: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsGenerating(true);

    try {
      const response = await generateWebsite(input, messages);
      const codeMatch = response.match(/```html\s*([\s\S]*?)\s*```/i);
      const summaryMatch = response.match(/SUMMARY:\s*(.*)/i);
      const cleanCode = codeMatch ? codeMatch[1].trim() : response;
      const summary = summaryMatch
        ? summaryMatch[1].trim()
        : "Neural synthesis completed successfully.";

      setCode(cleanCode);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: summary, timestamp: new Date() },
      ]);

      if (userId) storageService.saveProject(userId, cleanCode, messages);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `CRITICAL_ERROR: ${err.message}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="h-screen flex flex-col bg-[#050505] text-white">
      {/* CLEAN HEADER */}
      <header className="h-14 border-b border-zinc-800 bg-zinc-950 flex items-center justify-between px-6 z-50">
        <div className="flex items-center gap-6">
          <button
            onClick={() => navigate("/")}
            className="flex items-center gap-2 group"
          >
            <div className="w-8 h-8 aura-gradient rounded-lg flex items-center justify-center font-bold text-lg group-hover:scale-110 transition-transform">
              A
            </div>
            <span className="font-bold tracking-tighter text-lg">
              Aura Studio
            </span>
          </button>
          <div className="h-4 w-px bg-zinc-800"></div>
          <div className="flex items-center gap-2 text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
            <div
              className={`w-2 h-2 rounded-full ${isGenerating ? "bg-amber-500 animate-pulse" : "bg-green-500"}`}
            ></div>
            {isGenerating ? "Synthesizing..." : "System Ready"}
          </div>
        </div>

        <div className="flex items-center gap-4">
          {userId && (
            <div className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">
              {userId.slice(0, 8)}@nexus
            </div>
          )}
          <button
            onClick={() => navigate("/")}
            className="text-zinc-400 hover:text-white transition-colors"
          >
            <i data-lucide="log-out" className="w-4 h-4"></i>
          </button>
        </div>
      </header>

      {/* WORKSPACE */}
      <main className="flex-1 flex overflow-hidden p-3 gap-3">
        {/* CONSOLE PANEL */}
        <aside className="w-96 flex flex-col gap-3">
          <section className="glass-panel flex-1 flex flex-col rounded-2xl overflow-hidden shadow-2xl">
            <div className="px-4 py-3 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
              <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-zinc-400">
                Aura_Console
              </span>
              <div className="flex gap-1">
                <div className="w-2 h-2 rounded-full bg-zinc-700"></div>
                <div className="w-2 h-2 rounded-full bg-zinc-700"></div>
              </div>
            </div>
            <div
              ref={scrollRef}
              className="flex-1 p-5 overflow-y-auto space-y-6 font-mono text-[11px] leading-relaxed"
            >
              {messages.map((m, i) => (
                <div
                  key={i}
                  className={`flex gap-3 ${m.role === "user" ? "opacity-100" : "opacity-80"}`}
                >
                  <span
                    className={
                      m.role === "user"
                        ? "text-blue-400 font-bold"
                        : "text-purple-400 font-bold"
                    }
                  >
                    {m.role === "user" ? "USR>" : "AURA>"}
                  </span>
                  <div className="flex-1 text-zinc-300">{m.content}</div>
                </div>
              ))}
              {isGenerating && (
                <div className="animate-pulse text-zinc-500 italic">
                  Processing design vectors...
                </div>
              )}
            </div>
            <form
              onSubmit={handleSynthesize}
              className="p-4 border-t border-zinc-800 bg-zinc-950"
            >
              <div className="relative">
                <input
                  autoFocus
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Describe your site components..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3.5 text-xs font-mono focus:outline-none focus:border-blue-500 transition-all pr-12"
                />
                <button
                  disabled={isGenerating}
                  className="absolute right-2 top-2 p-2 hover:bg-zinc-800 rounded-lg text-zinc-400 hover:text-white transition-all disabled:opacity-30"
                >
                  <svg
                    className="w-5 h-5"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </button>
              </div>
            </form>
          </section>
        </aside>

        {/* VISUALIZER PANEL */}
        <section className="flex-1 glass-panel rounded-2xl flex flex-col overflow-hidden shadow-2xl border-zinc-800">
          <div className="px-4 py-1.5 border-b border-zinc-800 bg-zinc-900/50 flex justify-between items-center">
            <div className="flex gap-2">
              <button
                onClick={() => setActiveTab("preview")}
                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === "preview" ? "text-white border-b border-blue-500" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                Visualizer
              </button>
              <button
                onClick={() => setActiveTab("code")}
                className={`px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all ${activeTab === "code" ? "text-white border-b border-blue-500" : "text-zinc-500 hover:text-zinc-300"}`}
              >
                Source Code
              </button>
            </div>
            <div className="flex gap-2">
              {code && (
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(code);
                    alert("Uplink Successful: Code copied.");
                  }}
                  className="px-3 py-1 bg-zinc-800 hover:bg-zinc-700 rounded text-[9px] font-bold uppercase transition-all"
                >
                  Copy
                </button>
              )}
            </div>
          </div>

          <div className="flex-1 bg-white relative">
            {activeTab === "preview" ? (
              code ? (
                <iframe
                  srcDoc={code}
                  className="w-full h-full border-none shadow-inner"
                  sandbox="allow-scripts"
                />
              ) : (
                <div className="h-full bg-zinc-950 flex flex-col items-center justify-center space-y-4 opacity-30 grayscale p-20 text-center">
                  <div className="w-20 h-20 aura-gradient rounded-3xl animate-pulse"></div>
                  <p className="text-xs font-mono">
                    NEURAL_READY: Submit parameters via console to initialize
                    viewport.
                  </p>
                </div>
              )
            ) : (
              <textarea
                readOnly
                value={code}
                className="w-full h-full bg-zinc-950 p-8 font-mono text-[11px] text-blue-300/80 resize-none focus:outline-none selection:bg-blue-500/30"
              />
            )}

            {isGenerating && (
              <div className="absolute inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center">
                <div className="glass-panel p-8 rounded-2xl flex flex-col items-center gap-4 animate-in zoom-in duration-300">
                  <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-[10px] font-bold uppercase tracking-[0.3em] text-blue-400">
                    Refining Build...
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>
      </main>
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

const root = ReactDOM.createRoot(document.getElementById("root")!);
root.render(<App />);
