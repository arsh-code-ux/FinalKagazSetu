const DAY_IN_MS = 24 * 60 * 60 * 1000;

export function daysUntil(dateValue, now = new Date()) {
  const target = new Date(dateValue).getTime();
  if (Number.isNaN(target)) return null;
  return Math.ceil((target - now.getTime()) / DAY_IN_MS);
}

export function emergencyAccessOpen(notifiedAt, waitDays, now = new Date()) {
  if (!notifiedAt) return false;
  const target = new Date(notifiedAt).getTime() + Number(waitDays || 0) * DAY_IN_MS;
  return now.getTime() >= target;
}
