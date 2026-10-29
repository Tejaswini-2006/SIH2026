import React, { useState } from 'react';
import { Info, X } from 'lucide-react';

export const DisclaimerBanner: React.FC = () => {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="bg-slate-100/90 border-b border-slate-200/90 px-6 py-2 flex items-center justify-between gap-4 text-xs text-slate-600 shrink-0">
      <div className="flex items-center gap-2 min-w-0">
        <Info className="w-4 h-4 text-slate-500 shrink-0" />
        <span className="truncate">
          <strong className="font-semibold text-slate-700">Prototype Disclaimer:</strong> AERVIS is an architectural demonstration prototype. All institution names, student identifiers (synthetic APAAR), admission records, and verification signals are synthetic demonstration data. No live government APIs or databases are connected.
        </span>
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="text-slate-400 hover:text-slate-600 p-0.5 rounded transition-colors shrink-0"
        title="Dismiss notice for this session"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
