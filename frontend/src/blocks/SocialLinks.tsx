import { type ReactNode } from 'react';
import { FiGithub, FiTwitter, FiLinkedin, FiGlobe } from 'react-icons/fi';

const icons: Record<string, ReactNode> = {
  GitHub: <FiGithub />, Twitter: <FiTwitter />, LinkedIn: <FiLinkedin />,
};

interface SocialLinksProps { links: { platform: string; url: string }[]; }

export default function SocialLinks({ links }: SocialLinksProps) {
  return (
    <div className="flex justify-center gap-4 py-4">
      {links.map((l) => (
        <a key={l.platform} href={l.url} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 px-4 py-2 border border-gray-300 rounded-full text-sm text-gray-600 hover:bg-gray-50 transition-colors">
          {icons[l.platform] || <FiGlobe />} {l.platform}
        </a>
      ))}
    </div>
  );
}
export const blockType = 'SocialLinks';
