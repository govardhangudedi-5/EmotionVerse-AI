import React, { useEffect, useState } from "react";
import {
  AudioAnalysisResponse,
  ContextMode,
  FaceAnalysisResponse,
  MultimodalFusionResponse,
  TextAnalysisResponse,
} from "./types/emotion";
import { checkHealth } from "./services/api";
import { Navbar, NavTab } from "./components/Navbar";
import { MedicalDisclaimer } from "./components/MedicalDisclaimer";

// All 9 Pages
import { Dashboard } from "./pages/Dashboard";
import { LiveFace } from "./pages/LiveFace";
import { TextEmotion } from "./pages/TextEmotion";
import { VoiceEmotion } from "./pages/VoiceEmotion";
import { Multimodal } from "./pages/Multimodal";
import { History } from "./pages/History";
import { Evaluation } from "./pages/Evaluation";
import { About } from "./pages/About";
import { Privacy } from "./pages/Privacy";

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<NavTab>("dashboard");
  const [contextMode, setContextMode] = useState<ContextMode>("education");
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  // Active Modality States across session
  const [faceResult, setFaceResult] = useState<FaceAnalysisResponse | null>(null);
  const [audioResult, setAudioResult] = useState<AudioAnalysisResponse | null>(null);
  const [textResult, setTextResult] = useState<TextAnalysisResponse | null>(null);
  const [fusionResult, setFusionResult] = useState<MultimodalFusionResponse | null>(null);

  // Initial and periodic Health Check
  useEffect(() => {
    const pingBackend = async () => {
      const health = await checkHealth();
      setIsBackendConnected(health.status === "healthy");
    };
    pingBackend();
    const interval = setInterval(pingBackend, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#070913] text-slate-100 selection:bg-cyan-500/20 selection:text-cyan-300">
      {/* Top Navigation */}
      <Navbar
        currentTab={currentTab}
        setCurrentTab={setCurrentTab}
        contextMode={contextMode}
        setContextMode={setContextMode}
        isBackendConnected={isBackendConnected}
      />

      {/* Advisory & Limitation Notice Banner */}
      <MedicalDisclaimer contextMode={contextMode} />

      {/* Main Content Area Rendering Active Page */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {currentTab === "dashboard" && (
          <Dashboard
            contextMode={contextMode}
            setContextMode={setContextMode}
            onNavigate={(tab) => setCurrentTab(tab)}
            faceResult={faceResult}
            setFaceResult={setFaceResult}
            audioResult={audioResult}
            textResult={textResult}
            fusionResult={fusionResult}
          />
        )}

        {currentTab === "live-face" && (
          <LiveFace
            onEmotionUpdate={setFaceResult}
            savedResult={faceResult}
            onNavigateToMultimodal={() => setCurrentTab("multimodal")}
          />
        )}

        {currentTab === "text" && (
          <TextEmotion
            onResult={setTextResult}
            savedResult={textResult}
            onNavigateToMultimodal={() => setCurrentTab("multimodal")}
          />
        )}

        {currentTab === "voice" && (
          <VoiceEmotion
            onResult={setAudioResult}
            savedResult={audioResult}
            onNavigateToMultimodal={() => setCurrentTab("multimodal")}
          />
        )}

        {currentTab === "multimodal" && (
          <Multimodal
            contextMode={contextMode}
            faceResult={faceResult}
            setFaceResult={setFaceResult}
            audioResult={audioResult}
            setAudioResult={setAudioResult}
            textResult={textResult}
            setTextResult={setTextResult}
            onNavigateToHistory={() => setCurrentTab("history")}
          />
        )}

        {currentTab === "history" && <History />}

        {currentTab === "evaluation" && <Evaluation />}

        {currentTab === "about" && <About />}

        {currentTab === "privacy" && <Privacy />}
      </main>

      {/* Academic Footer */}
      <footer className="w-full border-t border-slate-900 bg-[#05070e] py-8 text-xs text-slate-500 mt-auto">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">EmotionVerse AI</span>
            <span>&bull;</span>
            <span>Multi-Modal Human Emotion Intelligence System</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
            <span>FastAPI Python</span>
            <span>&bull;</span>
            <span>OpenCV Vision</span>
            <span>&bull;</span>
            <span>Web Audio Prosody</span>
            <span>&bull;</span>
            <span>Decision-Level Late Fusion</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
