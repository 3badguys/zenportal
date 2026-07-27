
interface AboutMeProps { content: string; }

export default function AboutMe({ content }: AboutMeProps) {
  return (
    <div className="py-4">
      <h2 className="text-xl font-semibold mb-2 text-gray-900">About Me</h2>
      <p className="text-gray-600 leading-relaxed whitespace-pre-wrap">{content}</p>
    </div>
  );
}
export const blockType = 'AboutMe';
