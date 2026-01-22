import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../lib/supabase.ts";

const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [isInitializing, setIsInitializing] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [dbStatus, setDbStatus] = useState<"checking" | "online" | "offline">(
    "checking",
  );

  useEffect(() => {
    const checkConnection = async () => {
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
      } catch {
        setDbStatus("offline");
      }
    };
    checkConnection();
  }, []);

  const handleInitialize = () => {
    setIsFadingOut(true);
    setTimeout(() => {
      setIsInitializing(true);
      setIsFadingOut(false);
      setTimeout(() => {
        navigate("/studio");
      }, 2800);
    }, 400);
  };

  return (
    <div className="min-h-screen bg-[#3b5a75] flex items-center justify-center p-4 overflow-hidden relative">
      <div
        className="fixed inset-0 opacity-10 pointer-events-none"
        style={{
          backgroundImage:
            "url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAYAAACp8Z5+AAAAAXNSR0IArs4c6QAAACZJREFUGF5jYmBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGBgYGAEAAAD//8Bf+8XAAAAAElFTkSuQmCC')",
        }}
      ></div>

      <div className="relative z-10 w-full flex items-center justify-center">
        {!isInitializing ? (
          <div
            className={`win-panel w-full max-w-2xl overflow-hidden shadow-2xl transition-all duration-400 ease-in-out ${isFadingOut ? "opacity-0 scale-[0.97] -translate-y-2" : "opacity-100 scale-100 translate-y-0"}`}
          >
            <div className="win-title-bar">
              <div className="flex items-center gap-1">
                <span className="bg-white text-blue-900 px-1 rounded-sm text-[9px] font-bold uppercase">
                  Aura
                </span>
                Aura Studio Setup
              </div>
            </div>

            <div className="flex bg-white">
              <div className="w-48 bg-blue-800 p-6 flex flex-col justify-between hidden sm:flex">
                <div className="text-white space-y-4">
                  <div className="w-12 h-12 bg-white rounded flex items-center justify-center shadow-lg">
                    <div className="w-8 h-8 border-4 border-blue-800 rounded-full animate-pulse"></div>
                  </div>
                  <p className="text-xs font-bold leading-tight uppercase tracking-wider">
                    Neural Web Architecture
                  </p>
                  <div className="h-px bg-blue-400 w-full opacity-30"></div>
                  <p className="text-[10px] opacity-70">
                    Engine: Aura_Core
                    <br />
                    v1.0.4-PRO
                  </p>
                </div>
                <div className="text-white text-[10px] font-mono opacity-40">
                  Build 2025.02
                </div>
              </div>

              <div className="flex-1 p-8 space-y-4 bg-[#f1f1f1]">
                <h1 className="text-2xl font-bold text-blue-900 italic">
                  Welcome to Aura Studio
                </h1>
                <p className="text-xs text-gray-800 leading-relaxed">
                  Experience a sophisticated environment for rapid web
                  prototyping. Aura utilizes neural synthesis to generate modern
                  interfaces from plain language.
                </p>

                <div className="win-inset p-3 bg-white text-[10px] text-gray-500 h-24 font-mono shadow-inner overflow-y-auto selection:bg-blue-100">
                  [ SYSTEM LOGS ]<br />
                  - Kernel Status: STABLE
                  <br />
                  - Neural Handshake: READY
                  <br />- Supabase Uplink: {dbStatus.toUpperCase()}
                  <br />
                  {dbStatus === "offline" && (
                    <span className="text-red-500">
                      - Warning: Remote archive unavailable
                    </span>
                  )}
                  <br />
                  <br />
                  [ NOTICE ]<br />
                  Proceeding initializes your local session.
                </div>

                <div className="pt-4 flex justify-end gap-2">
                  <button
                    onClick={handleInitialize}
                    className="win-button font-bold px-6 py-1 min-w-[100px] bg-blue-100"
                  >
                    Initialize &gt;
                  </button>
                  <button
                    onClick={() => navigate("/login")}
                    className="win-button px-6 py-1 min-w-[100px]"
                  >
                    Login
                  </button>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="win-panel w-[340px] shadow-2xl animate-aura-in">
            <div className="win-title-bar">
              <span>Aura_Core.sys Initializing...</span>
            </div>
            <div className="p-6 space-y-4">
              <div className="flex gap-4 items-start">
                <div className="w-10 h-10 bg-blue-800 flex items-center justify-center flex-shrink-0 border border-white shadow-inner">
                  <div className="w-6 h-6 border-2 border-white rounded-full animate-spin border-t-transparent"></div>
                </div>
                <div className="space-y-1">
                  <p className="text-[11px] font-bold">
                    Mounting Neural Environment...
                  </p>
                  <p className="text-[9px] text-gray-600 font-mono">
                    Verifying project integrity...
                  </p>
                </div>
              </div>

              <div className="space-y-1">
                <div className="flex justify-between text-[9px] font-mono font-bold">
                  <span>UPLINK_STATUS</span>
                  <span>SYNCHRONIZING</span>
                </div>
                <div className="w-full h-4 bg-white border border-gray-500 p-[1px]">
                  <div className="h-full bg-blue-800 w-full animate-[loading_2.6s_ease-in-out_forwards]"></div>
                </div>
              </div>
            </div>
            <div className="bg-gray-200 p-2 border-t border-gray-400 flex justify-end">
              <button
                disabled
                className="win-button opacity-50 px-4 py-0.5 text-[10px]"
              >
                Processing...
              </button>
            </div>
          </div>
        )}
      </div>

      <div className="absolute bottom-4 text-[10px] text-white opacity-40 flex items-center gap-2">
        <div
          className={`w-2 h-2 rounded-full ${dbStatus === "online" ? "bg-green-400" : "bg-red-400"}`}
        ></div>
        Aura_Core Node: 0x01-A | Link:{" "}
        {dbStatus === "online" ? "Active" : "Offline"}
      </div>

      <style>{`
        @keyframes loading {
          0% { width: 0%; }
          10% { width: 5%; }
          40% { width: 35%; }
          70% { width: 88%; }
          100% { width: 100%; }
        }
      `}</style>
    </div>
  );
};

export default LandingPage;
