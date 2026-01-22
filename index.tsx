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

// --- DATABASE CONFIGURATION ---
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

type EngineType = "aura_core" | "neural_gpt";

// --- SERVICES ---
const storageService = {
  async getUserProfile(userId: string) {
    if (!supabase) return null;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();
    return data;
  },
  async getAllProjects(userId: string) {
    if (!supabase) return [];
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    return data || [];
  },
  async getLatestProject(userId: string) {
    if (!supabase) return null;
    const { data } = await supabase
      .from("projects")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false })
      .limit(1)
      .single();
    return data;
  },
  async saveProject(
    userId: string,
    name: string,
    code: string,
    chatHistory: Message[],
  ) {
    if (!supabase) return null;
    await supabase
      .from("projects")
      .insert({ user_id: userId, name, code, chat_history: chatHistory });
    const profile = await this.getUserProfile(userId);
    const newCount = (profile?.usage_count || 0) + 1;
    await supabase
      .from("profiles")
      .update({ usage_count: newCount })
      .eq("id", userId);
    return { success: true, newCount };
  },
};

const generateWebsite = async (prompt: string, chatHistory: any[] = []) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  const systemInstruction = `
    You are the AURA_CORE v1.0.4 Senior Full Stack Architect.
    Respond in two parts: SUMMARY (one sentence) and CODE (full HTML/Tailwind/JS).
    Use Tailwind CSS, Lucide Icons. Single-file output wrapped in \`\`\`html [CODE] \`\`\`.
  `;
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
};

// --- PAGES ---
const LandingPage = () => {
  const navigate = useNavigate();
  const [isInitializing, setIsInitializing] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [dbStatus, setDbStatus] = useState("checking");

  // Fixed: Replaced Promise chain with async/await to avoid 'Property catch does not exist on type PromiseLike' error.
  useEffect(() => {
    const checkDbStatus = async () => {
      if (!supabase) {
        setDbStatus("offline");
        return;
      }
      try {
        await supabase
          .from("profiles")
          .select("count", { count: "exact", head: true })
          .limit(1);
        setDbStatus("online");
      } catch (err) {
        setDbStatus("offline");
      }
    };
    checkDbStatus();
  }, []);

  const handleInitialize = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      setIsInitializing(true);
      setIsFadingOut(false);
      setTimeout(() => navigate("/studio"), 2800);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#3b5a75] flex items-center justify-center p-4 overflow-hidden relative">
      {!isInitializing ? (
        <div
          className={`win-panel w-full max-w-2xl transition-all duration-400 ${isFadingOut ? "opacity-0 scale-95" : "opacity-100 scale-100"}`}
        >
          <div className="win-title-bar">
            <span>Aura Studio Setup</span>
          </div>
          <div className="flex bg-white">
            <div className="w-48 bg-blue-800 p-6 text-white hidden sm:block">
              <p className="text-xs font-bold uppercase tracking-wider">
                Aura_Core Node
              </p>
              <p className="text-[10px] opacity-70">Build 2025.02</p>
            </div>
            <div className="flex-1 p-8 space-y-4 bg-[#f1f1f1]">
              <h1 className="text-2xl font-bold text-blue-900 italic">
                Welcome to Aura Studio
              </h1>
              <p className="text-xs text-gray-800">
                Experience rapid prototyping via neural synthesis.
              </p>
              <div className="win-inset p-3 bg-white text-[10px] h-24 font-mono overflow-y-auto">
                [ SYSTEM LOGS ]<br />- Kernel: STABLE
                <br />- Uplink: {dbStatus.toUpperCase()}
              </div>
              <div className="pt-4 flex justify-end gap-2">
                <button
                  onClick={handleInitialize}
                  className="win-button font-bold bg-blue-100"
                >
                  Initialize &gt;
                </button>
                <button
                  onClick={() => navigate("/login")}
                  className="win-button"
                >
                  Login
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="win-panel w-[340px] p-6 animate-aura-in">
          <p className="text-sm font-bold">Mounting Environment...</p>
          <div className="w-full h-4 bg-white border border-gray-500 mt-4">
            <div className="h-full bg-blue-800 animate-[loading_2.6s_ease-in-out_forwards]"></div>
          </div>
        </div>
      )}
      <style>{`@keyframes loading { from { width: 0%; } to { width: 100%; } }`}</style>
    </div>
  );
};

