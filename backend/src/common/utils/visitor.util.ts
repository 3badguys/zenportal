import { createHash } from 'crypto';

const salt = () => process.env.VISITOR_SALT || 'my-secret-salt';

export function generateVisitorId(ip: string): string {
  const raw = `${ip}|${salt()}`;
  const hash = createHash('sha256').update(raw).digest('hex');
  return `visitor_${hash.slice(0, 8)}`;
}

export function getVisitorColor(visitorId: string): string {
  const hash = visitorId.replace('visitor_', '');
  const hue = parseInt(hash, 16) % 360;
  return `hsl(${hue}, 70%, 55%)`;
}

export function getDisplayName(visitorId: string, nickname?: string): string {
  if (nickname) return nickname;
  const short = visitorId.replace('visitor_', '');
  return `visitor-${short}`;
}
