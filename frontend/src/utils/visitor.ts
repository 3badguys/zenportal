export function getVisitorColor(visitorId: string): string {
  const hash = visitorId.replace('visitor_', '');
  const hue = parseInt(hash, 16) % 360;
  return `hsl(${hue}, 70%, 55%)`;
}

export function getDisplayName(visitorId: string): string {
  const short = visitorId.replace('visitor_', '');
  return `visitor_${short}`;
}
