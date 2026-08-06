const salt = 'static-salt';

export function generateVisitorId(ip: string): string {
  const raw = `${ip}|${salt}`;
  // Simple hash for frontend display only
  let hash = 0;
  for (let i = 0; i < raw.length; i++) {
    const chr = raw.charCodeAt(i);
    hash = ((hash << 5) - hash) + chr;
    hash |= 0;
  }
  const hex = Math.abs(hash).toString(16).slice(0, 8).padStart(8, '0');
  return `visitor_${hex}`;
}

export function getVisitorColor(visitorId: string): string {
  const hash = visitorId.replace('visitor_', '');
  const hue = parseInt(hash, 16) % 360;
  return `hsl(${hue}, 70%, 55%)`;
}

export function getDisplayName(visitorId: string): string {
  const short = visitorId.replace('visitor_', '');
  return `visitor_${short}`;
}
