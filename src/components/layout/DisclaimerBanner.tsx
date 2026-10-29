import React, { useState, useEffect } from 'react';
import { Info, X } from 'lucide-react';

interface DisclaimerBannerProps {
  onLearnMore: () => void;
}

const STORAGE_DISMISSED_KEY = 'aervis_disclaimer_dismissed_v2';

export const DisclaimerBanner: React.FC<DisclaimerBannerProps> = ({ onLearnMore }) => {
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try {
      return localStorage.getItem(STORAGE_DISMISSED_KEY) === 'true';
    } catch {
      return false;
    }
  });

  const handleDismiss = () => {
    setDismissed(true);
    try {
      localStorage.setItem(STORAGE_DISMISSED_KEY, 'true');
    } catch {
      // ignore
    }
  };

  if (dismissed) return null;

  return (
    <div className="bg-[#F3F4F6] border-b border-[#E5E7EB] px-6 py-1.5 flex items-center justify-between text-xs text-[#4B5563] shrink-0">
      <div className="flex items-center gap-2">
        <Info className="w-3.5 h-3.5 text-[#6B7280] shrink-0" />
        <span>Prototype with synthetic data only.</span>
        <button
          type="button"
          onClick={onLearnMore}
          className="text-[#2457D6] hover:underline font-medium cursor-pointer"
        >
          Learn more
        </button>
      </div>

      <button
        type="button"
        onClick={handleDismiss}
        className="text-[#9CA3AF] hover:text-[#111827] p-0.5 rounded transition-colors cursor-pointer"
        aria-label="Dismiss notice"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
