const round = (score) => Math.round(Number(score) || 0);

export function priorityLevel(score) {
  const s = round(score);
  if (s >= 8) return 'high';
  if (s >= 5) return 'mid';
  return 'low';
}

export function priorityLabel(score) {
  const s = round(score);
  if (s >= 8) return 'Critical';
  if (s >= 5) return 'Medium';
  return 'Low';
}

export function priorityColor(score) {
  const s = round(score);
  if (s >= 8) return '#dc2626';
  if (s >= 5) return '#d97706';
  return '#16a34a';
}

export const CATEGORIES = [
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'safety', label: 'Safety' },
  { value: 'environment', label: 'Environment' },
  { value: 'utilities', label: 'Utilities' },
  { value: 'transportation', label: 'Transportation' },
  { value: 'other', label: 'Other' }
];

export const STATUSES = [
  { value: 'pending', label: 'Pending' },
  { value: 'in-progress', label: 'In Progress' },
  { value: 'resolved', label: 'Resolved' },
  { value: 'closed', label: 'Closed' }
];

export const SORTS = [
  { value: '-voteCount', label: 'Most Voted' },
  { value: '-aiPriority', label: 'Highest Priority' },
  { value: '-createdAt', label: 'Newest' },
  { value: 'createdAt', label: 'Oldest' }
];
