import React from 'react';
import { AlertCircle, AlertTriangle, Info, CheckCircle2, ShieldAlert } from 'lucide-react';
import { StatusChip, StatusVariant } from './StatusChip';

interface SeverityChipProps {
  severity?: 'Blocking Error' | 'Warning' | 'Review Required' | 'Informational' | string;
  status?: string;
  size?: 'sm' | 'md';
  muted?: boolean;
}

export const SeverityChip: React.FC<SeverityChipProps> = ({
  severity,
  status,
  size = 'sm',
  muted = false,
}) => {
  const value = severity || status || '';
  let variant: StatusVariant = 'neutral';
  let IconComponent: React.ComponentType<{ className?: string }> | undefined;

  switch (value) {
    case 'Blocking Error':
    case 'High':
    case 'Urgent':
      variant = muted ? 'muted' : 'danger';
      IconComponent = ShieldAlert;
      break;
    case 'Warning':
    case 'Moderate':
      variant = muted ? 'muted' : 'warning';
      IconComponent = AlertTriangle;
      break;
    case 'Review Required':
      variant = muted ? 'muted' : 'info';
      IconComponent = AlertCircle;
      break;
    case 'Informational':
    case 'Low':
    case 'Normal':
      variant = muted ? 'muted' : 'neutral';
      IconComponent = Info;
      break;
    case 'Valid':
    case 'Cleared':
    case 'Corrected':
    case 'Resolved':
      variant = muted ? 'muted' : 'success';
      IconComponent = CheckCircle2;
      break;
    default:
      variant = muted ? 'muted' : 'neutral';
  }

  return (
    <StatusChip
      label={value || 'Unknown'}
      variant={variant}
      size={size}
      icon={IconComponent}
    />
  );
};
