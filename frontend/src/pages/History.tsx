import React, { useEffect, useState } from "react";
import {
  Activity,
  Trash2,
  Filter,
  RefreshCw,
  Download,
  Calendar,
  Layers,
  Award,
  TrendingUp,
  FileSpreadsheet,
  FileJson,
  AlertTriangle,
  CheckCircle2,
} from "lucide-react";
import { AnalysisHistoryStats, AnalysisRecord, EMOTION_META, EmotionType } from "../types/emotion";
import { deleteAnalysis, fetchHistory, fetchStats } from "../services/api";
import { formatRecordDateTime, parseUtcDate } from "../utils/dateUtils";

export const History: React.FC = () => {
  const [history, setHistory] = useState<AnalysisRecord[]>([]);
  const [stats, setStats] = useState<AnalysisHistoryStats | null>(null);
  const [modeFilter, setModeFilter] = useState<string>("");
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [selectedRecord, setSelectedRecord] = useState<AnalysisRecord | null>(null);
  const [showClearConfirm, setShowClearConfirm] = useState<boolean>(false);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [historyData, statsData] = await Promise.all([
        fetchHistory(50, modeFilter || undefined),
        fetchStats(),
      ]);
      setHistory(historyData);
      setStats(statsData);
    } catch (err) {
      console.error("Error loading analytics data:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [modeFilter]);

  const handleDelete = async (id: number) => {
    try {
      await deleteAnalysis(id);
      setHistory(history.filter((h) => h.id !== id));
      const newStats = await fetchStats();
      setStats(newStats);
    } catch (err) {
      console.error("Failed to delete record:", err);
    }
  };

  const handleClearAll = async () => {
    try {
      for (const record of history) {
        await deleteAnalysis(record.id);
      }
      setHistory([]);
      const newStats = await fetchStats();
      setStats(newStats);
      setShowClearConfirm(false);
    } catch (err) {
      console.error("Failed to clear history:", err);
    }
  };

  // Export to CSV
  const exportCSV = () => {
    if (history.length === 0) return;

    const headers = [
      "ID",
      "Timestamp",
      "Context Mode",
      "Face Emotion",
      "Face Confidence",
      "Text Emotion",
      "Text Confidence",
      "Voice Emotion",
      "Voice Confidence",
      "Final Emotion",
      "Combined Confidence",
      "Agreement Score",
      "Modalities Used",
    ];

    const rows = history.map((r) => [
      r.id,
      `"${formatRecordDateTime(r.timestamp).fullDateTime}"`,
      r.context_mode,
      r.face_emotion || "none",
      r.face_confidence !== undefined ? r.face_confidence : "N/A",
      r.text_emotion || "none",
      r.text_confidence !== undefined ? r.text_confidence : "N/A",
      r.audio_emotion || "none",
      r.audio_confidence !== undefined ? r.audio_confidence : "N/A",
      r.final_emotion,
      r.confidence,
      r.agreement_score,
      `"${r.modalities_used?.join(", ") || "multimodal"}"`,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `emotionverse_history_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Export to JSON
  const exportJSON = () => {
    if (history.length === 0) return;

    const dataStr =
      "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(history, null, 2));
    const downloadAnchor = document.createElement("a");
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute(
      "download",
      `emotionverse_history_${new Date().toISOString().slice(0, 10)}.json`
    );
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-2 border-b border-slate-800/80 pb-5">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-cyan-400" />
            Session History & Exports
          </h1>
          <p className="text-xs text-slate-400 mt-0.5">
            View, audit, clear, and export saved multimodal emotion sessions to CSV and JSON formats.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Export CSV */}
          <button
            onClick={exportCSV}
            disabled={history.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold transition-all disabled:opacity-30"
          >
            <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
            <span>Export CSV</span>
          </button>

          {/* Export JSON */}
          <button
            onClick={exportJSON}
            disabled={history.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-700 text-xs font-semibold transition-all disabled:opacity-30"
          >
            <FileJson className="w-3.5 h-3.5 text-blue-400" />
            <span>Export JSON</span>
          </button>

          {/* Clear Session */}
          <button
            onClick={() => setShowClearConfirm(true)}
            disabled={history.length === 0}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-300 border border-rose-500/30 text-xs font-semibold transition-all disabled:opacity-30"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear History</span>
          </button>

          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold transition-all"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-cyan-400" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Clear Confirmation Modal */}
      {showClearConfirm && (
        <div className="p-4 rounded-2xl bg-rose-500/10 border border-rose-500/40 text-xs text-rose-300 flex items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0 text-rose-400" />
            <span>
              Are you sure you want to clear all session records? This action cannot be undone.
            </span>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleClearAll}
              className="px-3 py-1 rounded-lg bg-rose-600 hover:bg-rose-500 text-white font-bold"
            >
              Confirm Clear
            </button>
            <button
              onClick={() => setShowClearConfirm(false)}
              className="px-3 py-1 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="glass-card rounded-2xl p-4 border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Total Records</div>
            <div className="text-xl font-bold text-white font-mono">{history.length}</div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Dominant Emotion</div>
            <div className="text-xl font-bold text-white capitalize">
              {stats?.most_frequent_emotion || "N/A"}
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Average Confidence</div>
            <div className="text-xl font-bold text-cyan-300 font-mono">
              {stats?.average_confidence ? `${(stats.average_confidence * 100).toFixed(0)}%` : "N/A"}
            </div>
          </div>
        </div>

        <div className="glass-card rounded-2xl p-4 border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Session Context</div>
            <div className="text-sm font-bold text-white capitalize">
              {modeFilter || "All Contexts"}
            </div>
          </div>
        </div>
      </div>

      {/* History Table */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <h3 className="font-bold text-sm tracking-wide text-white">
            Multimodal Session Records
          </h3>

          {/* Filter */}
          <div className="flex items-center gap-2 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="bg-transparent text-slate-300 font-medium focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-slate-900 text-slate-200">All Modes</option>
              <option value="education" className="bg-slate-900 text-slate-200">Education Only</option>
              <option value="healthcare" className="bg-slate-900 text-slate-200">Healthcare Only</option>
            </select>
          </div>
        </div>

        {history.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Date & Time</th>
                  <th className="py-3 px-4">Mode</th>
                  <th className="py-3 px-4">Face Emotion</th>
                  <th className="py-3 px-4">Text Emotion</th>
                  <th className="py-3 px-4">Voice Emotion</th>
                  <th className="py-3 px-4">Overall Emotion</th>
                  <th className="py-3 px-4">Combined Confidence</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-mono">
                {history.map((record) => {
                  const finalMeta = EMOTION_META[record.final_emotion] || EMOTION_META.neutral;
                  const dt = formatRecordDateTime(record.timestamp);
                  return (
                    <tr key={record.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4 text-slate-300">
                        <div className="flex flex-col">
                          <div className="flex items-center gap-1.5">
                            <span className="font-mono font-bold text-white text-xs">
                              {dt.timeFormatted}
                            </span>
                            {dt.relativeBadge && (
                              <span className="px-1.5 py-0.5 rounded text-[10px] bg-emerald-500/15 text-emerald-400 font-sans font-medium border border-emerald-500/30">
                                {dt.relativeBadge}
                              </span>
                            )}
                          </div>
                          <span
                            className={`text-[10px] font-sans mt-0.5 ${
                              dt.isToday ? "text-cyan-400 font-semibold" : "text-slate-500"
                            }`}
                          >
                            {dt.dateLabel}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 capitalize font-sans text-slate-300">
                        {record.context_mode}
                      </td>
                      <td className="py-3 px-4">
                        {record.face_emotion ? (
                          <span className="flex items-center gap-1">
                            <span>{EMOTION_META[record.face_emotion]?.emoji}</span>
                            <span className="capitalize">{record.face_emotion}</span>
                            <span className="text-slate-500 text-[10px]">
                              ({Math.round((record.face_confidence || 0) * 100)}%)
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {record.text_emotion ? (
                          <span className="flex items-center gap-1">
                            <span>{EMOTION_META[record.text_emotion]?.emoji}</span>
                            <span className="capitalize">{record.text_emotion}</span>
                            <span className="text-slate-500 text-[10px]">
                              ({Math.round((record.text_confidence || 0) * 100)}%)
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {record.audio_emotion ? (
                          <span className="flex items-center gap-1">
                            <span>{EMOTION_META[record.audio_emotion]?.emoji}</span>
                            <span className="capitalize">{record.audio_emotion}</span>
                            <span className="text-slate-500 text-[10px]">
                              ({Math.round((record.audio_confidence || 0) * 100)}%)
                            </span>
                          </span>
                        ) : (
                          <span className="text-slate-600">—</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-sans">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold border ${finalMeta.bgBadge}`}>
                          <span>{finalMeta.emoji}</span>
                          <span className="capitalize">{record.final_emotion}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 text-cyan-300 font-bold">
                        {Math.round(record.confidence * 100)}%
                      </td>
                      <td className="py-3 px-4 text-right">
                        <button
                          onClick={() => handleDelete(record.id)}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition-colors"
                          title="Delete record"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="py-12 text-center text-xs text-slate-500">
            No session history recorded yet. Run a Multimodal analysis and click Save to History!
          </div>
        )}
      </div>
    </div>
  );
};
