import React, { useState } from "react";
import { AlertTriangle, ShieldCheck, X } from "lucide-react";
import { ContextMode } from "../types/emotion";

interface MedicalDisclaimerProps {
  contextMode: ContextMode;
}

export const MedicalDisclaimer: React.FC<MedicalDisclaimerProps> = ({ contextMode }) => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <aside aria-label="Medical and Privacy Notice" className="w-full bg-gradient-to-r from-amber-500/10 via-purple-500/10 to-blue-500/10 border-b border-amber-500/20 px-4 py-2 text-xs">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-slate-300">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
          <span>
            <strong className="text-amber-300 font-semibold">Academic & Research Notice: </strong>
            EmotionVerse AI is an educational demonstration system. It is{" "}
            <strong className="text-amber-200 underline">NOT</strong> a certified medical diagnostic device.
            {contextMode === "healthcare" &&
              " For emotional distress, consult a licensed healthcare professional."}
          </span>
        </div>

        <div className="flex items-center gap-3 text-slate-400">
          <div className="flex items-center gap-1 text-[11px]">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Zero-Retention Privacy (In-Memory Processing)</span>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="text-slate-400 hover:text-slate-200 p-0.5 rounded hover:bg-slate-800"
            title="Dismiss notice"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </aside>
  );
};
