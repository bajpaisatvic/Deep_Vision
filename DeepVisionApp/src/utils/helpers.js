import { format, formatDistanceToNow } from 'date-fns';

export function formatDate(dateStr) {
  if (!dateStr) return '—';
  try {
    return format(new Date(dateStr), 'dd MMM yyyy, hh:mm a');
  } catch {
    return dateStr;
  }
}

export function timeAgo(dateStr) {
  if (!dateStr) return '—';
  try {
    return formatDistanceToNow(new Date(dateStr), { addSuffix: true });
  } catch {
    return dateStr;
  }
}

export function confidenceColor(score) {
  if (score >= 0.8) return '#10b981';
  if (score >= 0.6) return '#f59e0b';
  return '#ef4444';
}

export function confidenceLabel(score) {
  if (score >= 0.8) return 'High';
  if (score >= 0.6) return 'Medium';
  return 'Low';
}

export function capitalize(str) {
  if (!str) return '';
  return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
}
