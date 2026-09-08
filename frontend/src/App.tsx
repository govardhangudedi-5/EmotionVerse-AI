import React, { useEffect, useState } from "react";
import {
  AudioAnalysisResponse,
  ContextMode,
  FaceAnalysisResponse,
  MultimodalFusionResponse,
  TextAnalysisResponse,
} from "./types/emotion";
import { checkHealth } from "./services/api";
import { Navbar } from "./components/Navbar";
import { MedicalDisclaimer } from "./components/MedicalDisclaimer";
import { LandingPage } from "./pages/LandingPage";
import { AnalysisPage } from "./pages/AnalysisPage";
import { ResultsPage } from "./pages/ResultsPage";
import { AnalyticsPage } from "./pages/AnalyticsPage";

export const App: React.FC = () => {
  const [currentTab, setCurrentTab] = useState<"landing" | "analysis" | "results" | "analytics">("landing");
  const [contextMode, setContextMode] = useState<ContextMode>("education");
  const [isBackendConnected, setIsBackendConnected] = useState(false);

  // Modality States
  const [faceResult, setFaceResult] = useState<FaceAnalysisResponse | null>(null);
  const [audioResult, setAudioResult] = useState<AudioAnalysisResponse | null>(null);
  const [textResult, setTextResult] = useState<TextAnalysisResponse | null>(null);
  const [fusionResult, setFusionResult] = useState<MultimodalFusionResponse | null>(null);

  // Initial Health Check
  useEffect(() => {
    const pingBackend = async () => {
      const health = await checkHealth();
      setIsBackendConnected(health.status === "healthy");
    };
    pingBackend();
    const interval = setInterval(pingBackend, 15000);
    return () => clearInterval(interval);
  }, []);

  const handleFusionComplete = (result: MultimodalFusionResponse) => {
    setFusionResult(result);
    setCurrentTab("results");
  };

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

      {/* Medical and Privacy Advisory */}
      <MedicalDisclaimer contextMode={contextMode} />

      {/* Main Content Area */}
      <main className="flex-1 w-full max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        {currentTab === "landing" && (
          <LandingPage
            onStartAnalysis={() => setCurrentTab("analysis")}
            onExploreResults={() => setCurrentTab("results")}
            contextMode={contextMode}
            setContextMode={setContextMode}
          />
        )}

        {currentTab === "analysis" && (
          <AnalysisPage
            contextMode={contextMode}
            faceResult={faceResult}
            setFaceResult={setFaceResult}
            audioResult={audioResult}
            setAudioResult={setAudioResult}
            textResult={textResult}
            setTextResult={setTextResult}
            onFusionComplete={handleFusionComplete}
          />
        )}

        {currentTab === "results" && (
          <ResultsPage
            fusionResult={fusionResult}
            faceResult={faceResult}
            audioResult={audioResult}
            textResult={textResult}
            onNavigateToStudio={() => setCurrentTab("analysis")}
            onNavigateToHistory={() => setCurrentTab("analytics")}
          />
        )}

        {currentTab === "analytics" && <AnalyticsPage />}
      </main>

      {/* Academic Footer */}
      <footer className="w-full border-t border-slate-900 bg-[#05070e] py-8 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <span className="font-bold text-slate-300">EmotionVerse AI</span>
            <span>&bull;</span>
            <span>Academic Deep Learning & Human-Computer Interaction Project</span>
          </div>
          <div className="flex items-center gap-3 font-mono text-[11px] text-slate-400">
            <span>FastAPI</span>
            <span>&bull;</span>
            <span>OpenCV</span>
            <span>&bull;</span>
            <span>Librosa / SoundFile</span>
            <span>&bull;</span>
            <span>React + Vite</span>
            <span>&bull;</span>
            <span>Late Fusion</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default App;
