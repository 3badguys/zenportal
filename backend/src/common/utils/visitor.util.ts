import { createHash } from 'crypto';

const salt = () => process.env.VISITOR_SALT || 'my-secret-salt';

export function generateVisitorId(ip: string): string {
  const raw = `${ip}|${salt()}`;
  const hash = createHash('sha256').update(raw).digest('hex');
  return `visitor_${hash.slice(0, 8)}`;
}
