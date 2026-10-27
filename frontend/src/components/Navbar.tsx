import React, { useState } from "react";
import {
  Brain,
  Camera,
  MessageSquare,
  Mic,
  Cpu,
  Activity,
  Award,
  Info,
  ShieldCheck,
  HeartPulse,
  GraduationCap,
  Sparkles,
  Menu,
  X,
  LayoutDashboard,
} from "lucide-react";
import { ContextMode } from "../types/emotion";

export type NavTab =
  | "dashboard"
  | "healthcare"
  | "education"
  | "live-face"
  | "text"
  | "voice"
  | "multimodal"
  | "history"
  | "evaluation"
  | "about"
  | "privacy";

interface NavbarProps {
  currentTab: NavTab;
  setCurrentTab: (tab: NavTab) => void;
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
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navItems: { id: NavTab; label: string; icon: React.ReactNode; badge?: string }[] = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-3.5 h-3.5" /> },
    {
      id: "healthcare",
      label: "Healthcare",
      icon: <HeartPulse className="w-3.5 h-3.5 text-rose-400" />,
      badge: "NEW",
    },
    {
      id: "education",
      label: "Education",
      icon: <GraduationCap className="w-3.5 h-3.5 text-blue-400" />,
      badge: "NEW",
    },
    {
      id: "live-face",
      label: "Live Face",
      icon: <Camera className="w-3.5 h-3.5 text-cyan-400" />,
      badge: "LIVE",
    },
    { id: "text", label: "Text Emotion", icon: <MessageSquare className="w-3.5 h-3.5 text-blue-400" /> },
    { id: "voice", label: "Voice Emotion", icon: <Mic className="w-3.5 h-3.5 text-purple-400" /> },
    { id: "multimodal", label: "Multimodal", icon: <Cpu className="w-3.5 h-3.5 text-cyan-400" /> },
    { id: "history", label: "History", icon: <Activity className="w-3.5 h-3.5" /> },
    { id: "evaluation", label: "Evaluation", icon: <Award className="w-3.5 h-3.5" /> },
    { id: "about", label: "About", icon: <Info className="w-3.5 h-3.5" /> },
    { id: "privacy", label: "Privacy", icon: <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" /> },
  ];

  const handleSelectTab = (tab: NavTab) => {
    setCurrentTab(tab);
    setMobileMenuOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-800/80 bg-[#070913]/90 backdrop-blur-xl">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-2">
        {/* Brand */}
        <div
          onClick={() => handleSelectTab("dashboard")}
          className="flex items-center gap-3 cursor-pointer group shrink-0"
        >
          <div className="relative w-9 h-9 rounded-xl bg-gradient-to-tr from-cyan-500 via-blue-600 to-purple-600 p-[1.5px] shadow-lg shadow-cyan-500/20 group-hover:shadow-cyan-500/40 transition-all">
            <div className="w-full h-full bg-[#070913] rounded-[10px] flex items-center justify-center">
              <Brain className="w-4 h-4 text-cyan-400 group-hover:scale-110 transition-transform" />
            </div>
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-extrabold text-base tracking-tight bg-gradient-to-r from-white via-slate-100 to-cyan-300 bg-clip-text text-transparent">
                EmotionVerse
              </span>
              <span className="text-[9px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                AI
              </span>
            </div>
            <p className="text-[10px] text-slate-400 font-medium hidden sm:block">
              Multi-Modal Emotion Intelligence
            </p>
          </div>
        </div>

        {/* Desktop Navigation Links */}
        <nav className="hidden xl:flex items-center gap-1 bg-slate-900/60 p-1 rounded-xl border border-slate-800/60">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30 shadow-sm"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-800/40"
                }`}
              >
                {item.icon}
                <span>{item.label}</span>
                {item.badge && (
                  <span className="text-[8px] font-extrabold px-1 py-0.2 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 animate-pulse">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        {/* Right Controls: Mode Toggle & Health Indicator */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Mode Switcher */}
          <div className="flex items-center bg-slate-900/80 p-1 rounded-xl border border-slate-800">
            <button
              onClick={() => setContextMode("education")}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                contextMode === "education"
                  ? "bg-blue-600/30 text-blue-300 border border-blue-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Education Mode: Focus on cognitive engagement, confusion signals, and learning"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Edu</span>
            </button>
            <button
              onClick={() => setContextMode("healthcare")}
              className={`flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium transition-all ${
                contextMode === "healthcare"
                  ? "bg-purple-600/30 text-purple-300 border border-purple-500/40 shadow-sm"
                  : "text-slate-400 hover:text-slate-200"
              }`}
              title="Healthcare Mode: Non-diagnostic supportive wellness & grounding"
            >
              <HeartPulse className="w-3.5 h-3.5" />
              <span className="hidden sm:inline text-[11px]">Health</span>
            </button>
          </div>

          {/* Backend Status Indicator */}
          <div
            className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-slate-900 border border-slate-800 text-[10px]"
            title={
              isBackendConnected
                ? "Connected to FastAPI Backend Engine"
                : "FastAPI Backend Offline — Operating in Client-Side Real-Time Mode"
            }
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isBackendConnected
                  ? "bg-emerald-400 shadow-[0_0_8px_#34d399]"
                  : "bg-cyan-400 animate-pulse"
              }`}
            />
            <span className="text-slate-400 hidden lg:inline font-mono">
              {isBackendConnected ? "FastAPI Online" : "Local AI"}
            </span>
          </div>

          {/* Mobile Menu Toggle Button */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="xl:hidden p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 hover:text-white"
          >
            {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="xl:hidden bg-[#070913]/95 border-b border-slate-800 p-4 space-y-1 animate-fade-in backdrop-blur-2xl">
          {navItems.map((item) => {
            const isActive = currentTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => handleSelectTab(item.id)}
                className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-semibold transition-all ${
                  isActive
                    ? "bg-cyan-500/15 text-cyan-300 border border-cyan-500/30"
                    : "text-slate-400 hover:text-slate-200 hover:bg-slate-900"
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {item.icon}
                  <span>{item.label}</span>
                </div>
                {item.badge && (
                  <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300 border border-cyan-500/40">
                    {item.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}
    </header>
  );
};