const AuthPage = ({ isSignUp = false }) => {
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabase) return;
    setIsLoading(true);
    try {
      if (isSignUp) await supabase.auth.signUp({ email, password });
      else await supabase.auth.signInWithPassword({ email, password });
      navigate("/studio");
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-[#3b5a75]">
      <div className="win-panel w-full max-w-[400px]">
        <div className="win-title-bar">
          <span>Security Protocol</span>
        </div>
        <form onSubmit={handleAuth} className="p-6 bg-[#d4d0c8] space-y-4">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Email"
            className="w-full win-inset p-2 text-xs"
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Password"
            className="w-full win-inset p-2 text-xs"
          />
          <button className="win-button w-full font-bold">
            {isLoading ? "..." : isSignUp ? "Sign Up" : "Login"}
          </button>
          <div className="flex justify-between text-[10px] pt-4">
            <Link to={isSignUp ? "/login" : "/signup"} className="underline">
              {isSignUp ? "Login" : "Sign Up"}
            </Link>
            <button onClick={() => navigate("/")} type="button">
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const StudioPage = () => {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([
    { role: "assistant", content: "Aura_Core Ready.", timestamp: new Date() },
  ]);
  const [input, setInput] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [code, setCode] = useState("");
  const [activeTab, setActiveTab] = useState<"preview" | "code">("preview");
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    supabase?.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) setUserId(session.user.id);
    });
  }, []);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input || isGenerating) return;
    const newMsg: Message = {
      role: "user",
      content: input,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, newMsg]);
    setInput("");
    setIsGenerating(true);
    try {
      const response = await generateWebsite(input, messages);
      const codeMatch = response.match(/```html\s*([\s\S]*?)\s*```/i);
      const summaryMatch = response.match(/SUMMARY:\s*(.*)/i);
      const cleanCode = codeMatch ? codeMatch[1].trim() : response;
      const summary = summaryMatch ? summaryMatch[1].trim() : "Build complete.";

      setCode(cleanCode);
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: summary, timestamp: new Date() },
      ]);
      if (userId)
        storageService.saveProject(userId, "New Build", cleanCode, messages);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          content: `Error: ${err.message}`,
          timestamp: new Date(),
        },
      ]);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="flex h-screen flex-col bg-[#d4d0c8]">
      <div className="flex bg-[#d4d0c8] p-1 border-b border-gray-400 gap-4 text-[11px] items-center">
        <button
          onClick={() => navigate("/")}
          className="bg-blue-800 text-white px-3 py-0.5 rounded-sm"
        >
          EXIT
        </button>
        <span className="font-bold text-gray-700">Aura_Studio IDE</span>
      </div>
      <div className="flex-1 flex overflow-hidden p-1 gap-1">
        <div className="w-[340px] flex flex-col gap-1">
          <div className="win-panel flex-1 flex flex-col overflow-hidden">
            <div className="win-title-bar">
              <span>Console</span>
            </div>
            <div className="flex-1 bg-black text-green-500 font-mono text-[11px] p-3 overflow-y-auto">
              {messages.map((m, i) => (
                <div key={i} className="mb-2">
                  <span className="opacity-50">
                    {m.role === "user" ? "> " : "AURA> "}
                  </span>
                  {m.content}
                </div>
              ))}
              {isGenerating && (
                <div className="animate-pulse">_PROCESSING...</div>
              )}
            </div>
            <form
              onSubmit={handleSend}
              className="p-2 border-t border-gray-400 bg-[#d4d0c8]"
            >
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Describe your site..."
                className="w-full win-inset p-2 text-xs font-mono mb-2"
              />
              <button
                disabled={isGenerating}
                className="win-button w-full font-bold"
              >
                GENERATE
              </button>
            </form>
          </div>
        </div>
        <div className="flex-1 flex flex-col gap-1">
          <div className="win-panel flex-1 flex flex-col overflow-hidden">
            <div className="win-title-bar flex justify-between">
              <div className="flex gap-1">
                <button
                  onClick={() => setActiveTab("preview")}
                  className={`px-4 py-0.5 ${activeTab === "preview" ? "bg-[#d4d0c8] text-black" : "bg-gray-400 opacity-70"}`}
                >
                  Visualizer
                </button>
                <button
                  onClick={() => setActiveTab("code")}
                  className={`px-4 py-0.5 ${activeTab === "code" ? "bg-[#d4d0c8] text-black" : "bg-gray-400 opacity-70"}`}
                >
                  Source
                </button>
              </div>
            </div>
            <div className="flex-1 win-inset m-1 bg-white relative">
              {activeTab === "preview" ? (
                code ? (
                  <iframe srcDoc={code} className="w-full h-full border-none" />
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-400 italic text-xs">
                    Awaiting Build Data...
                  </div>
                )
              ) : (
                <textarea
                  readOnly
                  value={code}
                  className="w-full h-full p-4 font-mono text-[10px] resize-none outline-none"
                />
              )}
            </div>
          </div>
        </div>
      </div>
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
