import React from "react";
import { Brain, HeartPulse, GraduationCap, Activity, Sparkles } from "lucide-react";
import { ContextMode } from "../types/emotion";

interface NavbarProps {
  currentTab: "landing" | "analysis" | "results" | "analytics";
  setCurrentTab: (tab: "landing" | "analysis" | "results" | "analytics") => void;
  contextMode: ContextMode;
  setContextMode: (mode: ContextMode) => void;
  isBackendConnected: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setCurrentTab,
  contextMode,
  setContextMode,
  isBackendConnected,
}) => {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-[#070913]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand */}
        <div
          onClick={() => setCurrentTab("landing")}
          className="flex items-center gap-3 cursor-pointer group"
        >
          <div className="relative w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-purple-600 p-[1.5px] shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all">
            <div className="w-full h-full bg-[#070913] rounded-[10px] flex items-center justify-center">
              <Brain className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent">
                EmotionVerse
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                AI
              </span>
            </div>
            <p className="text-[11px] text-slate-400 font-medium hidden sm:block">
              Multi-Modal Emotion Intelligence
            </p>
          </div>
        </div>

        {/* Navigation Tabs */}
        <nav className="hidden md:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800/60">
          <button
            onClick={() => setCurrentTab("landing")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentTab === "landing"
                ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setCurrentTab("analysis")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              currentTab === "analysis"
                ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            Analysis Studio
          </button>
          <button
            onClick={() => setCurrentTab("results")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              currentTab === "results"
                ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            Fusion Dashboard
          </button>
          <button
            onClick={() => setCurrentTab("analytics")}
            className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
              currentTab === "analytics"
                ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm"
                : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            History & Trends
          </button>
        </nav>

        {/* Right Controls: Mode Toggle & Health Indicator */}
        <div className="flex items-center gap-3">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setContextMode("education")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                contextMode === "education"
                  ? "bg-blue-600/30 text-blue-300 border border-blue-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Education Mode: Focus on cognitive load, engagement, and learning strategies"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Education</span>
            </button>
            <button
              onClick={() => setContextMode("healthcare")}
              className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium transition-all ${
                contextMode === "healthcare"
                  ? "bg-purple-600/30 text-purple-300 border border-purple-500/40"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Healthcare Support Mode: Non-diagnostic supportive wellness & grounding"
            >
              <HeartPulse className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Healthcare</span>
            </button>
          </div>

          {/* Backend Status Dot */}
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-900 border border-slate-800 text-[11px]"
            title={isBackendConnected ? "Connected to FastAPI Backend Engine" : "Backend Offline - Local Demo Mode"}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isBackendConnected ? "bg-emerald-400 shadow-[0_0_8px_#34d399]" : "bg-amber-400 animate-pulse"
              }`}
            />
            <span className="text-slate-400 hidden lg:inline">
              {isBackendConnected ? "FastAPI Online" : "Demo Fallback"}
            </span>
          </div>
        </div>
      </div>
    </header>
  );
};
