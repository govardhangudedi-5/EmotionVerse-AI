import React from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { EmotionType, EMOTION_META } from "../types/emotion";

interface EmotionBarChartProps {
  probabilities: Record<EmotionType, number>;
}

export const EmotionBarChart: React.FC<EmotionBarChartProps> = ({ probabilities }) => {
  const data = Object.entries(probabilities || {}).map(([emotion, prob]) => {
    const emotionKey = emotion as EmotionType;
    return {
      name: emotion.charAt(0).toUpperCase() + emotion.slice(1),
      prob: Math.round(prob * 100),
      rawKey: emotionKey,
      color: EMOTION_META[emotionKey]?.color || "#38bdf8",
    };
  });

  return (
    <div className="w-full h-72">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
          <XAxis
            dataKey="name"
            tick={{ fill: "#94a3b8", fontSize: 11 }}
            axisLine={{ stroke: "#334155" }}
          />
          <YAxis
            domain={[0, 100]}
            tick={{ fill: "#64748b", fontSize: 10 }}
            axisLine={{ stroke: "#334155" }}
            unit="%"
          />
          <Tooltip
            cursor={{ fill: "rgba(255, 255, 255, 0.04)" }}
            contentStyle={{
              backgroundColor: "#0c1022",
              borderColor: "#1e293b",
              borderRadius: "8px",
              fontSize: "12px",
              color: "#f8fafc",
            }}
            formatter={(val) => [`${val}%`, "Likelihood"]}
          />
          <Bar dataKey="prob" radius={[6, 6, 0, 0]}>
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
