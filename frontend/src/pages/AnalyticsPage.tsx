import React, { useEffect, useState } from "react";
import {
  Activity,
  Trash2,
  Filter,
  RefreshCw,
  TrendingUp,
  Award,
  Calendar,
  Layers,
  Smile,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";
import { AnalysisHistoryStats, AnalysisRecord, EMOTION_META, EmotionType } from "../types/emotion";
import { deleteAnalysis, fetchHistory, fetchStats } from "../services/api";

export const AnalyticsPage: React.FC = () => {
  const [history, setHistory] = useState<AnalysisRecord[]>([]);
  const [stats, setStats] = useState<AnalysisHistoryStats | null>(null);
  const [modeFilter, setModeFilter] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<number | null>(null);

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
      // Refresh stats
      const newStats = await fetchStats();
      setStats(newStats);
    } catch (err) {
      console.error("Failed to delete analysis record:", err);
    } finally {
      setDeleteId(null);
    }
  };

  // Pie chart data for emotion distribution
  const emotionPieData = stats
    ? Object.entries(stats.emotion_distribution).map(([emotion, count]) => ({
        name: emotion.charAt(0).toUpperCase() + emotion.slice(1),
        value: count,
        color: EMOTION_META[emotion as EmotionType]?.color || "#38bdf8",
      }))
    : [];

  // Timeline data for confidence and emotion evolution
  const timelineData = [...history]
    .reverse()
    .map((record, index) => ({
      index: index + 1,
      time: new Date(record.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      confidence: Math.round(record.confidence * 100),
      emotion: record.final_emotion,
      engagement: record.engagement_level,
    }));

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pt-4 border-b border-slate-800/80 pb-5">
        <div>
          <h2 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Activity className="w-6 h-6 text-cyan-400" />
            Analytics & Session History
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Historical trends, longitudinal mood valence, and emotion frequency statistics
          </p>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-3">
          {/* Mode Filter */}
          <div className="flex items-center gap-1.5 bg-slate-900 px-3 py-1.5 rounded-xl border border-slate-800 text-xs">
            <Filter className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={modeFilter}
              onChange={(e) => setModeFilter(e.target.value)}
              className="bg-transparent text-slate-300 font-medium focus:outline-none cursor-pointer"
            >
              <option value="" className="bg-slate-900 text-slate-200">All Context Modes</option>
              <option value="education" className="bg-slate-900 text-slate-200">Education Only</option>
              <option value="healthcare" className="bg-slate-900 text-slate-200">Healthcare Only</option>
            </select>
          </div>

          <button
            onClick={loadData}
            disabled={isLoading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 border border-slate-800 text-xs font-semibold transition-all"
            title="Refresh history"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? "animate-spin text-cyan-400" : ""}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Stats KPI Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Sessions */}
        <div className="glass-card rounded-2xl p-4 border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
            <Layers className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Total Analyses</div>
            <div className="text-xl font-bold text-white font-mono">
              {stats?.total_analyses || 0}
            </div>
          </div>
        </div>

        {/* Most Frequent Emotion */}
        <div className="glass-card rounded-2xl p-4 border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/30 flex items-center justify-center text-purple-400">
            <Award className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Predominant Emotion</div>
            <div className="text-xl font-bold text-white capitalize">
              {stats?.most_frequent_emotion || "N/A"}
            </div>
          </div>
        </div>

        {/* Avg Confidence */}
        <div className="glass-card rounded-2xl p-4 border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center text-emerald-400">
            <TrendingUp className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Average Confidence</div>
            <div className="text-xl font-bold text-cyan-300 font-mono">
              {stats?.average_confidence ? `${(stats.average_confidence * 100).toFixed(1)}%` : "0%"}
            </div>
          </div>
        </div>

        {/* Positive vs Negative Ratio */}
        <div className="glass-card rounded-2xl p-4 border border-slate-800 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/30 flex items-center justify-center text-blue-400">
            <Smile className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-slate-400">Positive / Negative</div>
            <div className="text-xl font-bold text-white font-mono">
              {stats?.mood_distribution.positive || 0} / {stats?.mood_distribution.negative || 0}
            </div>
          </div>
        </div>
      </div>

      {/* Longitudinal Charts Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Emotion Distribution Pie Chart */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800">
          <h3 className="font-bold text-sm tracking-wide text-white mb-4">
            Emotion Distribution Across Analyses
          </h3>

          {emotionPieData.length > 0 ? (
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={emotionPieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={50}
                    outerRadius={85}
                    paddingAngle={4}
                    dataKey="value"
                  >
                    {emotionPieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0c1022",
                      borderColor: "#1e293b",
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: "#f8fafc",
                    }}
                    formatter={(val) => [`${val} analyses`, "Count"]}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-xs text-slate-500">
              No emotion distribution data recorded yet.
            </div>
          )}
        </div>

        {/* Confidence Timeline Chart */}
        <div className="glass-card rounded-2xl p-6 border border-slate-800">
          <h3 className="font-bold text-sm tracking-wide text-white mb-4">
            Confidence Timeline & Evolution
          </h3>

          {timelineData.length > 0 ? (
            <div className="w-full h-64">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={timelineData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="time" tick={{ fill: "#94a3b8", fontSize: 10 }} />
                  <YAxis domain={[0, 100]} tick={{ fill: "#64748b", fontSize: 10 }} unit="%" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#0c1022",
                      borderColor: "#1e293b",
                      borderRadius: "8px",
                      fontSize: "12px",
                      color: "#f8fafc",
                    }}
                    formatter={(val, _name, item) => [
                      `${val}% (Emotion: ${item.payload.emotion})`,
                      "Confidence",
                    ]}
                  />
                  <Line
                    type="monotone"
                    dataKey="confidence"
                    stroke="#00f0ff"
                    strokeWidth={2}
                    dot={{ fill: "#00f0ff", r: 4 }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center text-xs text-slate-500">
              No timeline data points recorded yet.
            </div>
          )}
        </div>
      </div>

      {/* History Log Table */}
      <div className="glass-card rounded-2xl p-6 border border-slate-800">
        <h3 className="font-bold text-sm tracking-wide text-white mb-4">
          Session Analysis Log
        </h3>

        {history.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-300">
              <thead className="bg-slate-900/80 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="py-3 px-4">Timestamp</th>
                  <th className="py-3 px-4">Context Mode</th>
                  <th className="py-3 px-4">Modalities</th>
                  <th className="py-3 px-4">Final Emotion</th>
                  <th className="py-3 px-4">Confidence</th>
                  <th className="py-3 px-4">Engagement</th>
                  <th className="py-3 px-4">Agreement</th>
                  <th className="py-3 px-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {history.map((record) => {
                  const meta = EMOTION_META[record.final_emotion] || EMOTION_META.neutral;
                  return (
                    <tr key={record.id} className="hover:bg-slate-900/40 transition-colors">
                      <td className="py-3 px-4 text-slate-400 font-mono">
                        {new Date(record.timestamp).toLocaleString([], {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </td>
                      <td className="py-3 px-4 capitalize text-slate-300">
                        {record.context_mode}
                      </td>
                      <td className="py-3 px-4 font-mono text-[11px] text-cyan-400">
                        {record.modalities_used?.join(" + ") || "multimodal"}
                      </td>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full font-bold border ${meta.bgBadge}`}>
                          <span>{meta.emoji}</span>
                          <span className="capitalize">{record.final_emotion}</span>
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-cyan-300 font-bold">
                        {Math.round(record.confidence * 100)}%
                      </td>
                      <td className="py-3 px-4 uppercase font-semibold text-[11px]">
                        <span className={record.engagement_level === "high" ? "text-emerald-400" : record.engagement_level === "low" ? "text-rose-400" : "text-amber-400"}>
                          {record.engagement_level}
                        </span>
                      </td>
                      <td className="py-3 px-4 font-mono text-slate-300">
                        {Math.round(record.agreement_score * 100)}%
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
            No session history records found. Save an analysis from the Results Dashboard to view it here!
          </div>
        )}
      </div>
    </div>
  );
};
