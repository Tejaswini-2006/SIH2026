import React from 'react';
import { StatusChip, StatusVariant } from './StatusChip';

interface SeverityChipProps {
  severity?: 'Blocking Error' | 'Warning' | 'Review Required' | 'Informational' | string;
  status?: string;
  size?: 'sm' | 'md';
}

export const SeverityChip: React.FC<SeverityChipProps> = ({ severity, status, size = 'sm' }) => {
  const value = severity || status || '';
  let variant: StatusVariant = 'neutral';

  switch (value) {
    case 'Blocking Error':
    case 'High':
    case 'Urgent':
      variant = 'danger';
      break;
    case 'Warning':
    case 'Moderate':
      variant = 'warning';
      break;
    case 'Review Required':
      variant = 'info';
      break;
    case 'Informational':
    case 'Low':
    case 'Normal':
      variant = 'neutral';
      break;
    case 'Valid':
    case 'Cleared':
    case 'Corrected':
    case 'Resolved':
      variant = 'success';
      break;
    default:
      variant = 'neutral';
  }

  return <StatusChip label={value || 'Unknown'} variant={variant} size={size} />;
};
